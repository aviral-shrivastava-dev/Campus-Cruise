const fc = require('fast-check');
const request = require('supertest');
const db = require('../../models');
const jwt = require('jsonwebtoken');
const { initializeTestServer, closeTestServer } = require('./testServer');

let app;

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
    // Force sync to ensure tables exist
    await db.sequelize.sync({ force: true });
    console.log('Database setup complete');
    
    // Initialize test server with Apollo
    app = await initializeTestServer();
    console.log('Apollo Server initialized');
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}, 30000);

afterAll(async () => {
  try {
    await closeTestServer();
    await db.sequelize.close();
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
});

beforeEach(async () => {
  try {
    // Clear in correct order due to foreign key constraints - without truncate
    await db.Review.destroy({ where: {}, force: true });
    await db.Message.destroy({ where: {}, force: true });
    await db.Booking.destroy({ where: {}, force: true });
    await db.Ride.destroy({ where: {}, force: true });
    await db.User.destroy({ where: {}, force: true });
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
});

// Helper function to execute GraphQL query
const executeGraphQL = async (query, variables = {}, token = null) => {
  const headers = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return request(app)
    .post('/graphql')
    .set(headers)
    .send({ query, variables });
};

// Generators
const emailArbitrary = fc.emailAddress();
const passwordArbitrary = fc.string({ minLength: 8, maxLength: 50 })
  .map(s => s.trim().length >= 8 ? s.trim() : 'password123');
const nameArbitrary = fc.string({ minLength: 2, maxLength: 100 })
  .map(s => s.trim().length >= 2 ? s.trim() : 'John Doe');
const collegeArbitrary = fc.string({ minLength: 2, maxLength: 100 })
  .map(s => s.trim().length >= 2 ? s.trim() : 'Test College');
const phoneArbitrary = fc.string({ minLength: 10, maxLength: 20 })
  .map(s => s.trim().length >= 10 ? s.trim() : '1234567890');
const roleArbitrary = fc.oneof(
  fc.constant(['driver']),
  fc.constant(['passenger']),
  fc.constant(['driver', 'passenger'])
);

const locationArbitrary = fc.string({ minLength: 3, maxLength: 100 })
  .map(s => s.trim().length >= 3 ? s.trim() : 'Test Location');

const futureDateArbitrary = fc.integer({ min: 1, max: 365 }).map(days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
});

const seatsArbitrary = fc.integer({ min: 1, max: 8 });

/**
 * Feature: campus-cruise, Property 65: GraphQL field selection
 * Validates: Requirements 17.1
 */
describe('Property 65: GraphQL field selection', () => {
  test('should return only requested fields for ride queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        nameArbitrary,
        emailArbitrary,
        passwordArbitrary,
        collegeArbitrary,
        phoneArbitrary,
        locationArbitrary,
        locationArbitrary,
        futureDateArbitrary,
        seatsArbitrary,
        async (name, email, password, college, phone, source, destination, departureTime, seats) => {
          // Clear database for this iteration
          await db.User.destroy({ where: {}, force: true });
          await db.Ride.destroy({ where: {}, force: true });
          
          // Create driver
          const driver = await db.User.create({
            name,
            email,
            password,
            college,
            phone,
            role: ['driver']
          });

          // Create ride
          const ride = await db.Ride.create({
            driverId: driver.id,
            source,
            destination,
            departureTime,
            availableSeats: seats,
            totalSeats: seats,
            status: 'active'
          });

          // Query with limited fields
          const query = `
            query GetRide($id: ID!) {
              ride(id: $id) {
                id
                source
                destination
              }
            }
          `;

          const response = await executeGraphQL(query, { id: ride.id });

          expect(response.status).toBe(200);
          expect(response.body.data.ride).toBeDefined();
          expect(response.body.data.ride.id).toBe(ride.id);
          expect(response.body.data.ride.source).toBe(source);
          expect(response.body.data.ride.destination).toBe(destination);
          
          // Should not include fields we didn't request
          expect(response.body.data.ride.departureTime).toBeUndefined();
          expect(response.body.data.ride.availableSeats).toBeUndefined();
          expect(response.body.data.ride.driver).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 66: GraphQL ride creation
 * Validates: Requirements 17.2
 */
describe('Property 66: GraphQL ride creation', () => {
  test('should validate input, create ride, and return created ride data', async () => {
    await fc.assert(
      fc.asyncProperty(
        nameArbitrary,
        emailArbitrary,
        passwordArbitrary,
        collegeArbitrary,
        phoneArbitrary,
        locationArbitrary,
        locationArbitrary,
        futureDateArbitrary,
        seatsArbitrary,
        async (name, email, password, college, phone, source, destination, departureTime, seats) => {
          // Clear database for this iteration
          await db.User.destroy({ where: {}, force: true });
          await db.Ride.destroy({ where: {}, force: true });
          
          // Create driver
          const driver = await db.User.create({
            name,
            email,
            password,
            college,
            phone,
            role: ['driver']
          });

          // Generate token
          const token = jwt.sign(
            { id: driver.id, email: driver.email, role: driver.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          // Create ride via GraphQL
          const mutation = `
            mutation CreateRide($input: CreateRideInput!) {
              createRide(input: $input) {
                id
                source
                destination
                departureTime
                availableSeats
                totalSeats
                status
                driver {
                  id
                  name
                }
              }
            }
          `;

          const variables = {
            input: {
              source,
              destination,
              departureTime: departureTime.toISOString(),
              availableSeats: seats
            }
          };

          const response = await executeGraphQL(mutation, variables, token);

          expect(response.status).toBe(200);
          expect(response.body.data.createRide).toBeDefined();
          expect(response.body.data.createRide.source).toBe(source);
          expect(response.body.data.createRide.destination).toBe(destination);
          expect(response.body.data.createRide.availableSeats).toBe(seats);
          expect(response.body.data.createRide.totalSeats).toBe(seats);
          expect(response.body.data.createRide.status).toBe('active');
          expect(response.body.data.createRide.driver.id).toBe(driver.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 67: GraphQL booking mutation
 * Validates: Requirements 17.3
 */
describe('Property 67: GraphQL booking mutation', () => {
  test('should create booking and return confirmation with updated ride details', async () => {
    await fc.assert(
      fc.asyncProperty(
        nameArbitrary,
        emailArbitrary,
        passwordArbitrary,
        collegeArbitrary,
        phoneArbitrary,
        nameArbitrary,
        emailArbitrary,
        passwordArbitrary,
        collegeArbitrary,
        phoneArbitrary,
        locationArbitrary,
        locationArbitrary,
        futureDateArbitrary,
        seatsArbitrary,
        async (
          driverName, driverEmail, driverPassword, driverCollege, driverPhone,
          passengerName, passengerEmail, passengerPassword, passengerCollege, passengerPhone,
          source, destination, departureTime, seats
        ) => {
          // Ensure different emails
          fc.pre(driverEmail !== passengerEmail);

          // Clear database for this iteration
          await db.Booking.destroy({ where: {}, force: true });
          await db.Ride.destroy({ where: {}, force: true });
          await db.User.destroy({ where: {}, force: true });

          // Create driver
          const driver = await db.User.create({
            name: driverName,
            email: driverEmail,
            password: driverPassword,
            college: driverCollege,
            phone: driverPhone,
            role: ['driver']
          });

          // Create passenger
          const passenger = await db.User.create({
            name: passengerName,
            email: passengerEmail,
            password: passengerPassword,
            college: passengerCollege,
            phone: passengerPhone,
            role: ['passenger']
          });

          // Create ride
          const ride = await db.Ride.create({
            driverId: driver.id,
            source,
            destination,
            departureTime,
            availableSeats: seats,
            totalSeats: seats,
            status: 'active'
          });

          // Generate token for passenger
          const token = jwt.sign(
            { id: passenger.id, email: passenger.email, role: passenger.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          // Book ride via GraphQL
          const mutation = `
            mutation BookRide($rideId: ID!) {
              bookRide(rideId: $rideId) {
                id
                status
                passenger {
                  id
                  name
                }
                ride {
                  id
                  availableSeats
                }
              }
            }
          `;

          const response = await executeGraphQL(mutation, { rideId: ride.id }, token);

          expect(response.status).toBe(200);
          expect(response.body.data.bookRide).toBeDefined();
          expect(response.body.data.bookRide.status).toBe('confirmed');
          expect(response.body.data.bookRide.passenger.id).toBe(passenger.id);
          expect(response.body.data.bookRide.ride.id).toBe(ride.id);
          expect(response.body.data.bookRide.ride.availableSeats).toBe(seats - 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 68: GraphQL excludes sensitive data
 * Validates: Requirements 17.4
 */
describe('Property 68: GraphQL excludes sensitive data', () => {
  test('should return user data excluding password hash', async () => {
    await fc.assert(
      fc.asyncProperty(
        nameArbitrary,
        emailArbitrary,
        passwordArbitrary,
        collegeArbitrary,
        phoneArbitrary,
        async (name, email, password, college, phone) => {
          // Clear database for this iteration
          await db.User.destroy({ where: {}, force: true });
          
          // Create user
          const user = await db.User.create({
            name,
            email,
            password,
            college,
            phone,
            role: ['passenger']
          });

          // Query user
          const query = `
            query GetUser($id: ID!) {
              user(id: $id) {
                id
                name
                email
                college
                phone
                role
              }
            }
          `;

          const response = await executeGraphQL(query, { id: user.id });

          expect(response.status).toBe(200);
          expect(response.body.data.user).toBeDefined();
          expect(response.body.data.user.id).toBe(user.id);
          expect(response.body.data.user.name).toBe(name);
          expect(response.body.data.user.email).toBe(email);
          
          // Password should not be in the response at all
          expect(response.body.data.user.password).toBeUndefined();
          
          // Even if we try to query it, it shouldn't be available
          const queryWithPassword = `
            query GetUser($id: ID!) {
              user(id: $id) {
                id
                name
                password
              }
            }
          `;

          const responseWithPassword = await executeGraphQL(queryWithPassword, { id: user.id });
          
          // Should get an error because password field doesn't exist in schema
          expect(responseWithPassword.body.errors).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 69: GraphQL authentication
 * Validates: Requirements 17.5
 */
describe('Property 69: GraphQL authentication', () => {
  test('should authenticate requests using JWT token from headers', async () => {
    await fc.assert(
      fc.asyncProperty(
        nameArbitrary,
        emailArbitrary,
        passwordArbitrary,
        collegeArbitrary,
        phoneArbitrary,
        async (name, email, password, college, phone) => {
          // Clear database for this iteration
          await db.User.destroy({ where: {}, force: true });
          
          // Create user
          const user = await db.User.create({
            name,
            email,
            password,
            college,
            phone,
            role: ['passenger']
          });

          // Generate valid token
          const validToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          // Query that requires authentication
          const query = `
            query {
              me {
                id
                name
                email
              }
            }
          `;

          // Test with valid token
          const responseWithToken = await executeGraphQL(query, {}, validToken);
          expect(responseWithToken.status).toBe(200);
          expect(responseWithToken.body.data.me).toBeDefined();
          expect(responseWithToken.body.data.me.id).toBe(user.id);

          // Test without token
          const responseWithoutToken = await executeGraphQL(query, {}, null);
          expect(responseWithoutToken.status).toBe(200);
          expect(responseWithoutToken.body.errors).toBeDefined();
          expect(responseWithoutToken.body.errors[0].message).toContain('Not authenticated');

          // Test with invalid token
          const responseWithInvalidToken = await executeGraphQL(query, {}, 'invalid-token');
          expect(responseWithInvalidToken.status).toBe(200);
          expect(responseWithInvalidToken.body.errors).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
