const { authenticate, authorize } = require('../auth');
const { generateToken } = require('../../utils/jwt');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('authenticate', () => {
    test('should authenticate valid token and attach user to request', async () => {
      const user = { id: 'user123', role: ['passenger'] };
      const token = generateToken(user);
      req.headers.authorization = `Bearer ${token}`;

      await authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(req.user.role).toEqual(user.role);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NO_TOKEN',
            message: 'No authentication token provided'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat token123';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NO_TOKEN'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_TOKEN'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with empty token', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should include timestamp in error response', async () => {
      await authenticate(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            timestamp: expect.any(String)
          })
        })
      );
    });
  });

  describe('authorize', () => {
    test('should allow access when user has required role', () => {
      req.user = { id: 'user123', role: ['driver', 'passenger'] };
      const middleware = authorize('driver');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access when user lacks required role', () => {
      req.user = { id: 'user123', role: ['passenger'] };
      const middleware = authorize('driver');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'driver role required'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access when user is not authenticated', () => {
      req.user = null;
      const middleware = authorize('driver');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_AUTHENTICATED',
            message: 'Authentication required'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access when user has no roles', () => {
      req.user = { id: 'user123', role: [] };
      const middleware = authorize('driver');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access when user role is undefined', () => {
      req.user = { id: 'user123' };
      const middleware = authorize('driver');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('should work with different required roles', () => {
      req.user = { id: 'user123', role: ['passenger'] };
      const middleware = authorize('passenger');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should include timestamp in error response', () => {
      req.user = { id: 'user123', role: ['passenger'] };
      const middleware = authorize('driver');

      middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            timestamp: expect.any(String)
          })
        })
      );
    });
  });
});
