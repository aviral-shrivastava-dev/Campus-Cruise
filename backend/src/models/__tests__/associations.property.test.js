const fc = require('fast-check');
const { User, Ride, Booking, Message, Review, sequelize } = require('../index');

describe('Database Associations Property-Based Tests', () => {
  beforeAll(async () => {
    // Sync database before tests - this creates tables
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  // Clean up between each property test (not between iterations)
  afterEach(async () => {
    // Clean up after each test in reverse order of dependencies
    await Review.destroy({ where: {}, force: true });
    await Message.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await Ride.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  // Helper to generate non-empty alphanumeric strings (no whitespace-only strings)
  const nonEmptyString = (minLength, maxLength) => 
    fc.string({ minLength, maxLength })
      .filter(s => s.trim().length >= minLength)
      .map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'a').substring(0, maxLength).padEnd(minLength, 'a'));

  /**
   * Feature: campus-cruise, Property 70: User-Ride one-to-many relationship
   * Validates: Requirements 18.2
   */
  test('Property 70: User-Ride one-to-many relationship', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          driverData: fc.record({
            password: nonEmptyString(8, 50),
            name: nonEmptyString(2, 50),
            college: nonEmptyString(2, 50),
            phone: nonEmptyString(10, 15)
          }),
          // Generate 1-5 rides for the driver
          numRides: fc.integer({ min: 1, max: 5 }),
          ridesData: fc.array(
            fc.record({
              source: nonEmptyString(2, 50),
              destination: nonEmptyString(2, 50),
              daysInFuture: fc.integer({ min: 1, max: 30 }),
              totalSeats: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        async ({ driverData, numRides, ridesData }) => {
          try {
            // Generate unique email for this iteration
            const driverEmail = `driver${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
            
            // Create a driver
            const driver = await User.create({
              ...driverData,
              email: driverEmail,
              role: ['driver']
            });

            // Create multiple rides for this driver
            const ridesToCreate = ridesData.slice(0, Math.min(numRides, ridesData.length));
            const createdRides = [];
            
            for (const rideData of ridesToCreate) {
              const futureDate = new Date();
              futureDate.setDate(futureDate.getDate() + rideData.daysInFuture);
              
              const ride = await Ride.create({
                driverId: driver.id,
                source: rideData.source,
                destination: rideData.destination,
                departureTime: futureDate,
                availableSeats: rideData.totalSeats,
                totalSeats: rideData.totalSeats
              });
              createdRides.push(ride);
            }

            // Verify one-to-many relationship: User can have multiple rides
            const driverWithRides = await User.findByPk(driver.id, {
              include: [{ model: Ride, as: 'ridesAsDriver' }]
            });

            // Should have exactly the number of rides we created
            expect(driverWithRides.ridesAsDriver).toHaveLength(ridesToCreate.length);
            
            // All rides should belong to this driver
            driverWithRides.ridesAsDriver.forEach(ride => {
              expect(ride.driverId).toBe(driver.id);
            });

            // Verify from the other side: each ride should reference the driver
            for (const ride of createdRides) {
              const rideWithDriver = await Ride.findByPk(ride.id, {
                include: [{ model: User, as: 'driver' }]
              });
              expect(rideWithDriver.driver.id).toBe(driver.id);
            }

            // Clean up after this iteration
            await Ride.destroy({ where: { driverId: driver.id }, force: true });
            await User.destroy({ where: { id: driver.id }, force: true });
          } catch (error) {
            // Log the actual error for debugging
            console.error('Test error:', error.message, error.name);
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout

  /**
   * Feature: campus-cruise, Property 71: Ride-Booking one-to-many relationship
   * Validates: Requirements 18.3
   */
  test('Property 71: Ride-Booking one-to-many relationship', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          driverData: fc.record({
            password: nonEmptyString(8, 50),
            name: nonEmptyString(2, 50),
            college: nonEmptyString(2, 50),
            phone: nonEmptyString(10, 15)
          }),
          rideData: fc.record({
            source: nonEmptyString(2, 50),
            destination: nonEmptyString(2, 50),
            daysInFuture: fc.integer({ min: 1, max: 30 }),
            totalSeats: fc.integer({ min: 2, max: 10 }) // At least 2 seats for multiple bookings
          }),
          // Generate 1-3 passengers
          numPassengers: fc.integer({ min: 1, max: 3 }),
          passengersData: fc.array(
            fc.record({
              password: nonEmptyString(8, 50),
              name: nonEmptyString(2, 50),
              college: nonEmptyString(2, 50),
              phone: nonEmptyString(10, 15)
            }),
            { minLength: 1, maxLength: 3 }
          )
        }),
        async ({ driverData, rideData, numPassengers, passengersData }) => {
          // Generate unique emails for this iteration
          const driverEmail = `driver${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          
          // Create a driver
          const driver = await User.create({
            ...driverData,
            email: driverEmail,
            role: ['driver']
          });

          // Create a ride
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + rideData.daysInFuture);
          
          const ride = await Ride.create({
            driverId: driver.id,
            source: rideData.source,
            destination: rideData.destination,
            departureTime: futureDate,
            availableSeats: rideData.totalSeats,
            totalSeats: rideData.totalSeats
          });

          // Create multiple passengers and bookings
          const passengersToCreate = passengersData.slice(0, Math.min(numPassengers, rideData.totalSeats));
          const createdBookings = [];
          
          for (let i = 0; i < passengersToCreate.length; i++) {
            // Generate unique email for each passenger
            const passengerEmail = `passenger${i}${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
            
            const passenger = await User.create({
              ...passengersToCreate[i],
              email: passengerEmail,
              role: ['passenger']
            });

            const booking = await Booking.create({
              rideId: ride.id,
              passengerId: passenger.id,
              status: 'confirmed'
            });
            createdBookings.push(booking);
          }

          // Verify one-to-many relationship: Ride can have multiple bookings
          const rideWithBookings = await Ride.findByPk(ride.id, {
            include: [{ model: Booking, as: 'bookings' }]
          });

          // Should have exactly the number of bookings we created
          expect(rideWithBookings.bookings).toHaveLength(passengersToCreate.length);
          
          // All bookings should belong to this ride
          rideWithBookings.bookings.forEach(booking => {
            expect(booking.rideId).toBe(ride.id);
          });

          // Verify from the other side: each booking should reference the ride
          for (const booking of createdBookings) {
            const bookingWithRide = await Booking.findByPk(booking.id, {
              include: [{ model: Ride, as: 'ride' }]
            });
            expect(bookingWithRide.ride.id).toBe(ride.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout

  /**
   * Feature: campus-cruise, Property 72: User-Booking one-to-many relationship
   * Validates: Requirements 18.4
   */
  test('Property 72: User-Booking one-to-many relationship', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          passengerData: fc.record({
            password: nonEmptyString(8, 50),
            name: nonEmptyString(2, 50),
            college: nonEmptyString(2, 50),
            phone: nonEmptyString(10, 15)
          }),
          driverData: fc.record({
            password: nonEmptyString(8, 50),
            name: nonEmptyString(2, 50),
            college: nonEmptyString(2, 50),
            phone: nonEmptyString(10, 15)
          }),
          // Generate 1-4 rides to book
          numRides: fc.integer({ min: 1, max: 4 }),
          ridesData: fc.array(
            fc.record({
              source: nonEmptyString(2, 50),
              destination: nonEmptyString(2, 50),
              daysInFuture: fc.integer({ min: 1, max: 30 }),
              totalSeats: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 1, maxLength: 4 }
          )
        }),
        async ({ passengerData, driverData, numRides, ridesData }) => {
          try {
            // Generate unique emails for this iteration
            const passengerEmail = `passenger${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
            const driverEmail = `driver${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
            
            // Create a passenger
            const passenger = await User.create({
              ...passengerData,
              email: passengerEmail,
              role: ['passenger']
            });

            // Create a driver
            const driver = await User.create({
              ...driverData,
              email: driverEmail,
              role: ['driver']
            });

          // Create multiple rides and book them for the passenger
          const ridesToCreate = ridesData.slice(0, Math.min(numRides, ridesData.length));
          const createdBookings = [];
          
          for (const rideData of ridesToCreate) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + rideData.daysInFuture);
            
            const ride = await Ride.create({
              driverId: driver.id,
              source: rideData.source,
              destination: rideData.destination,
              departureTime: futureDate,
              availableSeats: rideData.totalSeats,
              totalSeats: rideData.totalSeats
            });

            const booking = await Booking.create({
              rideId: ride.id,
              passengerId: passenger.id,
              status: 'confirmed'
            });
            createdBookings.push(booking);
          }

          // Verify one-to-many relationship: User can have multiple bookings
          const passengerWithBookings = await User.findByPk(passenger.id, {
            include: [{ model: Booking, as: 'bookings' }]
          });

          // Should have exactly the number of bookings we created
          expect(passengerWithBookings.bookings).toHaveLength(ridesToCreate.length);
          
          // All bookings should belong to this passenger
          passengerWithBookings.bookings.forEach(booking => {
            expect(booking.passengerId).toBe(passenger.id);
          });

          // Verify from the other side: each booking should reference the passenger
          for (const booking of createdBookings) {
            const bookingWithPassenger = await Booking.findByPk(booking.id, {
              include: [{ model: User, as: 'passenger' }]
            });
            expect(bookingWithPassenger.passenger.id).toBe(passenger.id);
          }

            // Clean up after this iteration
            await Booking.destroy({ where: { passengerId: passenger.id }, force: true });
            await Ride.destroy({ where: { driverId: driver.id }, force: true });
            await User.destroy({ where: { id: [passenger.id, driver.id] }, force: true });
          } catch (error) {
            // Log the actual error for debugging
            console.error('Test error:', error.message, error.name);
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout

  /**
   * Feature: campus-cruise, Property 73: Cascade deletion
   * Validates: Requirements 18.5
   */
  test('Property 73: Cascade deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          driverData: fc.record({
            password: nonEmptyString(8, 50),
            name: nonEmptyString(2, 50),
            college: nonEmptyString(2, 50),
            phone: nonEmptyString(10, 15)
          }),
          passengerData: fc.record({
            password: nonEmptyString(8, 50),
            name: nonEmptyString(2, 50),
            college: nonEmptyString(2, 50),
            phone: nonEmptyString(10, 15)
          }),
          reviewerData: fc.record({
            password: nonEmptyString(8, 50),
            name: nonEmptyString(2, 50),
            college: nonEmptyString(2, 50),
            phone: nonEmptyString(10, 15)
          }),
          rideData: fc.record({
            source: nonEmptyString(2, 50),
            destination: nonEmptyString(2, 50),
            daysInFuture: fc.integer({ min: 1, max: 30 }),
            totalSeats: fc.integer({ min: 2, max: 10 })
          }),
          messageContent: nonEmptyString(5, 100),
          rating: fc.integer({ min: 1, max: 5 })
        }),
        async ({ driverData, passengerData, reviewerData, rideData, messageContent, rating }) => {
          // Generate unique emails for this iteration
          const driverEmail = `driver${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const passengerEmail = `passenger${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const reviewerEmail = `reviewer${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          
          // Create users
          const driver = await User.create({
            ...driverData,
            email: driverEmail,
            role: ['driver']
          });

          const passenger = await User.create({
            ...passengerData,
            email: passengerEmail,
            role: ['passenger']
          });

          const reviewer = await User.create({
            ...reviewerData,
            email: reviewerEmail,
            role: ['passenger']
          });

          // Create a ride
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + rideData.daysInFuture);
          
          const ride = await Ride.create({
            driverId: driver.id,
            source: rideData.source,
            destination: rideData.destination,
            departureTime: futureDate,
            availableSeats: rideData.totalSeats,
            totalSeats: rideData.totalSeats
          });

          // Create associated records
          const booking = await Booking.create({
            rideId: ride.id,
            passengerId: passenger.id,
            status: 'confirmed'
          });

          const message = await Message.create({
            senderId: passenger.id,
            rideId: ride.id,
            content: messageContent,
            messageType: 'group'
          });

          const review = await Review.create({
            rideId: ride.id,
            reviewerId: reviewer.id,
            driverId: driver.id,
            rating: rating
          });

          // Store IDs for verification
          const bookingId = booking.id;
          const messageId = message.id;
          const reviewId = review.id;

          // Delete the ride - should cascade delete bookings and messages
          await ride.destroy();

          // Verify cascade deletion: bookings should be deleted
          const deletedBooking = await Booking.findByPk(bookingId);
          expect(deletedBooking).toBeNull();

          // Verify cascade deletion: messages should be deleted
          const deletedMessage = await Message.findByPk(messageId);
          expect(deletedMessage).toBeNull();

          // Verify cascade deletion: reviews should be deleted
          const deletedReview = await Review.findByPk(reviewId);
          expect(deletedReview).toBeNull();

          // Verify users are NOT deleted (cascade should not affect users)
          const driverStillExists = await User.findByPk(driver.id);
          const passengerStillExists = await User.findByPk(passenger.id);
          const reviewerStillExists = await User.findByPk(reviewer.id);
          
          expect(driverStillExists).not.toBeNull();
          expect(passengerStillExists).not.toBeNull();
          expect(reviewerStillExists).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout
});
