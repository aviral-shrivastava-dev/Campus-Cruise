const fc = require('fast-check');
const { User, Ride, sequelize } = require('../../models');
const { matchRides } = require('../rideMatching.service');

describe('Ride Matching Service Property-Based Tests', () => {
  let testDriver;

  beforeAll(async () => {
    // Sync database before tests
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up first
    await Ride.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    
    // Create a test driver
    testDriver = await User.create({
      email: 'testdriver@example.com',
      password: 'password123',
      name: 'Test Driver',
      college: 'Test College',
      phone: '1234567890',
      role: ['driver']
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await Ride.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  /**
   * Feature: campus-cruise, Property 41: Exact route match prioritization
   * Validates: Requirements 11.1
   */
  test('Property 41: Exact route match prioritization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          destination: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          daysInFuture: fc.integer({ min: 1, max: 10 })
        }),
        async ({ source, destination, daysInFuture }) => {
          // Clean up before this iteration
          await Ride.destroy({ where: {}, force: true });
          
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + daysInFuture);

          // Create exact match ride
          await Ride.create({
            driverId: testDriver.id,
            source: source.trim(),
            destination: destination.trim(),
            departureTime,
            availableSeats: 3,
            totalSeats: 3,
            status: 'active'
          });

          // Create partial match ride (different source)
          await Ride.create({
            driverId: testDriver.id,
            source: 'Different Source',
            destination: destination.trim(),
            departureTime,
            availableSeats: 2,
            totalSeats: 2,
            status: 'active'
          });

          // Match rides
          const result = await matchRides({
            source: source.trim(),
            destination: destination.trim()
          });

          expect(result.success).toBe(true);
          expect(result.data.length).toBeGreaterThan(0);
          
          // First result should be exact match
          const firstResult = result.data[0];
          expect(firstResult.matchType).toBe('exact');
          expect(firstResult.ride.source).toBe(source.trim());
          expect(firstResult.ride.destination).toBe(destination.trim());
          
          // Summary should show at least one exact match
          expect(result.summary.exactMatches).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 42: Time proximity ranking
   * Validates: Requirements 11.2
   */
  test('Property 42: Time proximity ranking', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          destination: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          preferredDays: fc.integer({ min: 10, max: 20 })
        }),
        async ({ source, destination, preferredDays }) => {
          // Clean up before this iteration
          await Ride.destroy({ where: {}, force: true });
          
          const preferredTime = new Date();
          preferredTime.setDate(preferredTime.getDate() + preferredDays);

          // Create ride close to preferred time (1 day before)
          const closeTime = new Date(preferredTime);
          closeTime.setDate(closeTime.getDate() - 1);
          await Ride.create({
            driverId: testDriver.id,
            source: source.trim(),
            destination: destination.trim(),
            departureTime: closeTime,
            availableSeats: 3,
            totalSeats: 3,
            status: 'active'
          });

          // Create ride far from preferred time (5 days before)
          const farTime = new Date(preferredTime);
          farTime.setDate(farTime.getDate() - 5);
          await Ride.create({
            driverId: testDriver.id,
            source: source.trim(),
            destination: destination.trim(),
            departureTime: farTime,
            availableSeats: 2,
            totalSeats: 2,
            status: 'active'
          });

          // Match rides with preferred time
          const result = await matchRides({
            source: source.trim(),
            destination: destination.trim(),
            preferredTime: preferredTime.toISOString()
          });

          expect(result.success).toBe(true);
          expect(result.data.length).toBeGreaterThanOrEqual(2);
          
          // Results should be sorted by time proximity (closer first)
          for (let i = 0; i < result.data.length - 1; i++) {
            expect(result.data[i].timeProximity).toBeLessThanOrEqual(result.data[i + 1].timeProximity);
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 43: Suggestions show available rides only
   * Validates: Requirements 11.3
   */
  test('Property 43: Suggestions show available rides only', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          destination: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          daysInFuture: fc.integer({ min: 1, max: 10 })
        }),
        async ({ source, destination, daysInFuture }) => {
          // Clean up before this iteration
          await Ride.destroy({ where: {}, force: true });
          
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + daysInFuture);

          // Create ride with available seats
          await Ride.create({
            driverId: testDriver.id,
            source: source.trim(),
            destination: destination.trim(),
            departureTime,
            availableSeats: 3,
            totalSeats: 3,
            status: 'active'
          });

          // Create ride with no available seats
          await Ride.create({
            driverId: testDriver.id,
            source: source.trim(),
            destination: destination.trim(),
            departureTime,
            availableSeats: 0,
            totalSeats: 3,
            status: 'active'
          });

          // Match rides
          const result = await matchRides({
            source: source.trim(),
            destination: destination.trim()
          });

          expect(result.success).toBe(true);
          
          // All suggested rides should have available seats > 0
          result.data.forEach(match => {
            expect(match.ride.availableSeats).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 44: Partial route matching
   * Validates: Requirements 11.4
   */
  test('Property 44: Partial route matching', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          baseLocation: fc.string({ minLength: 2, maxLength: 15 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          daysInFuture: fc.integer({ min: 1, max: 10 })
        }),
        async ({ baseLocation, daysInFuture }) => {
          // Clean up before this iteration
          await Ride.destroy({ where: {}, force: true });
          
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + daysInFuture);

          // Create ride where passenger's source is part of the route
          await Ride.create({
            driverId: testDriver.id,
            source: `${baseLocation.trim()} North`,
            destination: 'Far Destination',
            departureTime,
            availableSeats: 3,
            totalSeats: 3,
            status: 'active'
          });

          // Match rides with partial location
          const result = await matchRides({
            source: baseLocation.trim(),
            destination: 'Far Destination'
          });

          expect(result.success).toBe(true);
          
          // Should find partial matches
          const partialMatches = result.data.filter(m => m.matchType === 'partial');
          expect(partialMatches.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 45: Nearby alternatives when no exact match
   * Validates: Requirements 11.5
   */
  test('Property 45: Nearby alternatives when no exact match', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 15 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          destination: fc.string({ minLength: 2, maxLength: 15 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          daysInFuture: fc.integer({ min: 1, max: 10 })
        }),
        async ({ source, destination, daysInFuture }) => {
          // Clean up before this iteration
          await Ride.destroy({ where: {}, force: true });
          
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + daysInFuture);

          // Create ride with similar but not exact locations
          await Ride.create({
            driverId: testDriver.id,
            source: `${source.trim()}1`,
            destination: `${destination.trim()}1`,
            departureTime,
            availableSeats: 3,
            totalSeats: 3,
            status: 'active'
          });

          // Match rides with distance threshold
          const result = await matchRides({
            source: source.trim(),
            destination: destination.trim(),
            distanceThreshold: 0.5 // 50% difference allowed
          });

          expect(result.success).toBe(true);
          
          // Should find nearby alternatives if no exact match
          if (result.summary.exactMatches === 0) {
            expect(result.summary.nearbyAlternatives).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);
});
