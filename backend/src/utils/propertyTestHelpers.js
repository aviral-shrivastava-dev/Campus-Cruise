const { sequelize } = require('../models');
const { cleanupTestData, resetDatabase } = require('./testFactories');

/**
 * Property test helpers for common test patterns
 * These helpers reduce boilerplate in property-based tests
 */

/**
 * Setup function to run before all property tests
 * Initializes database and creates tables
 */
const setupPropertyTests = async () => {
  await resetDatabase(sequelize);
};

/**
 * Cleanup function to run after each property test
 * Removes all test data to ensure test isolation
 */
const cleanupAfterPropertyTest = async () => {
  await cleanupTestData();
};

/**
 * Teardown function to run after all property tests
 * Closes database connection
 */
const teardownPropertyTests = async () => {
  await sequelize.close();
};

/**
 * Standard test hooks for property-based tests
 * Use this in describe blocks for consistent setup/teardown
 * 
 * @example
 * describe('My Property Tests', () => {
 *   setupPropertyTestHooks();
 *   
 *   test('my property', async () => {
 *     // test code
 *   });
 * });
 */
const setupPropertyTestHooks = () => {
  beforeAll(async () => {
    await setupPropertyTests();
  });

  afterEach(async () => {
    await cleanupAfterPropertyTest();
  });

  afterAll(async () => {
    await teardownPropertyTests();
  });
};

/**
 * Wrapper for property tests that automatically handles database cleanup
 * Use this for tests that modify database state
 * 
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Test function
 * @param {number} timeout - Test timeout in milliseconds
 */
const propertyTest = (testName, testFn, timeout = 60000) => {
  test(testName, async () => {
    try {
      await testFn();
    } finally {
      // Ensure cleanup even if test fails
      await cleanupAfterPropertyTest();
    }
  }, timeout);
};

/**
 * Helper to verify that a property holds for all generated values
 * Provides better error messages when properties fail
 * 
 * @param {string} propertyName - Name of the property being tested
 * @param {Function} predicate - Function that returns true if property holds
 * @param {*} value - The value being tested
 * @param {Object} context - Additional context for error messages
 */
const assertProperty = (propertyName, predicate, value, context = {}) => {
  const result = predicate(value);
  
  if (!result) {
    const errorMessage = `Property "${propertyName}" failed for value: ${JSON.stringify(value, null, 2)}`;
    const contextMessage = Object.keys(context).length > 0 
      ? `\nContext: ${JSON.stringify(context, null, 2)}`
      : '';
    
    throw new Error(errorMessage + contextMessage);
  }
  
  return result;
};

/**
 * Helper to test round-trip properties (serialize/deserialize, encode/decode, etc.)
 * 
 * @param {Function} forward - Forward transformation (e.g., serialize)
 * @param {Function} backward - Backward transformation (e.g., deserialize)
 * @param {*} value - Value to test
 * @param {Function} equals - Optional equality function (defaults to deep equal)
 */
const assertRoundTrip = async (forward, backward, value, equals = null) => {
  const transformed = await forward(value);
  const restored = await backward(transformed);
  
  if (equals) {
    expect(equals(value, restored)).toBe(true);
  } else {
    expect(restored).toEqual(value);
  }
};

/**
 * Helper to test invariant properties (properties that don't change)
 * 
 * @param {Function} operation - Operation to perform
 * @param {Function} invariant - Function that extracts the invariant value
 * @param {*} initialState - Initial state
 */
const assertInvariant = async (operation, invariant, initialState) => {
  const initialValue = invariant(initialState);
  const finalState = await operation(initialState);
  const finalValue = invariant(finalState);
  
  expect(finalValue).toEqual(initialValue);
};

/**
 * Helper to test idempotent operations (f(x) = f(f(x)))
 * 
 * @param {Function} operation - Operation to test
 * @param {*} value - Value to test
 */
const assertIdempotent = async (operation, value) => {
  const once = await operation(value);
  const twice = await operation(once);
  
  expect(twice).toEqual(once);
};

/**
 * Helper to test that an operation is commutative (order doesn't matter)
 * 
 * @param {Function} operation - Binary operation to test
 * @param {*} a - First value
 * @param {*} b - Second value
 */
const assertCommutative = async (operation, a, b) => {
  const resultAB = await operation(a, b);
  const resultBA = await operation(b, a);
  
  expect(resultAB).toEqual(resultBA);
};

/**
 * Helper to test that an operation is associative ((a op b) op c = a op (b op c))
 * 
 * @param {Function} operation - Binary operation to test
 * @param {*} a - First value
 * @param {*} b - Second value
 * @param {*} c - Third value
 */
const assertAssociative = async (operation, a, b, c) => {
  const leftAssoc = await operation(await operation(a, b), c);
  const rightAssoc = await operation(a, await operation(b, c));
  
  expect(leftAssoc).toEqual(rightAssoc);
};

/**
 * Helper to verify error conditions
 * Tests that invalid inputs properly signal errors
 * 
 * @param {Function} operation - Operation that should throw
 * @param {*} invalidInput - Invalid input value
 * @param {string|RegExp} expectedError - Expected error message or pattern
 */
const assertThrowsError = async (operation, invalidInput, expectedError = null) => {
  if (expectedError) {
    await expect(operation(invalidInput)).rejects.toThrow(expectedError);
  } else {
    await expect(operation(invalidInput)).rejects.toThrow();
  }
};

/**
 * Helper to test metamorphic properties
 * Tests relationships between inputs and outputs without knowing exact values
 * 
 * @param {Function} operation - Operation to test
 * @param {*} input - Input value
 * @param {Function} relationship - Function that verifies the relationship
 */
const assertMetamorphic = async (operation, input, relationship) => {
  const output = await operation(input);
  const holds = relationship(input, output);
  
  expect(holds).toBe(true);
};

/**
 * Helper to collect statistics about generated values
 * Useful for debugging generators
 * 
 * @param {Array} values - Array of generated values
 * @returns {Object} Statistics about the values
 */
const collectStatistics = (values) => {
  const stats = {
    count: values.length,
    types: {},
    samples: values.slice(0, 5)
  };
  
  values.forEach(value => {
    const type = typeof value;
    stats.types[type] = (stats.types[type] || 0) + 1;
  });
  
  return stats;
};

/**
 * Helper to verify that a generator produces diverse values
 * 
 * @param {Array} values - Array of generated values
 * @param {number} minUnique - Minimum number of unique values expected
 */
const assertDiversity = (values, minUnique) => {
  const unique = new Set(values.map(v => JSON.stringify(v)));
  expect(unique.size).toBeGreaterThanOrEqual(minUnique);
};

module.exports = {
  setupPropertyTests,
  cleanupAfterPropertyTest,
  teardownPropertyTests,
  setupPropertyTestHooks,
  propertyTest,
  assertProperty,
  assertRoundTrip,
  assertInvariant,
  assertIdempotent,
  assertCommutative,
  assertAssociative,
  assertThrowsError,
  assertMetamorphic,
  collectStatistics,
  assertDiversity
};
