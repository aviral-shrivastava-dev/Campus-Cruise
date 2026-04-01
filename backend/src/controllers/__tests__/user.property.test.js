const fc = require('fast-check');
const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { generateToken } = require('../../utils/jwt');

// Mock email service
jest.mock('../../services/email.service', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendRideCancellationEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
}));

// Setup and teardown
beforeAll(async () => {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: true });
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await db.sequelize.close();
  } catch (error) {
    console.error('Database cleanup failed:', error);
  }
});

beforeEach(async () => {
  try {
    await db.Booking.destroy({ where: {}, force: true });
    await db.Ride.destroy({ where: {}, force: true });
    await db.User.destroy({ where: {}, force: true });
  } catch (error) {
    console.error('Failed to clear database:', error);
  }
});

// Generators for test data
const emailArbitrary = fc.emailAddress();
const nameArbitrary = fc.string({ minLength: 2, maxLength: 100 })
  .map(s => {
    const trimmed = s.trim();
    return trimmed.length >= 2 ? trimmed : 'John Doe';
  });
const collegeArbitrary = fc.string({ minLength: 2, maxLength: 100 })
  .map(s => {
    const trimmed = s.trim();
    return trimmed.length >= 2 ? trimmed : 'Test College';
  });
const phoneArbitrary = fc.string({ minLength: 10, maxLength: 20 })
  .map(s => {
    const trimmed = s.trim();
    return trimmed.length >= 10 ? trimmed : '1234567890';
  });
const roleArbitrary = fc.oneof(
  fc.constant(['driver']),
  fc.constant(['passenger']),
  fc.constant(['driver', 'passenger'])
);

const vehicleInfoArbitrary = fc.record({
  vehicleMake: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.trim() || 'Toyota'),
  vehicleModel: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.trim() || 'Camry'),
  vehicleColor: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.trim() || 'Blue'),
  licensePlate: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.trim() || 'ABC123')
});

// Helper to create a test user
const createTestUser = async (overrides = {}) => {
  const userData = {
    email: `test${Date.now()}${Math.random()}@example.com`,
    password: 'password123',
    name: 'Test User',
    college: 'Test College',
    phone: '1234567890',
    role: ['passenger'],
    ...overrides
  };
  
  const user = await db.User.create(userData);
  return user;
};

// Helper to create a test ride
const createTestRide = async (driverId, overrides = {}) => {
  const rideData = {
    driverId,
    source: 'Campus A',
    destination: 'Campus B',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    availableSeats: 3,
    totalSeats: 3,
    status: 'active',
    ...overrides
  };
  
  // For past rides, bypass validation by using raw insert
  if (overrides.departureTime && new Date(overrides.departureTime) < new Date()) {
    const ride = await db.Ride.build(rideData);
    await ride.save({ validate: false });
    return ride;
  }
  
  const ride = await db.Ride.create(rideData);
  return ride;
};

/**
 * Feature: campus-cruise, Property 46: Profile retrieval includes all fields
 * Validates: Requirements 12.1
 */
