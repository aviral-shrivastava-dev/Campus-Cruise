const winston = require('winston');
const path = require('path');

/**
 * Sanitize sensitive data from logs
 * Removes passwords, tokens, and other sensitive information
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'cookie',
    'secret',
    'apiKey',
    'creditCard',
    'ssn'
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive field name
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  return sanitizeObject(sanitized);
};

/**
 * Custom format for sanitizing logs
 */
const sanitizeFormat = winston.format((info) => {
  // Sanitize the message if it's an object
  if (info.message && typeof info.message === 'object') {
    info.message = sanitizeLogData(info.message);
  }

  // Sanitize metadata
  if (info.meta) {
    info.meta = sanitizeLogData(info.meta);
  }

  // Sanitize error objects
  if (info.error && typeof info.error === 'object') {
    info.error = sanitizeLogData(info.error);
  }

  // Sanitize any additional properties
  const sanitizedInfo = { ...info };
  for (const [key, value] of Object.entries(sanitizedInfo)) {
    if (key !== 'level' && key !== 'timestamp' && key !== 'message' && typeof value === 'object') {
      sanitizedInfo[key] = sanitizeLogData(value);
    }
  }

  return sanitizedInfo;
});

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const logDir = path.join(__dirname, '../../logs');
  
  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    sanitizeFormat(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      
      // Add stack trace if available
      if (stack) {
        log += `\n${stack}`;
      }
      
      // Add metadata if available
      if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      }
      
      return log;
    })
  );

  // Create transports
  const transports = [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ];

  // Add file transports in production
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      // Error log file
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Combined log file
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
  });
};

// Create and export logger instance
const logger = createLogger();

/**
 * Log error with context
 */
const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    ...sanitizeLogData(context)
  };

  logger.error(errorInfo);
};

/**
 * Log info with context
 */
const logInfo = (message, context = {}) => {
  logger.info(message, sanitizeLogData(context));
};

/**
 * Log warning with context
 */
const logWarning = (message, context = {}) => {
  logger.warn(message, sanitizeLogData(context));
};

/**
 * Log debug with context
 */
const logDebug = (message, context = {}) => {
  logger.debug(message, sanitizeLogData(context));
};

module.exports = {
  logger,
  logError,
  logInfo,
  logWarning,
  logDebug,
  sanitizeLogData
};
