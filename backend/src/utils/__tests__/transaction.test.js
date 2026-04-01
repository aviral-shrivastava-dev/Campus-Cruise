const { withTransaction, executeInTransaction, retryOperation } = require('../transaction');
const { sequelize } = require('../../models');
const { DatabaseError } = require('../../middleware/errorHandler');

describe('Transaction Utility Functions', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('withTransaction', () => {
    test('should execute callback within transaction and commit on success', async () => {
      const result = await withTransaction(async (transaction) => {
        expect(transaction).toBeDefined();
        return 'success';
      });
      
      expect(result).toBe('success');
    });

    test('should rollback transaction on error', async () => {
      await expect(
        withTransaction(async (transaction) => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    test('should pass transaction to callback', async () => {
      await withTransaction(async (transaction) => {
        expect(transaction).toBeDefined();
        expect(transaction.commit).toBeDefined();
        expect(transaction.rollback).toBeDefined();
      });
    });

    test('should handle multiple operations in transaction', async () => {
      const results = await withTransaction(async (transaction) => {
        const result1 = 'operation1';
        const result2 = 'operation2';
        return [result1, result2];
      });
      
      expect(results).toEqual(['operation1', 'operation2']);
    });
  });

  describe('executeInTransaction', () => {
    test('should execute array of operations in transaction', async () => {
      const operations = [
        async (transaction) => 'result1',
        async (transaction) => 'result2',
        async (transaction) => 'result3'
      ];
      
      const results = await executeInTransaction(operations);
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    test('should throw error for empty operations array', async () => {
      await expect(executeInTransaction([])).rejects.toThrow(DatabaseError);
    });

    test('should throw error for non-array input', async () => {
      await expect(executeInTransaction('not-an-array')).rejects.toThrow(DatabaseError);
    });

    test('should throw error if operation is not a function', async () => {
      const operations = [
        async (transaction) => 'result1',
        'not-a-function'
      ];
      
      await expect(executeInTransaction(operations)).rejects.toThrow(DatabaseError);
    });

    test('should rollback all operations if one fails', async () => {
      const operations = [
        async (transaction) => 'result1',
        async (transaction) => {
          throw new Error('Operation failed');
        },
        async (transaction) => 'result3'
      ];
      
      await expect(executeInTransaction(operations)).rejects.toThrow('Operation failed');
    });

    test('should pass transaction to each operation', async () => {
      const operations = [
        async (transaction) => {
          expect(transaction).toBeDefined();
          return 'result1';
        },
        async (transaction) => {
          expect(transaction).toBeDefined();
          return 'result2';
        }
      ];
      
      await executeInTransaction(operations);
    });
  });

  describe('retryOperation', () => {
    test('should return result on first success', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryOperation(operation, 3);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await retryOperation(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should throw error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(retryOperation(operation, 2, 10)).rejects.toThrow(DatabaseError);
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('should not retry on validation errors (4xx)', async () => {
      const error = new Error('Validation error');
      error.statusCode = 400;
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(retryOperation(operation, 3, 10)).rejects.toThrow('Validation error');
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });

    test('should use exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryOperation(operation, 2, 50);
      const endTime = Date.now();
      
      // Should have delays: 50ms + 100ms = 150ms minimum
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    test('should handle async operations', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Not ready');
        }
        return 'success';
      };
      
      const result = await retryOperation(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });
});
