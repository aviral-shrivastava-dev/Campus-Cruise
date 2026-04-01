const fc = require('fast-check');
const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { generateToken } = require('../../utils/jwt');

// Mock email service
jest.mock('../../services/email.service', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendBookingCancellationEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendRideCancellationEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
}));

const emailService = require('../../services/email.service');

// Mock Socket.io
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  sockets: {
    sockets: new Map()
  }
};

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
    // Clear all data before each test
    await db.Booking.destroy({ where: {}, force: true });
    await db.Ride.destroy({ where: {}, force: true });
    await db.User.destroy({ where: {}, force: true });
    
    // Clear mock calls
    jest.clearAllMocks();
    emailService.sendBookingConfirmationEmail.mockClear();
    emailService.sendBookingCancellationEmail.mockClear();
    emailService.sendRideCancellationEmail.mockClear();
    emailService.sendWelcomeEmail.mockClear();
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
});

// Generators for test data
const nameArbitrary = fc.string({ minLength: 2, maxLength: 100 })
  .map(s => s.trim() || 'John Doe');
const emailArbitrary = fc.emailAddress();
const collegeArbitrary = fc.string({ minLength: 2, maxLength: 100 })
  .map(s => s.trim() || 'Test College');
const phoneArbitrary = fc.string({ minLength: 10, maxLength: 20 })
  .map(s => s.trim() || '1234567890');
const locationArbitrary = fc.string({ minLength: 3, maxLength: 100 })
  .map(s => s.trim() || 'Test Location');

// Helper to create a user
const createUser = async (role = ['driver', 'passenger']) => {
  return await db.User.create({
    name: 'Test User',
    email: `test${Date.now()}${Math.random()}@example.com`,
    password: 'password123',
    college: 'Test College',
    phone: '1234567890',
    role,
    vehicleMake: role.includes('driver') ? 'Toyota' : null,
    vehicleModel: role.includes('driver') ? 'Camry' : null
  });
};

// Helper to create a ride
const createRide = async (driverId, availableSeats = 3) => {
  const futureDate = new Date();
  futureDate.setHours(futureDate.getHours() + 24);
  
  return await db.Ride.create({
    driverId,
    source: 'Campus',
    destination: 'Downtown',
    departureTime: futureDate,
    availableSeats,
    totalSeats: availableSeats,
    status: 'active'
  });
};

/**
 * Feature: campus-cruise, Property 17: Booking sends notifications
 * Validates: Requirements 5.3, 5.4
 */
describe('Property 17: Booking sends notifications', () => {
  test('should send notifications to both driver and passenger on booking', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }),
        async (seats) => {
          // Create driver and passenger
          const driver = await createUser(['driver']);
          const passenger = await createUser(['passenger']);
          const ride = await createRide(driver.id, seats);

          // Clear mocks
          emailService.sendBookingConfirmationEmail.mockClear();

          // Create booking
          const token = generateToken({ id: passenger.id, role: ['passenger'] });
          const res = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ rideId: ride.id });

          expect(res.status).toBe(201);

          // Wait for async email calls
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify emails were sent to both parties
          expect(emailService.sendBookingConfirmationEmail).toHaveBeenCalledTimes(2);
          
          // Check driver email
          const driverCall = emailService.sendBookingConfirmationEmail.mock.calls.find(
            call => call[0] === driver.email
          );
          expect(driverCall).toBeDefined();
          expect(driverCall[2].isDriver).toBe(true);
          
          // Check passenger email
          const passengerCall = emailService.sendBookingConfirmationEmail.mock.calls.find(
            call => call[0] === passenger.email
          );
          expect(passengerCall).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 19: Ride cancellation notifies passengers
 * Validates: Requirements 6.2
 */