describe('Property 46: Profile retrieval includes all fields', () => {
  test('should return all profile fields for any user', async () => {
    await fc.assert(
      fc.asyncProperty(
        nameArbitrary,
        emailArbitrary,
        collegeArbitrary,
        phoneArbitrary,
        roleArbitrary,
        async (name, email, college, phone, role) => {
          // Create user
          const user = await createTestUser({ name, email, college, phone, role });
          const token = generateToken(user);

          // Get profile
          const res = await request(app)
            .get(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          
          // Verify all required fields are present
          expect(res.body.data.id).toBe(user.id);
          expect(res.body.data.name).toBe(name);
          expect(res.body.data.email).toBe(email);
          expect(res.body.data.college).toBe(college);
          expect(res.body.data.phone).toBe(phone);
          expect(res.body.data.role).toEqual(role);
          
          // Verify password is excluded
          expect(res.body.data.password).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 47: Vehicle info validation and storage
 * Validates: Requirements 12.2
 */
describe('Property 47: Vehicle info validation and storage', () => {
  test('should validate and store vehicle information for drivers', async () => {
    await fc.assert(
      fc.asyncProperty(
        vehicleInfoArbitrary,
        async (vehicleInfo) => {
          // Create driver user
          const user = await createTestUser({ role: ['driver'] });
          const token = generateToken(user);

          // Update with vehicle info
          const res = await request(app)
            .put(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(vehicleInfo);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          
          // Verify vehicle info is stored
          expect(res.body.data.vehicleMake).toBe(vehicleInfo.vehicleMake);
          expect(res.body.data.vehicleModel).toBe(vehicleInfo.vehicleModel);
          expect(res.body.data.vehicleColor).toBe(vehicleInfo.vehicleColor);
          expect(res.body.data.licensePlate).toBe(vehicleInfo.licensePlate);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 48: Profile update validation
 * Validates: Requirements 12.3
 */
describe('Property 48: Profile update validation', () => {
  test('should validate all input fields before saving changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 1 }), // Invalid name (too short)
        async (invalidName) => {
          fc.pre(invalidName.trim().length < 2); // Ensure it's actually invalid
          
          const user = await createTestUser();
          const token = generateToken(user);

          // Try to update with invalid name
          const res = await request(app)
            .put(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: invalidName });

          // Should reject invalid input
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 49: Profile update returns updated data
 * Validates: Requirements 12.5
 */
describe('Property 49: Profile update returns updated data', () => {
  test('should return updated profile data after successful update', async () => {
    await fc.assert(
      fc.asyncProperty(
        nameArbitrary,
        collegeArbitrary,
        phoneArbitrary,
        async (newName, newCollege, newPhone) => {
          const user = await createTestUser();
          const token = generateToken(user);

          // Update profile
          const res = await request(app)
            .put(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
              name: newName,
              college: newCollege,
              phone: newPhone
            });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          
          // Verify returned data matches updates
          expect(res.body.data.name).toBe(newName);
          expect(res.body.data.college).toBe(newCollege);
          expect(res.body.data.phone).toBe(newPhone);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 50: Ride history completeness
 * Validates: Requirements 13.1
 */
describe('Property 50: Ride history completeness', () => {
  test('should return all rides where user was driver or passenger', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of rides as driver
        fc.integer({ min: 1, max: 5 }), // Number of rides as passenger
        async (numDriverRides, numPassengerRides) => {
          // Create user
          const user = await createTestUser({ role: ['driver', 'passenger'] });
          const token = generateToken(user);

          // Create rides where user is driver
          for (let i = 0; i < numDriverRides; i++) {
            await createTestRide(user.id, {
              departureTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000) // Past rides
            });
          }

          // Create rides where user is passenger
          const otherDriver = await createTestUser({ role: ['driver'] });
          for (let i = 0; i < numPassengerRides; i++) {
            const ride = await createTestRide(otherDriver.id, {
              departureTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)
            });
            await db.Booking.create({
              rideId: ride.id,
              passengerId: user.id,
              status: 'confirmed'
            });
          }

          // Get history
          const res = await request(app)
            .get(`/api/users/${user.id}/history`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(res.body.data.history).toBeDefined();
          
          // Should include all rides
          expect(res.body.data.history.length).toBe(numDriverRides + numPassengerRides);
          expect(res.body.data.count).toBe(numDriverRides + numPassengerRides);
        }
      ),
      { numRuns: 50 } // Reduced due to database operations
    );
  });
});

/**
 * Feature: campus-cruise, Property 51: History includes required details
 * Validates: Requirements 13.2
 */
describe('Property 51: History includes required details', () => {
  test('should include ride details, date, route, and participants', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 50 }).map(s => s.trim() || 'Source'),
        fc.string({ minLength: 2, maxLength: 50 }).map(s => s.trim() || 'Destination'),
        async (source, destination) => {
          const user = await createTestUser({ role: ['driver'] });
          const token = generateToken(user);

          // Create a ride
          const ride = await createTestRide(user.id, {
            source,
            destination,
            departureTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
          });

          // Get history
          const res = await request(app)
            .get(`/api/users/${user.id}/history`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          const history = res.body.data.history;
          expect(history.length).toBeGreaterThan(0);
          
          const rideEntry = history[0];
          // Verify required fields
          expect(rideEntry.id).toBeDefined();
          expect(rideEntry.source).toBe(source);
          expect(rideEntry.destination).toBe(destination);
          expect(rideEntry.departureTime).toBeDefined();
          expect(rideEntry.status).toBeDefined();
          expect(rideEntry.driver).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 52: History date filtering
 * Validates: Requirements 13.3
 */
describe('Property 52: History date filtering', () => {
  test('should return only rides within specified date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (daysAgo) => {
          const user = await createTestUser({ role: ['driver'] });
          const token = generateToken(user);

          // Create rides at different times
          const oldRide = await createTestRide(user.id, {
            departureTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          });
          
          const recentRide = await createTestRide(user.id, {
            departureTime: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          });

          // Filter for recent rides only (last 15 days)
          const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
          
          const res = await request(app)
            .get(`/api/users/${user.id}/history`)
            .query({ startDate: startDate.toISOString() })
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          const history = res.body.data.history;
          
          // Should only include rides within date range
          if (daysAgo <= 15) {
            expect(history.length).toBeGreaterThan(0);
            expect(history.some(r => r.id === recentRide.id)).toBe(true);
          }
          
          // Should not include old ride
          expect(history.some(r => r.id === oldRide.id)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 53: History descending order
 * Validates: Requirements 13.4
 */
describe('Property 53: History descending order', () => {
  test('should order rides by date in descending order (most recent first)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 5 }),
        async (numRides) => {
          const user = await createTestUser({ role: ['driver'] });
          const token = generateToken(user);

          // Create rides at different times
          const rides = [];
          for (let i = 0; i < numRides; i++) {
            const ride = await createTestRide(user.id, {
              departureTime: new Date(Date.now() - (numRides - i) * 24 * 60 * 60 * 1000)
            });
            rides.push(ride);
          }

          // Get history
          const res = await request(app)
            .get(`/api/users/${user.id}/history`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          const history = res.body.data.history;
          
          // Verify descending order
          for (let i = 0; i < history.length - 1; i++) {
            const current = new Date(history[i].departureTime);
            const next = new Date(history[i + 1].departureTime);
            expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 54: Cancelled rides show status
 * Validates: Requirements 13.5
 */
describe('Property 54: Cancelled rides show status', () => {
  test('should display cancellation status for cancelled rides', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('active', 'completed', 'cancelled'),
        async (status) => {
          const user = await createTestUser({ role: ['driver'] });
          const token = generateToken(user);

          // Create ride with specific status
          const ride = await createTestRide(user.id, {
            status,
            departureTime: new Date(Date.now() - 24 * 60 * 60 * 1000)
          });

          // Get history
          const res = await request(app)
            .get(`/api/users/${user.id}/history`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);
          const history = res.body.data.history;
          expect(history.length).toBeGreaterThan(0);
          
          const rideEntry = history.find(r => r.id === ride.id);
          expect(rideEntry).toBeDefined();
          expect(rideEntry.status).toBe(status);
        }
      ),
      { numRuns: 100 }
    );
  });
});
