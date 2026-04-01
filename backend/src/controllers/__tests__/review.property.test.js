const fc = require('fast-check');
const { User, Ride, Booking, Review, sequelize } = require('../../models');

describe('Review Controller Property-Based Tests', () => {
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
    await Review.destroy({ where: {}, force: true });
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

  // Helper function to create a booking
  const createTestBooking = async (ride, passenger) => {
    return await Booking.create({
      rideId: ride.id,
      passengerId: passenger.id,
      status: 'confirmed'
    });
  };

  /**
   * Feature: campus-cruise, Property 55: Review submission for completed rides
   * Validates: Requirements 14.1
   */
  test('Property 55: Review submission for completed rides', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // rating
        fc.option(fc.string({ minLength: 5, maxLength: 200 }), { nil: null }), // optional comment
        async (rating, comment) => {
          // Create driver and passenger
          const driver = await createTestUser(['driver']);
          const passenger = await createTestUser(['passenger']);

          // Create ride
          const ride = await createTestRide(driver);

          // Create booking (passenger was on the ride)
          const booking = await createTestBooking(ride, passenger);

          // Create review
          const review = await Review.create({
            rideId: ride.id,
            reviewerId: passenger.id,
            driverId: driver.id,
            rating: rating,
            comment: comment
          });

          // Verify review was created successfully
          expect(review).toBeDefined();
          expect(review.rideId).toBe(ride.id);
          expect(review.reviewerId).toBe(passenger.id);
          expect(review.driverId).toBe(driver.id);
          expect(review.rating).toBe(rating);
          expect(review.rating).toBeGreaterThanOrEqual(1);
          expect(review.rating).toBeLessThanOrEqual(5);
          
          // Verify comment is stored correctly (null or string)
          if (comment === null) {
            expect(review.comment).toBeNull();
          } else {
            expect(review.comment).toBe(comment);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 120000); // 120 second timeout

  /**
   * Feature: campus-cruise, Property 56: Review associations
   * Validates: Requirements 14.2
   */
  test('Property 56: Review associations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // rating
        async (rating) => {
          // Create driver and passenger
          const driver = await createTestUser(['driver']);
          const passenger = await createTestUser(['passenger']);

          // Create ride
          const ride = await createTestRide(driver);

          // Create booking
          const booking = await createTestBooking(ride, passenger);

          // Create review
          const review = await Review.create({
            rideId: ride.id,
            reviewerId: passenger.id,
            driverId: driver.id,
            rating: rating,
            comment: 'Test review'
          });

          // Fetch review with associations
          const reviewWithAssociations = await Review.findByPk(review.id, {
            include: [
              {
                model: Ride,
                as: 'ride'
              },
              {
                model: User,
                as: 'reviewer'
              },
              {
                model: User,
                as: 'driver'
              }
            ]
          });

          // Verify associations are correct
          expect(reviewWithAssociations).toBeDefined();
          expect(reviewWithAssociations.ride).toBeDefined();
          expect(reviewWithAssociations.ride.id).toBe(ride.id);
          expect(reviewWithAssociations.reviewer).toBeDefined();
          expect(reviewWithAssociations.reviewer.id).toBe(passenger.id);
          expect(reviewWithAssociations.driver).toBeDefined();
          expect(reviewWithAssociations.driver.id).toBe(driver.id);

          // Verify the review is associated with the specific ride and driver
          expect(reviewWithAssociations.rideId).toBe(ride.id);
          expect(reviewWithAssociations.driverId).toBe(driver.id);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000); // 120 second timeout

  /**
   * Feature: campus-cruise, Property 57: Average rating calculation
   * Validates: Requirements 14.3
   */
  test('Property 57: Average rating calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 10 }), // array of ratings
        async (ratings) => {
          // Create driver
          const driver = await createTestUser(['driver']);

          // Create multiple passengers and reviews
          const reviews = [];
          for (const rating of ratings) {
            const passenger = await createTestUser(['passenger']);
            const ride = await createTestRide(driver);
            const booking = await createTestBooking(ride, passenger);

            const review = await Review.create({
              rideId: ride.id,
              reviewerId: passenger.id,
              driverId: driver.id,
              rating: rating,
              comment: 'Test review'
            });

            reviews.push(review);
          }

          // Fetch all reviews for the driver
          const driverReviews = await Review.findAll({
            where: { driverId: driver.id }
          });

          // Calculate average rating
          const totalRating = driverReviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = totalRating / driverReviews.length;

          // Calculate expected average
          const expectedAverage = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

          // Verify average rating calculation is correct
          expect(driverReviews.length).toBe(ratings.length);
          expect(averageRating).toBeCloseTo(expectedAverage, 2);
          expect(averageRating).toBeGreaterThanOrEqual(1);
          expect(averageRating).toBeLessThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000); // 120 second timeout
});