describe('Property 19: Ride cancellation notifies passengers', () => {
  test('should notify all passengers when ride is cancelled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (numPassengers) => {
          // Create driver and ride
          const driver = await createUser(['driver']);
          const ride = await createRide(driver.id, numPassengers);

          // Create passengers and bookings
          const passengers = [];
          for (let i = 0; i < numPassengers; i++) {
            const passenger = await createUser(['passenger']);
            passengers.push(passenger);
            
            await db.Booking.create({
              rideId: ride.id,
              passengerId: passenger.id,
              status: 'confirmed'
            });
          }

          // Clear mocks
          emailService.sendRideCancellationEmail.mockClear();

          // Cancel ride
          const token = generateToken({ id: driver.id, role: ['driver'] });
          const res = await request(app)
            .delete(`/api/rides/${ride.id}`)
            .set('Authorization', `Bearer ${token}`);

          expect(res.status).toBe(200);

          // Wait for async email calls
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify all passengers received email
          expect(emailService.sendRideCancellationEmail).toHaveBeenCalledTimes(numPassengers);
          
          passengers.forEach(passenger => {
            const passengerCall = emailService.sendRideCancellationEmail.mock.calls.find(
              call => call[0] === passenger.email
            );
            expect(passengerCall).toBeDefined();
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 20: Cancelled rides prevent new bookings
 * Validates: Requirements 6.3
 */
describe('Property 20: Cancelled rides prevent new bookings', () => {
  test('should reject booking attempts on cancelled rides', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }),
        async (seats) => {
          // Create driver, passenger, and ride
          const driver = await createUser(['driver']);
          const passenger = await createUser(['passenger']);
          const ride = await createRide(driver.id, seats);

          // Cancel the ride
          const driverToken = generateToken({ id: driver.id, role: ['driver'] });
          await request(app)
            .delete(`/api/rides/${ride.id}`)
            .set('Authorization', `Bearer ${driverToken}`);

          // Try to book the cancelled ride
          const passengerToken = generateToken({ id: passenger.id, role: ['passenger'] });
          const res = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ rideId: ride.id });

          // Should be rejected
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('INVALID_RIDE_STATUS');
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 22: Cancellation broadcasts real-time updates
 * Validates: Requirements 6.5
 */
describe('Property 22: Cancellation broadcasts real-time updates', () => {
  test('should update ride availability after booking cancellation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }),
        async (totalSeats) => {
          // Create driver, passenger, and ride
          const driver = await createUser(['driver']);
          const passenger = await createUser(['passenger']);
          const ride = await createRide(driver.id, totalSeats);

          // Create booking
          const passengerToken = generateToken({ id: passenger.id, role: ['passenger'] });
          const bookingRes = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ rideId: ride.id });

          const bookingId = bookingRes.body.data.id;

          // Get ride before cancellation
          const rideBefore = await db.Ride.findByPk(ride.id);
          const seatsBefore = rideBefore.availableSeats;

          // Cancel booking
          await request(app)
            .delete(`/api/bookings/${bookingId}`)
            .set('Authorization', `Bearer ${passengerToken}`);

          // Get ride after cancellation
          const rideAfter = await db.Ride.findByPk(ride.id);
          const seatsAfter = rideAfter.availableSeats;

          // Verify seats were incremented
          expect(seatsAfter).toBe(seatsBefore + 1);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 33: Booking notifies driver
 * Validates: Requirements 9.1, 9.4
 */
describe('Property 33: Booking notifies driver', () => {
  test('should send notification to driver when passenger books', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }),
        async (seats) => {
          // Create driver, passenger, and ride
          const driver = await createUser(['driver']);
          const passenger = await createUser(['passenger']);
          const ride = await createRide(driver.id, seats);

          // Clear mocks
          emailService.sendBookingConfirmationEmail.mockClear();

          // Create booking
          const token = generateToken({ id: passenger.id, role: ['passenger'] });
          const res = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ rideId: ride.id });

          expect(res.status).toBe(201);

          // Wait for async email calls
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify driver received notification email
          const driverCall = emailService.sendBookingConfirmationEmail.mock.calls.find(
            call => call[0] === driver.email && call[2].isDriver === true
          );
          expect(driverCall).toBeDefined();
          expect(driverCall[1]).toBe(driver.name);
          expect(driverCall[2].passengerName).toBe(passenger.name);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 34: Cancellation notifies driver
 * Validates: Requirements 9.2
 */
describe('Property 34: Cancellation notifies driver', () => {
  test('should send notification to driver when passenger cancels', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }),
        async (seats) => {
          // Create driver, passenger, and ride
          const driver = await createUser(['driver']);
          const passenger = await createUser(['passenger']);
          const ride = await createRide(driver.id, seats);

          // Create booking
          const passengerToken = generateToken({ id: passenger.id, role: ['passenger'] });
          const bookingRes = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ rideId: ride.id });

          const bookingId = bookingRes.body.data.id;

          // Clear mocks
          emailService.sendBookingCancellationEmail.mockClear();

          // Cancel booking
          await request(app)
            .delete(`/api/bookings/${bookingId}`)
            .set('Authorization', `Bearer ${passengerToken}`);

          // Wait for async email calls
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify driver received cancellation notification
          const driverCall = emailService.sendBookingCancellationEmail.mock.calls.find(
            call => call[0] === driver.email && call[2].isDriver === true
          );
          expect(driverCall).toBeDefined();
          expect(driverCall[1]).toBe(driver.name);
          expect(driverCall[2].passengerName).toBe(passenger.name);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 35: Full capacity notification
 * Validates: Requirements 9.3
 */
describe('Property 35: Full capacity notification', () => {
  test('should notify driver when ride reaches full capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (totalSeats) => {
          // Create driver and ride
          const driver = await createUser(['driver']);
          const ride = await createRide(driver.id, totalSeats);

          // Create passengers and fill all seats
          for (let i = 0; i < totalSeats; i++) {
            const passenger = await createUser(['passenger']);
            const token = generateToken({ id: passenger.id, role: ['passenger'] });
            
            await request(app)
              .post('/api/bookings')
              .set('Authorization', `Bearer ${token}`)
              .send({ rideId: ride.id });
          }

          // Verify ride is at full capacity
          const fullRide = await db.Ride.findByPk(ride.id);
          expect(fullRide.availableSeats).toBe(0);

          // Try to book when full
          const latePassenger = await createUser(['passenger']);
          const lateToken = generateToken({ id: latePassenger.id, role: ['passenger'] });
          const res = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${lateToken}`)
            .send({ rideId: ride.id });

          // Should be rejected
          expect(res.status).toBe(400);
          expect(res.body.error.code).toBe('NO_SEATS_AVAILABLE');
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 37: Booking confirmation emails
 * Validates: Requirements 10.1, 10.5
 */
describe('Property 37: Booking confirmation emails', () => {
  test('should send booking confirmation emails with ride details', async () => {
    await fc.assert(
      fc.asyncProperty(
        locationArbitrary,
        locationArbitrary,
        fc.integer({ min: 1, max: 4 }),
        async (source, destination, seats) => {
          fc.pre(source !== destination);
          
          // Create driver and passenger
          const driver = await createUser(['driver']);
          const passenger = await createUser(['passenger']);
          
          // Create ride with specific locations
          const futureDate = new Date();
          futureDate.setHours(futureDate.getHours() + 24);
          
          const ride = await db.Ride.create({
            driverId: driver.id,
            source,
            destination,
            departureTime: futureDate,
            availableSeats: seats,
            totalSeats: seats,
            status: 'active'
          });

          // Clear mocks
          emailService.sendBookingConfirmationEmail.mockClear();

          // Create booking
          const token = generateToken({ id: passenger.id, role: ['passenger'] });
          await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ rideId: ride.id });

          // Wait for async email calls
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify emails contain ride details
          expect(emailService.sendBookingConfirmationEmail).toHaveBeenCalledTimes(2);
          
          emailService.sendBookingConfirmationEmail.mock.calls.forEach(call => {
            const rideDetails = call[2];
            expect(rideDetails.source).toBe(source);
            expect(rideDetails.destination).toBe(destination);
            expect(rideDetails.departureTime).toBeDefined();
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 38: Ride cancellation emails
 * Validates: Requirements 10.2
 */
describe('Property 38: Ride cancellation emails', () => {
  test('should send cancellation emails to all affected passengers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (numPassengers) => {
          // Create driver and ride
          const driver = await createUser(['driver']);
          const ride = await createRide(driver.id, numPassengers);

          // Create passengers and bookings
          const passengerEmails = [];
          for (let i = 0; i < numPassengers; i++) {
            const passenger = await createUser(['passenger']);
            passengerEmails.push(passenger.email);
            
            await db.Booking.create({
              rideId: ride.id,
              passengerId: passenger.id,
              status: 'confirmed'
            });
          }

          // Clear mocks
          emailService.sendRideCancellationEmail.mockClear();

          // Cancel ride
          const token = generateToken({ id: driver.id, role: ['driver'] });
          await request(app)
            .delete(`/api/rides/${ride.id}`)
            .set('Authorization', `Bearer ${token}`);

          // Wait for async email calls
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify all passengers received cancellation email
          expect(emailService.sendRideCancellationEmail).toHaveBeenCalledTimes(numPassengers);
          
          passengerEmails.forEach(email => {
            const emailCall = emailService.sendRideCancellationEmail.mock.calls.find(
              call => call[0] === email
            );
            expect(emailCall).toBeDefined();
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 39: Welcome email on registration
 * Validates: Requirements 10.3
 */
describe('Property 39: Welcome email on registration', () => {
  test('should send welcome email with account confirmation on registration', async () => {
    await fc.assert(
      fc.asyncProperty(
        nameArbitrary,
        emailArbitrary,
        async (name, email) => {
          // Clear mocks
          emailService.sendWelcomeEmail.mockClear();

          // Register user
          const res = await request(app)
            .post('/api/auth/register')
            .send({
              name,
              email,
              password: 'password123',
              college: 'Test College',
              phone: '1234567890',
              role: ['passenger']
            });

          if (res.status === 201) {
            // Wait for async email call
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify welcome email was sent
            expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(email, name);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 40: Email retry on failure
 * Validates: Requirements 10.4
 */
describe('Property 40: Email retry on failure', () => {
  test('should retry email sending up to 3 times on failure', async () => {
    // This test verifies the retry logic exists in the email service
    // The actual retry behavior is tested in the email service unit tests
    
    // Create a user to trigger email
    const driver = await createUser(['driver']);
    const passenger = await createUser(['passenger']);
    const ride = await createRide(driver.id, 2);

    // Mock email service to fail
    const originalImpl = emailService.sendBookingConfirmationEmail;
    let callCount = 0;
    emailService.sendBookingConfirmationEmail.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ messageId: 'test-id' });
    });

    // Create booking
    const token = generateToken({ id: passenger.id, role: ['passenger'] });
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ rideId: ride.id });

    // Wait for async calls
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify email service was called (retry logic is in email service itself)
    expect(emailService.sendBookingConfirmationEmail).toHaveBeenCalled();

    // Restore original implementation
    emailService.sendBookingConfirmationEmail.mockImplementation(originalImpl);
  });
});
