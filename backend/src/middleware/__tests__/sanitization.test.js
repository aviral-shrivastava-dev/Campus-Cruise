const { sanitizeInput, escapeHtml, sanitizeObject } = require('../sanitization');

describe('Sanitization Middleware', () => {
  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      
      expect(escapeHtml(input)).toBe(expected);
    });

    test('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('should escape less than and greater than', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    });

    test('should escape quotes', () => {
      expect(escapeHtml('"Hello"')).toBe('&quot;Hello&quot;');
      expect(escapeHtml("'Hello'")).toBe('&#x27;Hello&#x27;');
    });

    test('should escape forward slash', () => {
      expect(escapeHtml('</script>')).toBe('&lt;&#x2F;script&gt;');
    });

    test('should return non-string values unchanged', () => {
      expect(escapeHtml(123)).toBe(123);
      expect(escapeHtml(null)).toBe(null);
      expect(escapeHtml(undefined)).toBe(undefined);
      expect(escapeHtml(true)).toBe(true);
    });

    test('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('should handle string with no special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    test('should escape multiple special characters', () => {
      const input = '<img src=x onerror="alert(\'XSS\')">';
      const result = escapeHtml(input);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize string properties', () => {
      const input = {
        name: 'John',
        bio: '<script>alert("XSS")</script>'
      };
      const result = sanitizeObject(input);
      
      expect(result.name).toBe('John');
      expect(result.bio).not.toContain('<script>');
      expect(result.bio).toContain('&lt;script&gt;');
    });

    test('should handle nested objects', () => {
      const input = {
        user: {
          name: 'John',
          comment: '<script>alert("XSS")</script>'
        }
      };
      const result = sanitizeObject(input);
      
      expect(result.user.name).toBe('John');
      expect(result.user.comment).not.toContain('<script>');
    });

    test('should handle arrays', () => {
      const input = ['<script>alert("XSS")</script>', 'normal text'];
      const result = sanitizeObject(input);
      
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('normal text');
    });

    test('should handle arrays of objects', () => {
      const input = [
        { comment: '<script>XSS</script>' },
        { comment: 'Safe comment' }
      ];
      const result = sanitizeObject(input);
      
      expect(result[0].comment).not.toContain('<script>');
      expect(result[1].comment).toBe('Safe comment');
    });

    test('should return null and undefined unchanged', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });

    test('should return non-object primitives unchanged', () => {
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(true)).toBe(true);
    });

    test('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              xss: '<script>alert("XSS")</script>'
            }
          }
        }
      };
      const result = sanitizeObject(input);
      
      expect(result.level1.level2.level3.xss).not.toContain('<script>');
    });

    test('should preserve non-string values in objects', () => {
      const input = {
        name: 'John',
        age: 25,
        active: true,
        score: null
      };
      const result = sanitizeObject(input);
      
      expect(result.name).toBe('John');
      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
      expect(result.score).toBe(null);
    });
  });

  describe('sanitizeInput middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {},
        query: {},
        params: {}
      };
      res = {};
      next = jest.fn();
    });

    test('should sanitize request body', () => {
      req.body = {
        comment: '<script>alert("XSS")</script>',
        name: 'John'
      };

      sanitizeInput(req, res, next);

      expect(req.body.comment).not.toContain('<script>');
      expect(req.body.name).toBe('John');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize query parameters', () => {
      req.query = {
        search: '<script>alert("XSS")</script>'
      };

      sanitizeInput(req, res, next);

      expect(req.query.search).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize route parameters', () => {
      req.params = {
        id: '<script>alert("XSS")</script>'
      };

      sanitizeInput(req, res, next);

      expect(req.params.id).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    test('should handle missing body, query, or params', () => {
      req = {};

      expect(() => sanitizeInput(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize all request parts simultaneously', () => {
      req.body = { comment: '<script>XSS</script>' };
      req.query = { search: '<img src=x onerror=alert(1)>' };
      req.params = { id: '<svg onload=alert(1)>' };

      sanitizeInput(req, res, next);

      expect(req.body.comment).not.toContain('<script>');
      expect(req.query.search).not.toContain('<img');
      expect(req.params.id).not.toContain('<svg');
      expect(next).toHaveBeenCalled();
    });

    test('should handle nested objects in body', () => {
      req.body = {
        user: {
          bio: '<script>alert("XSS")</script>'
        }
      };

      sanitizeInput(req, res, next);

      expect(req.body.user.bio).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    test('should call next exactly once', () => {
      sanitizeInput(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
