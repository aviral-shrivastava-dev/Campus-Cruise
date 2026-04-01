// Mock firebase-admin FIRST before any other imports
const mockRef = jest.fn((path) => ({
  set: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue(true),
  once: jest.fn().mockResolvedValue({
    val: () => ({
      driverId: 'test-driver-id',
      tracking: true,
      startedAt: Date.now(),
      latitude: 0,
      longitude: 0,
      timestamp: Date.now()
    })
  }),
  remove: jest.fn().mockResolvedValue(true)
}));

const mockDatabase = {
  ref: mockRef
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  database: jest.fn(() => mockDatabase)
}));

// Mock the Firebase config to return our mock database
jest.mock('../../config/firebase', () => {
  const mockRef = jest.fn((path) => ({
    set: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    once: jest.fn().mockResolvedValue({
      val: () => ({
        driverId: 'test-driver-id',
        tracking: true,
        startedAt: Date.now(),
        latitude: 0,
        longitude: 0,
        timestamp: Date.now()
      })
    }),
    remove: jest.fn().mockResolvedValue(true)
  }));

  const mockDatabase = {
    ref: mockRef
  };

  return {
    getFirebaseDatabase: jest.fn(() => mockDatabase),
    initializeFirebase: jest.fn(() => ({ database: () => mockDatabase }))
  };
});

const fc = require('fast-check');
const request = require('supertest');
const { app, server, io } = require('../../server');
const { User, Ride, sequelize } = require('../../models');
const jwt = require('jsonwebtoken');
const { getFirebaseDatabase } = require('../../config/firebase');

describe('Location Tracking Property-Based Tests', () => {
  let testDriver;
  let driverToken;
  let testPassenger;
  let passengerToken;

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
    
    // Create test driver
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

    // Create test passenger
    testPassenger = await User.create({
      email: 'testpassenger@example.com',
      password: 'password123',
      name: 'Test Passenger',
      college: 'Test College',
      phone: '0987654321',
      role: ['passenger']
    });

    passengerToken = jwt.sign(
      { id: testPassenger.id, email: testPassenger.email, role: testPassenger.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Clean up database
    await Ride.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    
    // Clear mock calls
    jest.clearAllMocks();
  });

  /**
   * Feature: campus-cruise, Property 58: Ride start initiates tracking
   * Validates: Requirements 15.1
   */
  test('Property 58: Ride start initiates tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          destination: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          daysInFuture: fc.integer({ min: 1, max: 30 }),
          totalSeats: fc.integer({ min: 1, max: 8 })
        }),
        async (rideData) => {
          // Create a ride
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + rideData.daysInFuture);

          const ride = await Ride.create({
            driverId: testDriver.id,
            source: rideData.source.trim(),
            destination: rideData.destination.trim(),
            departureTime: departureTime.toISOString(),
            totalSeats: rideData.totalSeats,
            availableSeats: rideData.totalSeats,
            status: 'active'
          });

          // Start tracking
          const response = await request(app)
            .post(`/api/rides/${ride.id}/start-tracking`)
            .set('Authorization', `Bearer ${driverToken}`);

          // Should succeed
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.rideId).toBe(ride.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: campus-cruise, Property 59: Location updates broadcast
   * Validates: Requirements 15.2
   */
  test('Property 59: Location updates broadcast', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.float({ min: -90, max: 90 }),
          longitude: fc.float({ min: -180, max: 180 })
        }),
        async (locationData) => {
          // Create a ride
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + 1);

          const ride = await Ride.create({
            driverId: testDriver.id,
            source: 'Test Source',
            destination: 'Test Destination',
            departureTime: departureTime.toISOString(),
            totalSeats: 4,
            availableSeats: 4,
            status: 'active'
          });

          // Start tracking via API
          await request(app)
            .post(`/api/rides/${ride.id}/start-tracking`)
            .set('Authorization', `Bearer ${driverToken}`);

          // Update location
          const response = await request(app)
            .put(`/api/rides/${ride.id}/location`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({
              latitude: locationData.latitude,
              longitude: locationData.longitude
            });

          // Should succeed
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.location).toBeDefined();
          expect(response.body.location.latitude).toBeCloseTo(locationData.latitude, 10);
          expect(response.body.location.longitude).toBeCloseTo(locationData.longitude, 10);
          expect(response.body.location.timestamp).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: campus-cruise, Property 60: Ride completion stops tracking
   * Validates: Requirements 15.4
   */
  test('Property 60: Ride completion stops tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          source: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          destination: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2)
        }),
        async (rideData) => {
          // Create a ride
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + 1);

          const ride = await Ride.create({
            driverId: testDriver.id,
            source: rideData.source.trim(),
            destination: rideData.destination.trim(),
            departureTime: departureTime.toISOString(),
            totalSeats: 4,
            availableSeats: 4,
            status: 'active'
          });

          // Start tracking
          await request(app)
            .post(`/api/rides/${ride.id}/start-tracking`)
            .set('Authorization', `Bearer ${driverToken}`);

          // Stop tracking
          const response = await request(app)
            .post(`/api/rides/${ride.id}/stop-tracking`)
            .set('Authorization', `Bearer ${driverToken}`);

          // Should succeed
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.rideId).toBe(ride.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: campus-cruise, Property 61: Location update frequency
   * Validates: Requirements 15.5
   */
  test('Property 61: Location update frequency', async () => {
    // This property tests that location updates can occur at intervals not exceeding 10 seconds
    // We test that multiple updates within 10 seconds are all successfully stored
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            latitude: fc.float({ min: -90, max: 90 }),
            longitude: fc.float({ min: -180, max: 180 })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (locationUpdates) => {
          // Create a ride
          const departureTime = new Date();
          departureTime.setDate(departureTime.getDate() + 1);

          const ride = await Ride.create({
            driverId: testDriver.id,
            source: 'Test Source',
            destination: 'Test Destination',
            departureTime: departureTime.toISOString(),
            totalSeats: 4,
            availableSeats: 4,
            status: 'active'
          });

          // Start tracking
          await request(app)
            .post(`/api/rides/${ride.id}/start-tracking`)
            .set('Authorization', `Bearer ${driverToken}`);

          const timestamps = [];

          // Send multiple location updates rapidly (simulating updates within 10 seconds)
          for (const location of locationUpdates) {
            const beforeUpdate = Date.now();
            
            const response = await request(app)
              .put(`/api/rides/${ride.id}/location`)
              .set('Authorization', `Bearer ${driverToken}`)
              .send({
                latitude: location.latitude,
                longitude: location.longitude
              });

            expect(response.status).toBe(200);
            
            const afterUpdate = Date.now();
            timestamps.push(afterUpdate);

            // Small delay to simulate realistic update intervals (less than 10 seconds)
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Verify all updates occurred within a reasonable timeframe
          const totalTime = timestamps[timestamps.length - 1] - timestamps[0];
          
          // All updates should complete within 10 seconds per update * number of updates
          // Plus some buffer for processing
          expect(totalTime).toBeLessThan(locationUpdates.length * 10000 + 5000);

          // Verify that updates can happen frequently (intervals less than 10 seconds)
          for (let i = 1; i < timestamps.length; i++) {
            const interval = timestamps[i] - timestamps[i - 1];
            // Each individual update should be fast (well under 10 seconds)
            expect(interval).toBeLessThan(10000);
          }
        }
      ),
      { numRuns: 50 } // Reduced runs due to multiple updates per test
    );
  });
});
