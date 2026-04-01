const fc = require('fast-check');
const request = require('supertest');
const express = require('express');
const { authenticate, authorize } = require('../auth');
const { generateToken } = require('../../utils/jwt');
const db = require('../../models');

// Create a test app with protected routes
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Test route that requires authentication
  app.get('/api/protected', authenticate, (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // Test route that requires driver role
  app.get('/api/driver-only', authenticate, authorize('driver'), (req, res) => {
    res.json({ success: true, message: 'Driver access granted' });
  });

  return app;
};

const app = createTestApp();

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

// Generators
const userIdArbitrary = fc.uuid();
const roleArbitrary = fc.oneof(
  fc.constant(['driver']),
  fc.constant(['passenger']),
  fc.constant(['driver', 'passenger'])
);

/**
 * Feature: campus-cruise, Property 62: Protected endpoints require JWT
 * Validates: Requirements 16.1, 16.2
 */
describe('Property 62: Protected endpoints require JWT', () => {
  test('should reject requests without JWT token', async () => {
    const response = await request(app)
      .get('/api/protected');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  test('should reject requests with invalid JWT token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (invalidToken) => {
          const response = await request(app)
            .get('/api/protected')
            .set('Authorization', `Bearer ${invalidToken}`);

          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('INVALID_TOKEN');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should reject requests with malformed Authorization header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (malformedHeader) => {
          // Skip if it accidentally starts with "Bearer "
          fc.pre(!malformedHeader.startsWith('Bearer '));

          const response = await request(app)
            .get('/api/protected')
            .set('Authorization', malformedHeader);

          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('NO_TOKEN');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 63: Valid JWT allows access
 * Validates: Requirements 16.3
 */
describe('Property 63: Valid JWT allows access', () => {
  test('should allow access with valid JWT token', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        roleArbitrary,
        async (userId, role) => {
          // Generate valid token
          const token = generateToken({ id: userId, role });

          // Make request with valid token
          const response = await request(app)
            .get('/api/protected')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.user.id).toBe(userId);
          expect(response.body.user.role).toEqual(role);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should extract correct user information from JWT', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        roleArbitrary,
        async (userId, role) => {
          const token = generateToken({ id: userId, role });

          const response = await request(app)
            .get('/api/protected')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(200);
          expect(response.body.user).toBeDefined();
          expect(response.body.user.id).toBe(userId);
          expect(response.body.user.role).toEqual(role);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 64: JWT signature verification
 * Validates: Requirements 16.5
 */
describe('Property 64: JWT signature verification', () => {
  test('should reject JWT with invalid signature', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        roleArbitrary,
        async (userId, role) => {
          // Generate valid token
          const validToken = generateToken({ id: userId, role });

          // Tamper with the token by modifying the signature
          const parts = validToken.split('.');
          if (parts.length === 3) {
            // Modify the last character of the signature
            const tamperedSignature = parts[2].slice(0, -1) + 'X';
            const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

            const response = await request(app)
              .get('/api/protected')
              .set('Authorization', `Bearer ${tamperedToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_TOKEN');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should reject JWT with modified payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        roleArbitrary,
        fc.uuid(),
        async (userId, role, differentUserId) => {
          // Ensure different user ID
          fc.pre(userId !== differentUserId);

          // Generate valid token
          const validToken = generateToken({ id: userId, role });

          // Try to modify the payload by creating a new token with different data
          // but using the old signature (this should fail verification)
          const parts = validToken.split('.');
          if (parts.length === 3) {
            // Create a new payload with different user ID
            const newPayload = Buffer.from(JSON.stringify({
              id: differentUserId,
              role: role,
              iat: Math.floor(Date.now() / 1000)
            })).toString('base64url');

            // Use the new payload with the old signature
            const tamperedToken = `${parts[0]}.${newPayload}.${parts[2]}`;

            const response = await request(app)
              .get('/api/protected')
              .set('Authorization', `Bearer ${tamperedToken}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_TOKEN');
          }
        }
      ),
      { numRuns: 50 } // Reduced runs to avoid timeout
    );
  }, 60000); // Increased timeout to 60 seconds
});

/**
 * Additional test: Role-based authorization
 * Validates: Requirements 16.4
 */
describe('Role-based authorization', () => {
  test('should allow access to driver-only route with driver role', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        async (userId) => {
          const token = generateToken({ id: userId, role: ['driver'] });

          const response = await request(app)
            .get('/api/driver-only')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should deny access to driver-only route without driver role', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        async (userId) => {
          const token = generateToken({ id: userId, role: ['passenger'] });

          const response = await request(app)
            .get('/api/driver-only')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(403);
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should allow access with multiple roles including driver', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        async (userId) => {
          const token = generateToken({ id: userId, role: ['driver', 'passenger'] });

          const response = await request(app)
            .get('/api/driver-only')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
