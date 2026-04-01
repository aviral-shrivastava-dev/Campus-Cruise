const { sanitizeLogData, logError, logInfo } = require('../logger');

describe('Logger Utility Functions', () => {
  describe('sanitizeLogData', () => {
    test('should return non-object values unchanged', () => {
      expect(sanitizeLogData('string')).toBe('string');
      expect(sanitizeLogData(123)).toBe(123);
      expect(sanitizeLogData(true)).toBe(true);
      expect(sanitizeLogData(null)).toBe(null);
      expect(sanitizeLogData(undefined)).toBe(undefined);
    });

    test('should redact password field', () => {
      const data = { username: 'john', password: 'secret123' };
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.username).toBe('john');
      expect(sanitized.password).toBe('[REDACTED]');
    });

    test('should redact token field', () => {
      const data = { userId: '123', token: 'jwt-token-here' };
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.userId).toBe('123');
      expect(sanitized.token).toBe('[REDACTED]');
    });

    test('should redact multiple sensitive fields', () => {
      const data = {
        username: 'john',
        password: 'secret',
        accessToken: 'token123',
        apiKey: 'key456'
      };
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.username).toBe('john');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
    });

    test('should handle nested objects', () => {
      const data = {
        user: {
          name: 'john',
          password: 'secret'
        },
        session: {
          token: 'jwt-token'
        }
      };
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.user.name).toBe('john');
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.session.token).toBe('[REDACTED]');
    });

    test('should handle arrays', () => {
      const data = [
        { name: 'user1', password: 'pass1' },
        { name: 'user2', password: 'pass2' }
      ];
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized[0].name).toBe('user1');
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[1].name).toBe('user2');
      expect(sanitized[1].password).toBe('[REDACTED]');
    });

    test('should be case-insensitive for sensitive fields', () => {
      const data = {
        Password: 'secret',
        TOKEN: 'jwt',
        ApiKey: 'key'
      };
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.Password).toBe('[REDACTED]');
      expect(sanitized.TOKEN).toBe('[REDACTED]');
      expect(sanitized.ApiKey).toBe('[REDACTED]');
    });

    test('should redact fields containing sensitive keywords', () => {
      const data = {
        userPassword: 'secret',
        authToken: 'jwt',
        secretKey: 'key'
      };
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.userPassword).toBe('[REDACTED]');
      expect(sanitized.authToken).toBe('[REDACTED]');
      expect(sanitized.secretKey).toBe('[REDACTED]');
    });

    test('should not modify original object', () => {
      const data = { username: 'john', password: 'secret' };
      const original = { ...data };
      
      sanitizeLogData(data);
      
      expect(data).toEqual(original);
    });

    test('should handle deeply nested structures', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              password: 'secret',
              username: 'john'
            }
          }
        }
      };
      const sanitized = sanitizeLogData(data);
      
      expect(sanitized.level1.level2.level3.username).toBe('john');
      expect(sanitized.level1.level2.level3.password).toBe('[REDACTED]');
    });
  });

  describe('logError', () => {
    test('should not throw when logging errors', () => {
      const error = new Error('Test error');
      expect(() => logError(error)).not.toThrow();
    });

    test('should handle errors with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      expect(() => logError(error, context)).not.toThrow();
    });

    test('should sanitize sensitive data in context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', password: 'secret' };
      
      // Should not throw and should sanitize password
      expect(() => logError(error, context)).not.toThrow();
    });
  });

  describe('logInfo', () => {
    test('should not throw when logging info', () => {
      expect(() => logInfo('Test message')).not.toThrow();
    });

    test('should handle info with context', () => {
      const context = { userId: '123', action: 'test' };
      expect(() => logInfo('Test message', context)).not.toThrow();
    });

    test('should sanitize sensitive data in context', () => {
      const context = { userId: '123', token: 'secret-token' };
      expect(() => logInfo('Test message', context)).not.toThrow();
    });
  });
});
