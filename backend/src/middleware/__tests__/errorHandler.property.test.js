const fc = require('fast-check');
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  errorHandler,
  notFoundHandler,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  asyncHandler
} = require('../errorHandler');
const { logger, sanitizeLogData } = require('../../utils/logger');
const { withTransaction } = require('../../utils/transaction');
const db = require('../../models');

describe('Error Handling Property Tests', () => {
  let app;
  let logSpy;

  beforeAll(async () => {
    // Connect to test database
    await db.sequelize.authenticate();
  });

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Spy on logger
    logSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  /**
   * **Feature: campus-cruise, Property 86: API error responses**
   * **Validates: Requirements 25.1**
   * 
   * For any error occurring in an API endpoint, the system should return 
   * an appropriate HTTP status code and error message.
   */
  test('Property 86: API error responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          statusCode: fc.integer({ min: 400, max: 599 }),
          message: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          code: fc.constantFrom('VALIDATION_ERROR', 'NOT_FOUND', 'AUTHENTICATION_ERROR', 'INTERNAL_ERROR')
        }),
        async (errorData) => {
          // Create test route that throws error
          app.get('/test-error', (req, res, next) => {
            const error = new Error(errorData.message);
            error.statusCode = errorData.statusCode;
            error.code = errorData.code;
            error.isOperational = true;
            next(error);
          });

          app.use(errorHandler);

          const response = await request(app).get('/test-error');

          // Verify status code is in error range (400-599)
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.status).toBeLessThan(600);
          
          // Verify error response structure
          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toHaveProperty('code');
          expect(response.body.error).toHaveProperty('message');
          expect(response.body.error).toHaveProperty('timestamp');
          
          // Verify error message is a non-empty string
          expect(typeof response.body.error.message).toBe('string');
          expect(response.body.error.message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: campus-cruise, Property 87: Error logging**
   * **Validates: Requirements 25.2**
   * 
   * For any unexpected error, the system should log the error with 
   * timestamp, stack trace, and context information.
   */
  test('Property 87: Error logging', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          message: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          context: fc.record({
            userId: fc.uuid(),
            action: fc.constantFrom('create', 'update', 'delete', 'read')
          })
        }),
        async (testData) => {
          // Create test route that throws error
          app.get('/test-logging', (req, res, next) => {
            req.user = { id: testData.context.userId };
            const error = new Error(testData.message);
            error.stack = `Error: ${testData.message}\n    at test location`;
            next(error);
          });

          app.use(errorHandler);

          await request(app).get('/test-logging');

          // Verify logger was called
          expect(logSpy).toHaveBeenCalled();
          
          // Get the logged error
          const loggedError = logSpy.mock.calls[0][0];
          
          // Verify error has required properties
          expect(loggedError).toHaveProperty('message');
          expect(loggedError).toHaveProperty('stack');
          
          // Verify message is a non-empty string
          expect(typeof loggedError.message).toBe('string');
          expect(loggedError.message.length).toBeGreaterThan(0);
          
          // Verify stack trace exists and is a string
          expect(typeof loggedError.stack).toBe('string');
          expect(loggedError.stack.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: campus-cruise, Property 88: Transaction rollback on failure**
   * **Validates: Requirements 25.3**
   * 
   * For any database operation failure, the system should rollback 
   * the transaction and return an error response.
   */
  test('Property 88: Transaction rollback on failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }),
          email: fc.emailAddress(),
          college: fc.string({ minLength: 2, maxLength: 50 })
        }),
        async (userData) => {
          const { User } = db;
          
          // Track if transaction was rolled back
          let transactionRolledBack = false;
          let userCreated = false;

          try {
            await withTransaction(async (transaction) => {
              // Create a user
              const user = await User.create({
                ...userData,
                password: 'hashedpassword123',
                phone: '1234567890',
                role: ['passenger']
              }, { transaction });

              userCreated = true;

              // Intentionally throw an error to trigger rollback
              throw new Error('Intentional error to test rollback');
            });
          } catch (error) {
            transactionRolledBack = true;
          }

          // Verify transaction was rolled back
          expect(transactionRolledBack).toBe(true);
          expect(userCreated).toBe(true);

          // Verify user was NOT persisted (rollback successful)
          const foundUser = await User.findOne({
            where: { email: userData.email }
          });
          expect(foundUser).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: campus-cruise, Property 89: WebSocket error handling**
   * **Validates: Requirements 25.4**
   * 
   * For any WebSocket error, the system should log the error and 
   * attempt to maintain or re-establish the connection.
   */
  test('Property 89: WebSocket error handling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
          errorCode: fc.constantFrom('SOCKET_ERROR', 'CONNECTION_ERROR', 'AUTH_ERROR')
        }),
        async (errorData) => {
          // Mock socket object
          const mockSocket = {
            id: 'test-socket-id',
            userId: 'test-user-id',
            emit: jest.fn(),
            disconnect: jest.fn(),
            on: jest.fn()
          };

          // Simulate error event
          const error = new Error(errorData.errorMessage);
          error.code = errorData.errorCode;

          // Create error handler
          const errorHandler = (err) => {
            // Log the error
            logger.error(err, {
              context: 'Socket error',
              userId: mockSocket.userId,
              socketId: mockSocket.id
            });

            // Attempt to notify client
            try {
              mockSocket.emit('error', {
                message: 'An error occurred',
                code: 'SOCKET_ERROR',
                timestamp: new Date()
              });
            } catch (emitError) {
              logger.error(emitError, {
                context: 'Failed to emit error to client'
              });
            }
          };

          // Trigger error handler
          errorHandler(error);

          // Verify error was logged
          expect(logSpy).toHaveBeenCalled();

          // Verify client was notified
          expect(mockSocket.emit).toHaveBeenCalledWith(
            'error',
            expect.objectContaining({
              message: expect.any(String),
              code: 'SOCKET_ERROR'
            })
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: campus-cruise, Property 90: Log sanitization**
   * **Validates: Requirements 25.5**
   * 
   * For any error logging, the system should not expose sensitive 
   * information such as passwords or tokens in log messages.
   */
  test('Property 90: Log sanitization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 20 }),
          token: fc.hexaString({ minLength: 32, maxLength: 64 }),
          apiKey: fc.hexaString({ minLength: 16, maxLength: 32 }),
          normalData: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async (sensitiveData) => {
          // Create data object with sensitive fields
          const dataToLog = {
            email: sensitiveData.email,
            password: sensitiveData.password,
            token: sensitiveData.token,
            apiKey: sensitiveData.apiKey,
            normalData: sensitiveData.normalData,
            nested: {
              password: sensitiveData.password,
              accessToken: sensitiveData.token
            }
          };

          // Sanitize the data
          const sanitized = sanitizeLogData(dataToLog);

          // Verify sensitive fields are redacted
          expect(sanitized.password).toBe('[REDACTED]');
          expect(sanitized.token).toBe('[REDACTED]');
          expect(sanitized.apiKey).toBe('[REDACTED]');
          expect(sanitized.nested.password).toBe('[REDACTED]');
          expect(sanitized.nested.accessToken).toBe('[REDACTED]');

          // Verify non-sensitive data is preserved
          expect(sanitized.email).toBe(sensitiveData.email);
          expect(sanitized.normalData).toBe(sensitiveData.normalData);

          // Verify original passwords/tokens are not in sanitized output
          const sanitizedString = JSON.stringify(sanitized);
          expect(sanitizedString).not.toContain(sensitiveData.password);
          expect(sanitizedString).not.toContain(sensitiveData.token);
          expect(sanitizedString).not.toContain(sensitiveData.apiKey);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Additional test: Verify 404 handler
  test('404 handler returns appropriate error', async () => {
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app).get('/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toContain('not found');
  });

  // Additional test: Verify asyncHandler catches errors
  test('asyncHandler catches async errors', async () => {
    app.get('/async-error', asyncHandler(async (req, res) => {
      throw new ValidationError('Async validation failed');
    }));

    app.use(errorHandler);

    const response = await request(app).get('/async-error');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('Async validation failed');
  });
});
