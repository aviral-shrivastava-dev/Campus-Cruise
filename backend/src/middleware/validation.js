const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors from express-validator
 * Returns 400 Bad Request with specific validation error messages
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = {};
    errors.array().forEach(error => {
      errorDetails[error.path || error.param] = error.msg;
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errorDetails,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors
};
