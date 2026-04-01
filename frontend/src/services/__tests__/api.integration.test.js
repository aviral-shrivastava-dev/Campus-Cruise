/**
 * API Integration Tests
 * 
 * These tests verify that the API service layer is properly configured
 * and can communicate with the backend.
 * 
 * NOTE: These are integration tests that require the backend to be running.
 * Run with: npm test (when test infrastructure is set up)
 */

import api from '../api';

describe('API Service Integration Tests', () => {
  describe('API Configuration', () => {
    test('should have all API modules exported', () => {
      expect(api).toHaveProperty('auth');
      expect(api).toHaveProperty('user');
      expect(api).toHaveProperty('ride');
      expect(api).toHaveProperty('booking');
      expect(api).toHaveProperty('message');
      expect(api).toHaveProperty('review');
      expect(api).toHaveProperty('location');
    });

    test('auth API should have all required methods', () => {
      expect(api.auth).toHaveProperty('register');
      expect(api.auth).toHaveProperty('login');
      expect(api.auth).toHaveProperty('logout');
      expect(api.auth).toHaveProperty('getCurrentUser');
    });

    test('user API should have all required methods', () => {
      expect(api.user).toHaveProperty('getUser');
      expect(api.user).toHaveProperty('updateProfile');
      expect(api.user).toHaveProperty('getUserRides');
      expect(api.user).toHaveProperty('getUserBookings');
      expect(api.user).toHaveProperty('getUserReviews');
      expect(api.user).toHaveProperty('getRideHistory');
    });

    test('ride API should have all required methods', () => {
      expect(api.ride).toHaveProperty('createRide');
      expect(api.ride).toHaveProperty('getRides');
      expect(api.ride).toHaveProperty('getRide');
      expect(api.ride).toHaveProperty('updateRide');
      expect(api.ride).toHaveProperty('cancelRide');
      expect(api.ride).toHaveProperty('searchRides');
    });

    test('booking API should have all required methods', () => {
      expect(api.booking).toHaveProperty('createBooking');
      expect(api.booking).toHaveProperty('getBooking');
      expect(api.booking).toHaveProperty('cancelBooking');
      expect(api.booking).toHaveProperty('getRideBookings');
    });

    test('message API should have all required methods', () => {
      expect(api.message).toHaveProperty('sendMessage');
      expect(api.message).toHaveProperty('getConversation');
      expect(api.message).toHaveProperty('getRideMessages');
      expect(api.message).toHaveProperty('markAsRead');
    });

    test('review API should have all required methods', () => {
      expect(api.review).toHaveProperty('createReview');
      expect(api.review).toHaveProperty('getDriverReviews');
      expect(api.review).toHaveProperty('getRideReviews');
    });

    test('location API should have all required methods', () => {
      expect(api.location).toHaveProperty('startRide');
      expect(api.location).toHaveProperty('updateLocation');
      expect(api.location).toHaveProperty('stopRide');
      expect(api.location).toHaveProperty('getRideLocation');
    });
  });

  // The following tests require a running backend server
  // Uncomment and configure when ready to run integration tests

  /*
  describe('Authentication Flow', () => {
    let testUser;
    let authToken;

    test('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'TestPass123!',
        college: 'Test University',
        phone: '+1234567890',
        role: ['passenger']
      };

      const response = await api.auth.register(userData);
      
      expect(response).toHaveProperty('token');
      expect(response).toHaveProperty('user');
      expect(response.user.email).toBe(userData.email);
      
      testUser = response.user;
      authToken = response.token;
    });

    test('should login with valid credentials', async () => {
      const response = await api.auth.login(testUser.email, 'TestPass123!');
      
      expect(response).toHaveProperty('token');
      expect(response).toHaveProperty('user');
      expect(response.user.id).toBe(testUser.id);
    });

    test('should reject login with invalid credentials', async () => {
      await expect(
        api.auth.login(testUser.email, 'wrongpassword')
      ).rejects.toThrow();
    });
  });

  describe('Ride Management Flow', () => {
    let driverToken;
    let testRide;

    beforeAll(async () => {
      // Register a driver user
      const driverData = {
        name: 'Test Driver',
        email: `driver${Date.now()}@example.com`,
        password: 'DriverPass123!',
        college: 'Test University',
        phone: '+1234567890',
        role: ['driver'],
        vehicleMake: 'Toyota',
        vehicleModel: 'Camry',
        vehicleColor: 'Blue',
        licensePlate: 'ABC123'
      };

      const response = await api.auth.register(driverData);
      driverToken = response.token;
      
      // Set token for subsequent requests
      localStorage.setItem('token', driverToken);
    });

    test('should create a new ride', async () => {
      const rideData = {
        source: 'Campus Main Gate',
        destination: 'Downtown Mall',
        departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        availableSeats: 3
      };

      const response = await api.ride.createRide(rideData);
      
      expect(response).toHaveProperty('id');
      expect(response.source).toBe(rideData.source);
      expect(response.destination).toBe(rideData.destination);
      expect(response.availableSeats).toBe(rideData.availableSeats);
      
      testRide = response;
    });

    test('should get all available rides', async () => {
      const response = await api.ride.getRides();
      
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    });

    test('should filter rides by source', async () => {
      const response = await api.ride.getRides({ source: 'Campus Main Gate' });
      
      expect(Array.isArray(response)).toBe(true);
      response.forEach(ride => {
        expect(ride.source).toBe('Campus Main Gate');
      });
    });

    test('should get ride by ID', async () => {
      const response = await api.ride.getRide(testRide.id);
      
      expect(response.id).toBe(testRide.id);
      expect(response).toHaveProperty('driver');
    });
  });

  describe('Booking Flow', () => {
    let passengerToken;
    let testRide;
    let testBooking;

    beforeAll(async () => {
      // Create passenger and driver, create a ride
      // ... setup code
    });

    test('should create a booking', async () => {
      const response = await api.booking.createBooking({ rideId: testRide.id });
      
      expect(response).toHaveProperty('id');
      expect(response.rideId).toBe(testRide.id);
      expect(response.status).toBe('confirmed');
      
      testBooking = response;
    });

    test('should get booking by ID', async () => {
      const response = await api.booking.getBooking(testBooking.id);
      
      expect(response.id).toBe(testBooking.id);
    });

    test('should cancel booking', async () => {
      const response = await api.booking.cancelBooking(testBooking.id);
      
      expect(response).toHaveProperty('message');
    });
  });
  */
});

/**
 * Manual Testing Checklist
 * 
 * 1. Start backend server: cd backend && npm start
 * 2. Start frontend dev server: cd frontend && npm run dev
 * 3. Open browser to http://localhost:5173
 * 4. Open DevTools Console and Network tab
 * 5. Follow the E2E_TEST_GUIDE.md for comprehensive testing
 * 
 * Key things to verify:
 * - All API calls include Authorization header (when logged in)
 * - 401 errors trigger logout and redirect to login
 * - Network errors display user-friendly messages
 * - WebSocket connects after login
 * - Real-time updates work correctly
 */
