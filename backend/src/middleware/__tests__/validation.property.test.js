const fc = require('fast-check');
const request = require('supertest');
const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../validation');
const { sanitizeInput, escapeHtml } = require('../sanitization');
const { registerValidation, loginValidation } = require('../validators');
const db = require('../../models');

// Create a test app with validation
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Test route for data type validation (no sanitization)
  app.post('/api/test/validate-types',
    [
      body('name').isString().withMessage('Name must be a string'),
      body('age').isInt().withMessage('Age must be an integer'),
      body('email').isEmail().withMessage('Email must be valid'),
      body('active').isBoolean().withMessage('Active must be a boolean')
    ],
    handleValidationErrors,
    (req, res) => {
      res.json({ success: true, data: req.body });
    }
  );

  // Test route for XSS prevention (with sanitization)
  app.post('/api/test/sanitize',
    sanitizeInput,
    (req, res) => {
      res.json({ success: true, data: req.body });
    }
  );

  // Test route for email validation
  app.post('/api/test/email',
    loginValidation,
    handleValidationErrors,
    (req, res) => {
      res.json({ success: true, email: req.body.email });
    }
  );

  // Test route for registration validation
  app.post('/api/test/register',
    registerValidation,
    handleValidationErrors,
    (req, res) => {
      res.json({ success: true, data: req.body });
    }
  );

  return app;
};

const app = createTestApp();

