const db = require('../models');
const { logError, logWarning } = require('./logger');
const { DatabaseError } = require('../middleware/errorHandler');

/**
 * Execute a function within a database transaction
 * Automatically commits on success and rolls back on error
 * 
 * @param {Function} callback - Async function to execute within transaction
 * @param {Object} options - Transaction options (isolationLevel, etc.)
 * @returns {Promise} Result of the callback function
 */
const withTransaction = async (callback, options = {}) => {
  const transaction = await db.sequelize.transaction(options);
  
  try {
    // Execute the callback with the transaction
    const result = await callback(transaction);
    
    // Commit the transaction
    await transaction.commit();
    
    return result;
  } catch (error) {
    // Rollback the transaction on error
    try {
      await transaction.rollback();
      logWarning('Transaction rolled back', {
        error: error.message,
        code: error.code
      });
    } catch (rollbackError) {
      logError(rollbackError, {
        context: 'Transaction rollback failed',
        originalError: error.message
      });
    }
    
    // Re-throw the original error
    throw error;
  }
};

/**
 * Wrapper for async database operations with automatic transaction handling
 * Use this for operations that need transaction support
 * 
 * @param {Function} fn - Async function that performs database operations
 * @returns {Function} Wrapped function with transaction support
 */
const transactionWrapper = (fn) => {
  return async (...args) => {
    return withTransaction(async (transaction) => {
      return await fn(...args, transaction);
    });
  };
};

/**
 * Execute multiple operations in a single transaction
 * All operations must succeed or all will be rolled back
 * 
 * @param {Array<Function>} operations - Array of async functions to execute
 * @param {Object} options - Transaction options
 * @returns {Promise<Array>} Array of results from each operation
 */
const executeInTransaction = async (operations, options = {}) => {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new DatabaseError('Operations must be a non-empty array');
  }

  return withTransaction(async (transaction) => {
    const results = [];
    
    for (const operation of operations) {
      if (typeof operation !== 'function') {
        throw new DatabaseError('Each operation must be a function');
      }
      
      const result = await operation(transaction);
      results.push(result);
    }
    
    return results;
  }, options);
};

/**
 * Retry a database operation with exponential backoff
 * Useful for handling transient database errors
 * 
 * @param {Function} operation - Async function to retry
 * @param {Number} maxRetries - Maximum number of retry attempts
 * @param {Number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} Result of the operation
 */
const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation or business logic errors
      if (error.statusCode && error.statusCode < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        logWarning(`Operation failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries,
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logError(lastError, {
    context: 'Operation failed after all retry attempts',
    maxRetries
  });
  
  throw new DatabaseError('Operation failed after multiple attempts');
};

module.exports = {
  withTransaction,
  transactionWrapper,
  executeInTransaction,
  retryOperation
};
