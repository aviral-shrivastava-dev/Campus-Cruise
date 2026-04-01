const fc = require('fast-check');
const { User, Ride, sequelize } = require('../index');

describe('Ride Model Property-Based Tests', () => {
  let testDriver;

  beforeAll(async () => {
    // Sync database before tests
    await sequelize.sync({ force: true });
    
    // Create a test driver for ride creation
    testDriver = await User.create({
      email: 'testdriver@example.com',
      password: 'password123',
      name: 'Test Driver',
      college: 'Test College',
      phone: '1234567890',
      role: ['driver']
    });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up rides after each test
    await Ride.destroy({ where: {}, force: true });
  });

  /**
   * Feature: campus-cruise, Property 8: Past departure times are rejected
   * Validates: Requirements 3.2
   */
  test('Property 8: Past departure times are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 50 }),
          destination: fc.string({ minLength: 2, maxLength: 50 }),
          // Generate dates in the past (1 day to 365 days ago)
          daysAgo: fc.integer({ min: 1, max: 365 }),
          totalSeats: fc.integer({ min: 1, max: 10 })
        }),
        async (rideData) => {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - rideData.daysAgo);
          
          // Attempt to create ride with past departure time
          await expect(
            Ride.create({
              driverId: testDriver.id,
              source: rideData.source,
              destination: rideData.destination,
              departureTime: pastDate,
              availableSeats: rideData.totalSeats,
              totalSeats: rideData.totalSeats
            })
          ).rejects.toThrow('Departure time must be in the future');
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout

  /**
   * Feature: campus-cruise, Property 9: Invalid seat counts are rejected
   * Validates: Requirements 3.3
   */
  test('Property 9: Invalid seat counts are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 50 }),
          destination: fc.string({ minLength: 2, maxLength: 50 }),
          daysInFuture: fc.integer({ min: 1, max: 30 }),
          // Generate invalid seat counts (zero, negative)
          invalidSeats: fc.oneof(
            fc.constant(0),
            fc.integer({ min: -100, max: -1 })
          )
        }),
        async (rideData) => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + rideData.daysInFuture);
          
          // Attempt to create ride with invalid seat count
          await expect(
            Ride.create({
              driverId: testDriver.id,
              source: rideData.source,
              destination: rideData.destination,
              departureTime: futureDate,
              availableSeats: rideData.invalidSeats,
              totalSeats: rideData.invalidSeats
            })
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout
});
