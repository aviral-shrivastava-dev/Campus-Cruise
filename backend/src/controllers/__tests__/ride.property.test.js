const fc = require('fast-check');
const request = require('supertest');
const { app, server } = require('../../server');
const { User, Ride, sequelize } = require('../../models');
const jwt = require('jsonwebtoken');

describe('Ride Management Property-Based Tests', () => {
  let testDriver;
  let driverToken;

  beforeAll(async () => {
    // Sync database before tests
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close server and database connection
    if (server && server.close) {
      await new Promise(resolve => server.close(resolve));
    }
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up first
    await Ride.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    
    // Create a test driver for authenticated requests
    testDriver = await User.create({
      email: 'testdriver@example.com',
      password: 'password123',
      name: 'Test Driver',
      college: 'Test College',
      phone: '1234567890',
      role: ['driver']
    });

    driverToken = jwt.sign(
      { id: testDriver.id, email: testDriver.email, role: testDriver.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Clean up after each test
    await Ride.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  /**
   * Feature: campus-cruise, Property 7: Valid ride creation succeeds
   * Validates: Requirements 3.1, 3.4
   */
  test('Property 7: Valid ride creation succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          destination: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          daysInFuture: fc.integer({ min: 1, max: 30 }),
          totalSeats: fc.integer({ min: 1, max: 8 })
        }),
        async (rideData) => {
          // Calculate future departure time
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + rideData.daysInFuture);

          const response = await request(app)
            .post('/api/rides')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({
              source: rideData.source.trim(),
              destination: rideData.destination.trim(),
              departureTime: departureTime.toISOString(),
              totalSeats: rideData.totalSeats
            });

          // Should succeed with 201 status
          expect(response.status).toBe(201);
          expect(response.body.success).toBe(true);
          
          // Should return created ride data
          expect(response.body.data).toBeDefined();
          expect(response.body.data.id).toBeDefined();
          expect(response.body.data.driverId).toBe(testDriver.id);
          expect(response.body.data.source).toBe(rideData.source.trim());
          expect(response.body.data.destination).toBe(rideData.destination.trim());
          expect(response.body.data.totalSeats).toBe(rideData.totalSeats);
          expect(response.body.data.availableSeats).toBe(rideData.totalSeats);
          expect(response.body.data.status).toBe('active');
          
          // Should include driver information
          expect(response.body.data.driver).toBeDefined();
          expect(response.body.data.driver.id).toBe(testDriver.id);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 11: Available rides filter correctly
   * Validates: Requirements 4.1
   */
  test('Property 11: Available rides filter correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            source: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
            destination: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
            daysInFuture: fc.integer({ min: 1, max: 30 }),
            availableSeats: fc.integer({ min: 0, max: 8 }),
            totalSeats: fc.integer({ min: 1, max: 8 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (ridesData) => {
          // Clean up before this iteration
          await Ride.destroy({ where: {}, force: true });
          
          // Create rides with varying availability
          for (const rideData of ridesData) {
            const departureTime = new Date();
            departureTime.setDate(departureTime.getDate() + rideData.daysInFuture);

            await Ride.create({
              driverId: testDriver.id,
              source: rideData.source.trim(),
              destination: rideData.destination.trim(),
              departureTime,
              availableSeats: rideData.availableSeats,
              totalSeats: Math.max(rideData.totalSeats, rideData.availableSeats),
              status: 'active'
            });
          }

          // Fetch available rides
          const response = await request(app)
            .get('/api/rides');

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          
          // All returned rides should have available seats > 0
          response.body.data.forEach(ride => {
            expect(ride.availableSeats).toBeGreaterThan(0);
            expect(ride.status).toBe('active');
            expect(new Date(ride.departureTime)).toBeInstanceOf(Date);
            expect(new Date(ride.departureTime).getTime()).toBeGreaterThan(Date.now());
          });
          
          // Count rides with available seats
          const expectedCount = ridesData.filter(r => r.availableSeats > 0).length;
          expect(response.body.data.length).toBe(expectedCount);
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 12: Source filtering works correctly
   * Validates: Requirements 4.2
   */
  test('Property 12: Source filtering works correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          targetSource: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          otherSources: fc.array(
            fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)), 
            { minLength: 1, maxLength: 5 }
          )
        }),
        async ({ targetSource, otherSources }) => {
          // Clean up before this iteration
          await Ride.destroy({ where: {}, force: true });
          
          // Create rides with target source
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + 1);

          await Ride.create({
            driverId: testDriver.id,
            source: targetSource.trim(),
            destination: 'Destination A',
            departureTime,
            availableSeats: 3,
            totalSeats: 3,
            status: 'active'
          });

          // Create rides with other sources
          for (const source of otherSources) {
            if (source.trim() !== targetSource.trim()) {
              await Ride.create({
                driverId: testDriver.id,
                source: source.trim(),
                destination: 'Destination B',
                departureTime,
                availableSeats: 2,
                totalSeats: 2,
                status: 'active'
              });
            }
          }

          // Filter by target source
          const response = await request(app)
            .get('/api/rides')
            .query({ source: targetSource.trim() });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          
          // All returned rides should match the source filter
          response.body.data.forEach(ride => {
            expect(ride.source.toLowerCase()).toContain(targetSource.trim().toLowerCase());
          });
          
          // Should have at least one ride with target source
          expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 13: Destination filtering works correctly
   * Validates: Requirements 4.3
   */
  test('Property 13: Destination filtering works correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          targetDestination: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)),
          otherDestinations: fc.array(
            fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s)), 
            { minLength: 1, maxLength: 5 }
          )
        }),
        async ({ targetDestination, otherDestinations }) => {
          // Clean up before this iteration
          await Ride.destroy({ where: {}, force: true });
          
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + 1);

          // Create ride with target destination
          await Ride.create({
            driverId: testDriver.id,
            source: 'Source A',
            destination: targetDestination.trim(),
            departureTime,
            availableSeats: 3,
            totalSeats: 3,
            status: 'active'
          });

          // Create rides with other destinations
          for (const destination of otherDestinations) {
            if (destination.trim() !== targetDestination.trim()) {
              await Ride.create({
                driverId: testDriver.id,
                source: 'Source B',
                destination: destination.trim(),
                departureTime,
                availableSeats: 2,
                totalSeats: 2,
                status: 'active'
              });
            }
          }

          // Filter by target destination
          const response = await request(app)
            .get('/api/rides')
            .query({ destination: targetDestination.trim() });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          
          // All returned rides should match the destination filter
          response.body.data.forEach(ride => {
            expect(ride.destination.toLowerCase()).toContain(targetDestination.trim().toLowerCase());
          });
          
          // Should have at least one ride with target destination
          expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 14: Date range filtering works correctly
   * Validates: Requirements 4.4
   */
  test('Property 14: Date range filtering works correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startDays: fc.integer({ min: 1, max: 10 }),
          endDays: fc.integer({ min: 11, max: 20 }),
          ridesCount: fc.integer({ min: 3, max: 8 })
        }),
        async ({ startDays, endDays, ridesCount }) => {
          const dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() + startDays);
          dateFrom.setHours(0, 0, 0, 0); // Set to start of day
          
          const dateTo = new Date();
          dateTo.setDate(dateTo.getDate() + endDays);
          dateTo.setHours(23, 59, 59, 999); // Set to end of day

          // Create rides within and outside the date range
          const ridesInRange = [];
          for (let i = 0; i < ridesCount; i++) {
            const daysOffset = startDays + Math.floor((endDays - startDays) * Math.random());
            const departureTime = new Date();
            departureTime.setDate(departureTime.getDate() + daysOffset);
            departureTime.setHours(12, 0, 0, 0); // Set to noon

            const ride = await Ride.create({
              driverId: testDriver.id,
              source: `Source ${i}`,
              destination: `Destination ${i}`,
              departureTime,
              availableSeats: 2,
              totalSeats: 2,
              status: 'active'
            });
            
            if (departureTime >= dateFrom && departureTime <= dateTo) {
              ridesInRange.push(ride);
            }
          }

          // Create ride outside range (before)
          const beforeDate = new Date();
          beforeDate.setDate(beforeDate.getDate() + (startDays - 2));
          if (beforeDate > new Date()) {
            await Ride.create({
              driverId: testDriver.id,
              source: 'Before Source',
              destination: 'Before Dest',
              departureTime: beforeDate,
              availableSeats: 1,
              totalSeats: 1,
              status: 'active'
            });
          }

          // Filter by date range
          const response = await request(app)
            .get('/api/rides')
            .query({ 
              dateFrom: dateFrom.toISOString(),
              dateTo: dateTo.toISOString()
            });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          
          // All returned rides should be within the date range (with some tolerance for milliseconds)
          response.body.data.forEach(ride => {
            const rideDate = new Date(ride.departureTime);
            // Allow 1 second tolerance for rounding
            expect(rideDate.getTime()).toBeGreaterThanOrEqual(dateFrom.getTime() - 1000);
            expect(rideDate.getTime()).toBeLessThanOrEqual(dateTo.getTime() + 1000);
          });
        }
      ),
      { numRuns: 30 }
    );
  }, 120000);

  /**
   * Feature: campus-cruise, Property 15: Ride results include required fields
   * Validates: Requirements 4.5
   */
  test('Property 15: Ride results include required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            source: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
            destination: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
            daysInFuture: fc.integer({ min: 1, max: 30 }),
            totalSeats: fc.integer({ min: 1, max: 8 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (ridesData) => {
          // Create rides
          for (const rideData of ridesData) {
            const departureTime = new Date();
            departureTime.setDate(departureTime.getDate() + rideData.daysInFuture);

            await Ride.create({
              driverId: testDriver.id,
              source: rideData.source.trim(),
              destination: rideData.destination.trim(),
              departureTime,
              availableSeats: rideData.totalSeats,
              totalSeats: rideData.totalSeats,
              status: 'active'
            });
          }

          // Fetch rides
          const response = await request(app)
            .get('/api/rides');

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          
          // Each ride should include all required fields
          response.body.data.forEach(ride => {
            // Driver information
            expect(ride.driver).toBeDefined();
            expect(ride.driver.id).toBeDefined();
            expect(ride.driver.name).toBeDefined();
            expect(ride.driver.email).toBeDefined();
            expect(ride.driver.college).toBeDefined();
            expect(ride.driver.phone).toBeDefined();
            
            // Route details
            expect(ride.source).toBeDefined();
            expect(ride.destination).toBeDefined();
            
            // Departure time
            expect(ride.departureTime).toBeDefined();
            expect(new Date(ride.departureTime)).toBeInstanceOf(Date);
            
            // Available seats
            expect(ride.availableSeats).toBeDefined();
            expect(typeof ride.availableSeats).toBe('number');
          });
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);
});
