const fc = require('fast-check');
const request = require('supertest');
const { app } = require('../../server');
const db = require('../../models');
const { verifyToken } = require('../../utils/jwt');

// Mock email service before importing controller
jest.mock('../../services/email.service', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendRideCancellationEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
}));

const emailService = require('../../services/email.service');

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
    // Clear all users before each test
    await db.User.destroy({ where: {}, force: true });
  } catch (error) {
    console.error('Failed to clear users:', error);
  }
});

// Generators for test data - ensure they produce valid, non-whitespace strings
const emailArbitrary = fc.emailAddress();
const passwordArbitrary = fc.string({ minLength: 8, maxLength: 50 })
  .map(s => {
    const trimmed = s.trim();
    return trimmed.length >= 8 ? trimmed : 'password123';
  });
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

const userDataArbitrary = fc.record({
  email: emailArbitrary,
  password: passwordArbitrary,
  name: nameArbitrary,
  college: collegeArbitrary,
  phone: phoneArbitrary,
  role: roleArbitrary
});

/**
 * Feature: campus-cruise, Property 3: Valid credentials return JWT tokens
 * Validates: Requirements 2.1, 2.3
 */
describe('Property 3: Valid credentials return JWT tokens', () => {
  test('should return JWT token with user ID, role, and expiration for valid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(userDataArbitrary, async (userData) => {
        // Clear database for this iteration
        await db.User.destroy({ where: {}, force: true });
        
        // Register user first
        const registerRes = await request(app)
          .post('/api/auth/register')
          .send(userData);

        expect(registerRes.status).toBe(201);
        const registeredUser = registerRes.body.data.user;

        // Login with valid credentials
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.success).toBe(true);
        expect(loginRes.body.data.token).toBeDefined();

        // Verify token contains correct payload
        const decoded = verifyToken(loginRes.body.data.token);
        expect(decoded.id).toBe(registeredUser.id);
        expect(decoded.role).toEqual(userData.role);
        expect(decoded.exp).toBeDefined();
        expect(decoded.iat).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 4: Invalid credentials are rejected
 * Validates: Requirements 2.2
 */
describe('Property 4: Invalid credentials are rejected', () => {
  test('should reject login with wrong password', async () => {
    await fc.assert(
      fc.asyncProperty(
        userDataArbitrary,
        fc.string({ minLength: 8, maxLength: 50 }),
        async (userData, wrongPassword) => {
          // Ensure wrong password is different
          fc.pre(wrongPassword !== userData.password);
          
          // Clear database for this iteration
          await db.User.destroy({ where: {}, force: true });

          // Register user
          await request(app)
            .post('/api/auth/register')
            .send(userData);

          // Try to login with wrong password
          const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
              email: userData.email,
              password: wrongPassword
            });

          expect(loginRes.status).toBe(401);
          expect(loginRes.body.success).toBe(false);
          expect(loginRes.body.error.code).toBe('INVALID_CREDENTIALS');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should reject login with non-existent email', async () => {
    await fc.assert(
      fc.asyncProperty(
        emailArbitrary,
        passwordArbitrary,
        async (email, password) => {
          // Clear database for this iteration
          await db.User.destroy({ where: {}, force: true });
          
          // Try to login with non-existent email
          const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email, password });

          expect(loginRes.status).toBe(401);
          expect(loginRes.body.success).toBe(false);
          expect(loginRes.body.error.code).toBe('INVALID_CREDENTIALS');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 5: Login updates user status
 * Validates: Requirements 2.5
 */
describe('Property 5: Login updates user status', () => {
  test('should update lastSeen and isOnline on successful login', async () => {
    await fc.assert(
      fc.asyncProperty(userDataArbitrary, async (userData) => {
        // Clear database for this iteration
        await db.User.destroy({ where: {}, force: true });
        
        // Register user
        const registerRes = await request(app)
          .post('/api/auth/register')
          .send(userData);

        const userId = registerRes.body.data.user.id;

        // Get user before login
        const userBefore = await db.User.findByPk(userId);
        const lastSeenBefore = userBefore.lastSeen;

        // Wait a moment to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        // Login
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          });

        expect(loginRes.status).toBe(200);

        // Get user after login
        const userAfter = await db.User.findByPk(userId);

        // Verify status updates
        expect(userAfter.isOnline).toBe(true);
        expect(userAfter.lastSeen).toBeDefined();
        
        // lastSeen should be updated (either was null or is now later)
        if (lastSeenBefore) {
          expect(new Date(userAfter.lastSeen).getTime()).toBeGreaterThan(
            new Date(lastSeenBefore).getTime()
          );
        } else {
          expect(userAfter.lastSeen).not.toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 6: Registration sends confirmation email
 * Validates: Requirements 1.3
 */
describe('Property 6: Registration sends confirmation email', () => {
  test('should trigger welcome email on registration', async () => {
    await fc.assert(
      fc.asyncProperty(userDataArbitrary, async (userData) => {
        // Clear mock calls
        emailService.sendWelcomeEmail.mockClear();
        
        // Clear database before each iteration to avoid duplicate email errors
        await db.User.destroy({ where: {}, force: true });

        // Register user
        const registerRes = await request(app)
          .post('/api/auth/register')
          .send(userData);

        expect(registerRes.status).toBe(201);

        // Wait a bit for async email call
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify email was attempted
        expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
        expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
          userData.email,
          userData.name
        );
      }),
      { numRuns: 50 } // Reduced runs due to mocking overhead
    );
  });
});
