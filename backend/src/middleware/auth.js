const { verifyToken } = require('../utils/jwt');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: error.message || 'Invalid or expired token',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Authorization middleware to check if user has required role
 * @param {string} requiredRole - Role required to access the route
 */
const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!req.user.role || !req.user.role.includes(requiredRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `${requiredRole} role required`,
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
