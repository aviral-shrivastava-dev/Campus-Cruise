// Load environment variables from .env file
require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'campus_cruise_test';
// Keep other DB settings from .env (host, user, password, port)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_EXPIRATION = '7d';

// Email configuration for tests (use test mode)
process.env.EMAIL_HOST = 'smtp.ethereal.email';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASSWORD = 'test-password';
process.env.EMAIL_FROM = 'Campus Cruise Test <test@campuscruise.com>';

// Increase timeout for property-based tests
jest.setTimeout(30000);

// Mock Firebase globally for all tests
const mockRef = jest.fn((path) => ({
  set: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue(true),
  once: jest.fn().mockResolvedValue({
    val: () => ({
      driverId: 'test-driver-id',
      tracking: true,
      startedAt: Date.now(),
      latitude: 0,
      longitude: 0,
      timestamp: Date.now()
    })
  }),
  remove: jest.fn().mockResolvedValue(true)
}));

const mockDatabase = {
  ref: mockRef
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  database: jest.fn(() => mockDatabase)
}));