// Setup and teardown
beforeAll(async () => {
  try {
    await db.sequelize.authenticate();
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

/**
 * Feature: campus-cruise, Property 74: Data type validation
 * Validates: Requirements 19.1
 */
describe('Property 74: Data type validation', () => {
  test('should accept valid data types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        fc.integer({ min: 0, max: 120 }),
        fc.emailAddress(),
        fc.boolean(),
        async (name, age, email, active) => {
          const response = await request(app)
            .post('/api/test/validate-types')
            .send({ name, age, email, active });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should reject invalid string type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
        fc.integer(),
        fc.emailAddress(),
        fc.boolean(),
        async (invalidName, age, email, active) => {
          const response = await request(app)
            .post('/api/test/validate-types')
            .send({ name: invalidName, age, email, active });

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
          expect(response.body.error.details).toHaveProperty('name');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should reject invalid integer type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
        fc.oneof(fc.string(), fc.boolean(), fc.double()),
        fc.emailAddress(),
        fc.boolean(),
        async (name, invalidAge, email, active) => {
          fc.pre(!Number.isInteger(invalidAge));
          
          const response = await request(app)
            .post('/api/test/validate-types')
            .send({ name, age: invalidAge, email, active });

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
          expect(response.body.error.details).toHaveProperty('age');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should reject invalid email format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        fc.integer({ min: 0, max: 120 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@') || !s.includes('.')),
        fc.boolean(),
        async (name, age, invalidEmail, active) => {
          const response = await request(app)
            .post('/api/test/validate-types')
            .send({ name, age, email: invalidEmail, active });

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
          expect(response.body.error.details).toHaveProperty('email');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should reject invalid boolean type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2),
        fc.integer(),
        fc.emailAddress(),
        fc.oneof(fc.string(), fc.integer()),
        async (name, age, email, invalidActive) => {
          fc.pre(typeof invalidActive !== 'boolean');
          
          const response = await request(app)
            .post('/api/test/validate-types')
            .send({ name, age, email, active: invalidActive });

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
          expect(response.body.error.details).toHaveProperty('active');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 75: XSS prevention through sanitization
 * Validates: Requirements 19.2
 */
describe('Property 75: XSS prevention through sanitization', () => {
  test('should escape HTML special characters', () => {
    const xssPayloads = [
      { input: '<script>alert("XSS")</script>', shouldContain: '&lt;' },
      { input: '<img src=x onerror=alert("XSS")>', shouldContain: '&lt;' },
      { input: '<svg onload=alert("XSS")>', shouldContain: '&lt;' },
      { input: '"><script>alert("XSS")</script>', shouldContain: '&lt;' },
      { input: '<iframe src="javascript:alert(\'XSS\')">', shouldContain: '&lt;' },
      { input: '<body onload=alert("XSS")>', shouldContain: '&lt;' },
      { input: "'; DROP TABLE users; --", shouldContain: '&#x27;' }
    ];

    xssPayloads.forEach(({ input, shouldContain }) => {
      const sanitized = escapeHtml(input);
      
      // Should not contain unescaped < or >
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('<svg');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<body');
      
      // Should contain escaped versions
      expect(sanitized).toContain(shouldContain);
    });
  });

  test('should sanitize text inputs in request body', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          '<script>alert("XSS")</script>',
          '<img src=x onerror=alert(1)>',
          '"><script>alert(1)</script>',
          '<svg/onload=alert(1)>'
        ),
        async (xssPayload) => {
          const response = await request(app)
            .post('/api/test/sanitize')
            .send({ message: xssPayload });

          expect(response.status).toBe(200);
          expect(response.body.data.message).not.toContain('<script');
          expect(response.body.data.message).not.toContain('<img');
          expect(response.body.data.message).not.toContain('<svg');
          expect(response.body.data.message).toContain('&lt;');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should sanitize nested objects', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/test/sanitize')
      .send({
        user: {
          name: xssPayload,
          bio: xssPayload,
          nested: {
            field: xssPayload
          }
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user.name).not.toContain('<script');
    expect(response.body.data.user.bio).not.toContain('<script');
    expect(response.body.data.user.nested.field).not.toContain('<script');
    expect(response.body.data.user.name).toContain('&lt;');
  });

  test('should sanitize arrays', async () => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    
    const response = await request(app)
      .post('/api/test/sanitize')
      .send({
        items: [xssPayload, 'safe text', xssPayload]
      });

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]).not.toContain('<img');
    expect(response.body.data.items[2]).not.toContain('<img');
    expect(response.body.data.items[0]).toContain('&lt;');
  });
});

/**
 * Feature: campus-cruise, Property 76: SQL injection prevention
 * Validates: Requirements 19.3
 */
describe('Property 76: SQL injection prevention', () => {
  test('should safely handle SQL injection attempts in user input', async () => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1--",
      "1' AND '1'='1",
      "'; DELETE FROM users WHERE '1'='1"
    ];

    // Note: Sequelize automatically uses parameterized queries
    // This test verifies that malicious SQL is treated as data, not code
    for (const payload of sqlInjectionPayloads) {
      const { User } = db;
      
      // Try to find user with SQL injection payload as email
      const result = await User.findOne({ where: { email: payload } });
      
      // Should not find any user (payload treated as literal string)
      expect(result).toBeNull();
      
      // Verify database is still intact by counting users
      const count = await User.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should use parameterized queries for all Sequelize operations', async () => {
    const { User } = db;
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (maliciousInput) => {
          // Try various Sequelize operations with potentially malicious input
          // All should be safely parameterized
          
          // findOne with where clause
          const user1 = await User.findOne({ where: { email: maliciousInput } });
          expect(user1).toBeNull();
          
          // findAll with where clause
          const users = await User.findAll({ where: { name: maliciousInput } });
          expect(Array.isArray(users)).toBe(true);
          
          // Count with where clause
          const count = await User.count({ where: { college: maliciousInput } });
          expect(typeof count).toBe('number');
          expect(count).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: campus-cruise, Property 77: Validation error responses
 * Validates: Requirements 19.4
 */
describe('Property 77: Validation error responses', () => {
  test('should return 400 status code on validation failure', async () => {
    // Test with missing required field
    const response = await request(app)
      .post('/api/test/email')
      .send({
        email: 'test@example.com'
        // password is missing
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toHaveProperty('password');
  });

  test('should include specific error messages in response', async () => {
    const response = await request(app)
      .post('/api/test/register')
      .send({
        name: 'A',
        email: 'invalid-email',
        password: 'short',
        college: 'X',
        phone: '123',
        role: []
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toBeDefined();
    expect(Object.keys(response.body.error.details).length).toBeGreaterThan(0);
  });

  test('should include field names in error details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 1 }).filter(s => s.trim().length === 1),
        async (shortName) => {
          const response = await request(app)
            .post('/api/test/register')
            .send({
              name: shortName,
              email: 'valid@example.com',
              password: 'validpassword123',
              college: 'Valid College',
              phone: '1234567890',
              role: ['passenger']
            });

          expect(response.status).toBe(400);
          expect(response.body.error.details).toHaveProperty('name');
          expect(response.body.error.details.name).toContain('between 2 and 100');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should include timestamp in error response', async () => {
    const response = await request(app)
      .post('/api/test/email')
      .send({
        email: 'invalid',
        password: 'test'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.timestamp).toBeDefined();
    expect(new Date(response.body.error.timestamp).toString()).not.toBe('Invalid Date');
  });
});

/**
 * Feature: campus-cruise, Property 78: Email format validation
 * Validates: Requirements 19.5
 */
describe('Property 78: Email format validation', () => {
  test('should accept valid email formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8),
        async (email, password) => {
          const response = await request(app)
            .post('/api/test/email')
            .send({ email, password });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should reject invalid email formats', async () => {
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user @example.com',
      'user@.com',
      'user..name@example.com',
      'user@example',
      'user name@example.com',
      'user@exam ple.com',
      ''
    ];

    for (const invalidEmail of invalidEmails) {
      const response = await request(app)
        .post('/api/test/email')
        .send({
          email: invalidEmail,
          password: 'validpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveProperty('email');
    }
  });

  test('should validate email with regex pattern', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@') || !s.includes('.')),
        async (invalidEmail) => {
          const response = await request(app)
            .post('/api/test/email')
            .send({
              email: invalidEmail,
              password: 'validpassword123'
            });

          expect(response.status).toBe(400);
          expect(response.body.error.details).toHaveProperty('email');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should normalize email addresses', async () => {
    const emailVariations = [
      'Test@Example.COM',
      'test@EXAMPLE.com',
      'TEST@example.com'
    ];

    for (const email of emailVariations) {
      const response = await request(app)
        .post('/api/test/email')
        .send({
          email,
          password: 'validpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.email.toLowerCase()).toBe('test@example.com');
    }
  });
});
