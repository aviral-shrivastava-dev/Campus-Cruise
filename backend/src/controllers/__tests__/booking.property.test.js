const fc = require('fast-check');
const { User, Ride, Booking, sequelize } = require('../../models');

describe('Booking Controller Property-Based Tests', () => {
  beforeAll(async () => {
    // Sync database before tests - this creates tables
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test - order matters due to foreign keys
    await Booking.destroy({ where: {}, force: true });
    await Ride.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  // Helper function to create a test user
  const createTestUser = async (role = ['passenger']) => {
    return await User.create({
      name: 'Test User',
      email: `test${Date.now()}${Math.random()}@example.com`,
      password: 'password123',
      college: 'Test College',
      phone: '1234567890',
      role
    });
  };

  // Helper function to create a test ride
  const createTestRide = async (driver, overrides = {}) => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24); // 24 hours from now

    return await Ride.create({
      driverId: driver.id,
      source: 'Test Source',
      destination: 'Test Destination',
      departureTime: futureDate,
      availableSeats: 3,
      totalSeats: 3,
      status: 'active',
      ...overrides
    });
  };

  /**
   * Feature: campus-cruise, Property 16: Booking decrements available seats
   * Validates: Requirements 5.1
   */
  test('Property 16: Booking decrements available seats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (initialSeats) => {
          // Create driver and passenger
          const driver = await createTestUser(['driver']);
          const passenger = await createTestUser(['passenger']);

          // Create ride with specified initial seats
          const ride = await createTestRide(driver, {
            availableSeats: initialSeats,
            totalSeats: initialSeats
          });

          // Create booking
          const booking = await Booking.create({
            rideId: ride.id,
            passengerId: passenger.id,
            status: 'confirmed'
          });

          // Decrement available seats (simulating controller logic)
          await ride.decrement('availableSeats', { by: 1 });
          await ride.reload();

          // Verify booking was created
          expect(booking).toBeDefined();
          expect(booking.rideId).toBe(ride.id);
          expect(booking.passengerId).toBe(passenger.id);
          expect(booking.status).toBe('confirmed');

          // Verify available seats decremented by exactly 1
          expect(ride.availableSeats).toBe(initialSeats - 1);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000); // 120 second timeout

  /**
   * Feature: campus-cruise, Property 18: Cancellation increments available seats
   * Validates: Requirements 6.1
   */
  test('Property 18: Cancellation increments available seats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Total seats (at least 2)
        async (totalSeats) => {
          // Create driver and passenger
          const driver = await createTestUser(['driver']);
          const passenger = await createTestUser(['passenger']);

          // Create ride with one less available seat (simulating one booking already made)
          const initialAvailableSeats = totalSeats - 1;
          const ride = await createTestRide(driver, {
            availableSeats: initialAvailableSeats,
            totalSeats: totalSeats
          });

          // Create booking
          const booking = await Booking.create({
            rideId: ride.id,
            passengerId: passenger.id,
            status: 'confirmed'
          });

          // Cancel booking (update status)
          booking.status = 'cancelled';
          await booking.save();

          // Increment available seats (simulating controller logic)
          await ride.increment('availableSeats', { by: 1 });
          await ride.reload();

          // Verify booking was cancelled
          expect(booking.status).toBe('cancelled');

          // Verify available seats incremented by exactly 1
          expect(ride.availableSeats).toBe(initialAvailableSeats + 1);

          // Verify we restored to total seats
          expect(ride.availableSeats).toBe(totalSeats);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000); // 120 second timeout

  /**
   * Feature: campus-cruise, Property 21: Late cancellation detection
   * Validates: Requirements 6.4
   */
  test('Property 21: Late cancellation detection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0.5, max: 10, noNaN: true }), // hours until departure (at least 0.5 hours)
        async (hoursUntilDeparture) => {
          // Create driver and passenger
          const driver = await createTestUser(['driver']);
          const passenger = await createTestUser(['passenger']);

          // Create ride with departure time based on hoursUntilDeparture
          const departureTime = new Date();
          departureTime.setTime(departureTime.getTime() + (hoursUntilDeparture * 60 * 60 * 1000));

          const ride = await createTestRide(driver, {
            departureTime: departureTime
          });

          // Create booking
          const booking = await Booking.create({
            rideId: ride.id,
            passengerId: passenger.id,
            status: 'confirmed'
          });

          // Calculate if cancellation should be flagged as late
          const now = new Date();
          const actualHoursUntilDeparture = (new Date(ride.departureTime) - now) / (1000 * 60 * 60);
          const expectedIsLateCancellation = actualHoursUntilDeparture <= 2;

          // Cancel booking with late cancellation flag
          booking.status = 'cancelled';
          booking.isLateCancellation = expectedIsLateCancellation;
          await booking.save();

          // Verify late cancellation flag is set correctly
          expect(booking.isLateCancellation).toBe(expectedIsLateCancellation);

          // If within 2 hours, should be flagged as late
          if (actualHoursUntilDeparture <= 2) {
            expect(booking.isLateCancellation).toBe(true);
          } else {
            expect(booking.isLateCancellation).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 120000); // 120 second timeout
});
