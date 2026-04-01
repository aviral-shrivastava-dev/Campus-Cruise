const { generateToken, verifyToken, decodeToken } = require('../jwt');
const jwt = require('jsonwebtoken');

describe('JWT Utility Functions', () => {
  const mockUser = {
    id: 'test-user-id',
    role: ['passenger']
  };

  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include user id and role in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token);
      
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.role).toEqual(mockUser.role);
    });

    test('should include iat (issued at) timestamp', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token);
      
      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });

    test('should include expiration time', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('should generate different tokens for different users', () => {
      const user1 = { id: 'user1', role: ['passenger'] };
      const user2 = { id: 'user2', role: ['driver'] };
      
      const token1 = generateToken(user1);
      const token2 = generateToken(user2);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    test('should verify and decode a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.role).toEqual(mockUser.role);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
    });

    test('should throw error for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { id: mockUser.id, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      // Wait a moment to ensure expiration
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        expect(() => verifyToken(expiredToken)).toThrow('Token has expired');
      });
    });

    test('should throw error for token with wrong signature', () => {
      const token = jwt.sign(
        { id: mockUser.id, role: mockUser.role },
        'wrong-secret',
        { expiresIn: '1h' }
      );
      
      expect(() => verifyToken(token)).toThrow('Invalid token');
    });

    test('should throw error for malformed token', () => {
      expect(() => verifyToken('not-a-token')).toThrow('Invalid token');
    });
  });

  describe('decodeToken', () => {
    test('should decode token without verification', () => {
      const token = generateToken(mockUser);
      const decoded = decodeToken(token);
      
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.role).toEqual(mockUser.role);
    });

    test('should decode expired token without throwing', () => {
      const expiredToken = jwt.sign(
        { id: mockUser.id, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      const decoded = decodeToken(expiredToken);
      expect(decoded.id).toBe(mockUser.id);
    });

    test('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});
