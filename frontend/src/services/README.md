# API Service Layer

This directory contains the centralized API service layer for the Campus Cruise frontend application.

## Overview

The API service layer provides a clean, organized interface for all backend API calls. It uses Axios with configured interceptors for authentication and error handling.

## Files

- **api.js** - Main API service with all endpoint functions organized by domain
- **apiVerification.js** - Development tools for verifying API setup
- **__tests__/api.integration.test.js** - Integration tests for API service

## Usage

### Importing the API Service

```javascript
import api from './services/api';

// Or import specific modules
import { authAPI, rideAPI, bookingAPI } from './services/api';
```

### Authentication

```javascript
// Register a new user
const response = await api.auth.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  college: 'Test University',
  phone: '+1234567890',
  role: ['passenger']
});

// Login
const { token, user } = await api.auth.login('john@example.com', 'SecurePass123!');

// Get current user
const currentUser = await api.auth.getCurrentUser();

// Logout
await api.auth.logout();
```

### Rides

```javascript
// Create a ride
const ride = await api.ride.createRide({
  source: 'Campus Main Gate',
  destination: 'Downtown Mall',
  departureTime: '2024-03-25T10:00:00Z',
  availableSeats: 3
});

// Get all available rides
const rides = await api.ride.getRides();

// Filter rides
const filteredRides = await api.ride.getRides({
  source: 'Campus Main Gate',
  destination: 'Downtown Mall',
  date: '2024-03-25'
});

// Get ride by ID
const rideDetails = await api.ride.getRide(rideId);

// Cancel ride
await api.ride.cancelRide(rideId);
```

### Bookings

```javascript
// Book a ride
const booking = await api.booking.createBooking({
  rideId: 'ride-id-here'
});

// Get booking details
const bookingDetails = await api.booking.getBooking(bookingId);

// Cancel booking
await api.booking.cancelBooking(bookingId);

// Get all bookings for a ride
const rideBookings = await api.booking.getRideBookings(rideId);
```

### Messages

```javascript
// Send a direct message
const message = await api.message.sendMessage({
  recipientId: 'user-id',
  content: 'Hello!'
});

// Send a group message
const groupMessage = await api.message.sendMessage({
  rideId: 'ride-id',
  content: 'See you all at 10am!'
});

// Get conversation with a user
const conversation = await api.message.getConversation(userId);

// Get group chat messages for a ride
const rideMessages = await api.message.getRideMessages(rideId);

// Mark message as read
await api.message.markAsRead(messageId);
```

### Reviews

```javascript
// Create a review
const review = await api.review.createReview({
  rideId: 'ride-id',
  driverId: 'driver-id',
  rating: 5,
  comment: 'Great driver!'
});

// Get driver reviews
const { reviews, averageRating } = await api.review.getDriverReviews(driverId);

// Get ride reviews
const rideReviews = await api.review.getRideReviews(rideId);
```

### User Profile

```javascript
// Get user profile
const user = await api.user.getUser(userId);

// Update profile
const updatedUser = await api.user.updateProfile(userId, {
  name: 'Updated Name',
  phone: '+9876543210'
});

// Get user's rides
const userRides = await api.user.getUserRides(userId);

// Get user's bookings
const userBookings = await api.user.getUserBookings(userId);

// Get ride history
const history = await api.user.getRideHistory(userId, {
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

### Location Tracking

```javascript
// Start ride and begin tracking
await api.location.startRide(rideId);

// Update location
await api.location.updateLocation(rideId, {
  latitude: 37.7749,
  longitude: -122.4194
});

// Stop tracking
await api.location.stopRide(rideId);

// Get current location
const location = await api.location.getRideLocation(rideId);
```

## Error Handling

All API calls automatically handle errors through the Axios response interceptor:

- **401 Unauthorized**: Automatically logs out user and redirects to login
- **403 Forbidden**: Logs error to console
- **404 Not Found**: Logs error to console
- **500+ Server Errors**: Logs error to console
- **Network Errors**: Logs error to console

You can also handle errors in your components:

```javascript
try {
  const rides = await api.ride.getRides();
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.message);
  } else if (error.request) {
    // No response received
    console.error('Network error');
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```

## Authentication

The API service automatically includes JWT tokens in all requests through the Axios request interceptor. The token is retrieved from localStorage.

When a user logs in:
1. Token is stored in localStorage
2. Subsequent API calls automatically include the token in the Authorization header
3. If token expires or is invalid, user is automatically logged out

## Development Tools

### API Verification

In development mode, verification tools are automatically loaded. Open the browser console and run:

```javascript
// Check API configuration
verifyAPI.setup();

// Test backend connectivity
await verifyAPI.connectivity();

// Run all checks
await verifyAPI.all();
```

### Manual Testing

Follow the comprehensive testing guide in `frontend/E2E_TEST_GUIDE.md` for step-by-step instructions on testing all user flows.

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

### Axios Configuration

The Axios instance is configured in `src/utils/axios.js`:

- Base URL from environment variable or default to `http://localhost:5000`
- Content-Type header set to `application/json`
- Request interceptor adds JWT token from localStorage
- Response interceptor handles errors globally

## Best Practices

1. **Always use the API service** - Don't make direct axios calls in components
2. **Handle errors gracefully** - Use try-catch blocks in components
3. **Show loading states** - Display loading indicators during API calls
4. **Validate input** - Validate data before sending to API
5. **Use TypeScript** - Consider adding TypeScript for better type safety (future enhancement)

## Testing

### Unit Tests

Run unit tests for API configuration:

```bash
npm test
```

### Integration Tests

Integration tests require the backend to be running. Uncomment the test cases in `__tests__/api.integration.test.js` and run:

```bash
npm test
```

### Manual Testing

Follow the E2E testing guide for comprehensive manual testing:

```bash
# See frontend/E2E_TEST_GUIDE.md
```

## Troubleshooting

### "Network Error" or "Cannot reach backend"

1. Ensure backend server is running: `cd backend && npm start`
2. Check backend is accessible at `http://localhost:5000`
3. Verify CORS is configured correctly in backend
4. Check `.env` file has correct `VITE_API_BASE_URL`

### "401 Unauthorized" errors

1. Check if user is logged in
2. Verify token exists in localStorage
3. Check token hasn't expired
4. Try logging out and logging back in

### "403 Forbidden" errors

1. Check user has correct role/permissions
2. Verify endpoint requires specific role (e.g., driver-only)
3. Check backend authorization middleware

### API calls not including token

1. Verify token is stored in localStorage: `localStorage.getItem('token')`
2. Check Axios request interceptor is configured
3. Ensure `src/utils/axios.js` is imported in `main.jsx`

## Future Enhancements

- [ ] Add TypeScript types for all API functions
- [ ] Implement request caching for frequently accessed data
- [ ] Add retry logic for failed requests
- [ ] Implement request cancellation for unmounted components
- [ ] Add request/response logging in development mode
- [ ] Create mock API service for testing without backend
- [ ] Add API rate limiting handling
- [ ] Implement optimistic updates for better UX

## Contributing

When adding new API endpoints:

1. Add the function to the appropriate API module in `api.js`
2. Follow the existing naming conventions
3. Add JSDoc comments for documentation
4. Update this README with usage examples
5. Add tests to `__tests__/api.integration.test.js`
6. Update E2E test guide if needed

## Related Documentation

- [E2E Testing Guide](../../E2E_TEST_GUIDE.md)
- [Backend API Documentation](../../../backend/README.md)
- [Axios Documentation](https://axios-http.com/)
