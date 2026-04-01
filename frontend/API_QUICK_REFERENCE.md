# API Quick Reference Card

Quick reference for using the Campus Cruise API service layer.

## Import

```javascript
import api from './services/api';
```

## Authentication

```javascript
// Register
await api.auth.register({ name, email, password, college, phone, role });

// Login
const { token, user } = await api.auth.login(email, password);

// Logout
await api.auth.logout();

// Get current user
const user = await api.auth.getCurrentUser();
```

## Rides

```javascript
// Create
await api.ride.createRide({ source, destination, departureTime, availableSeats });

// List all
const rides = await api.ride.getRides();

// Filter
const rides = await api.ride.getRides({ source, destination, date });

// Get one
const ride = await api.ride.getRide(rideId);

// Cancel
await api.ride.cancelRide(rideId);
```

## Bookings

```javascript
// Create
await api.booking.createBooking({ rideId });

// Get one
const booking = await api.booking.getBooking(bookingId);

// Cancel
await api.booking.cancelBooking(bookingId);

// Get all for ride
const bookings = await api.booking.getRideBookings(rideId);
```

## Messages

```javascript
// Send direct message
await api.message.sendMessage({ recipientId, content });

// Send group message
await api.message.sendMessage({ rideId, content });

// Get conversation
const messages = await api.message.getConversation(userId);

// Get ride messages
const messages = await api.message.getRideMessages(rideId);

// Mark as read
await api.message.markAsRead(messageId);
```

## Reviews

```javascript
// Create
await api.review.createReview({ rideId, driverId, rating, comment });

// Get driver reviews
const { reviews, averageRating } = await api.review.getDriverReviews(driverId);

// Get ride reviews
const reviews = await api.review.getRideReviews(rideId);
```

## User Profile

```javascript
// Get user
const user = await api.user.getUser(userId);

// Update profile
await api.user.updateProfile(userId, { name, phone, vehicleInfo });

// Get user's rides
const rides = await api.user.getUserRides(userId);

// Get user's bookings
const bookings = await api.user.getUserBookings(userId);

// Get ride history
const history = await api.user.getRideHistory(userId, { startDate, endDate });
```

## Location

```javascript
// Start tracking
await api.location.startRide(rideId);

// Update location
await api.location.updateLocation(rideId, { latitude, longitude });

// Stop tracking
await api.location.stopRide(rideId);

// Get current location
const location = await api.location.getRideLocation(rideId);
```

## Error Handling

```javascript
try {
  const result = await api.ride.getRides();
  // Success
} catch (error) {
  if (error.response) {
    // Server error
    console.error(error.response.data.message);
  } else if (error.request) {
    // Network error
    console.error('Network error');
  } else {
    // Other error
    console.error(error.message);
  }
}
```

## WebSocket (via useWebSocket hook)

```javascript
import { useWebSocket } from './context/WebSocketContext';

const { socket, connected, emit, on, off } = useWebSocket();

// Emit event
emit('join_ride', { rideId });

// Listen to event
useEffect(() => {
  const handler = (data) => console.log(data);
  on('ride_updated', handler);
  return () => off('ride_updated', handler);
}, [on, off]);
```

## Development Tools

```javascript
// In browser console:

// Check API setup
verifyAPI.setup()

// Test connectivity
await verifyAPI.connectivity()

// Run all checks
await verifyAPI.all()
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

## Common Patterns

### Loading State
```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await api.ride.getRides();
    // Handle data
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
};
```

### With useEffect
```javascript
useEffect(() => {
  const fetchRides = async () => {
    try {
      const rides = await api.ride.getRides();
      setRides(rides);
    } catch (error) {
      console.error(error);
    }
  };
  fetchRides();
}, []);
```

### Form Submission
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await api.ride.createRide(formData);
    // Success - redirect or show message
  } catch (error) {
    // Show error message
  }
};
```

## HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (auto logout)
- **403** - Forbidden (no permission)
- **404** - Not Found
- **500** - Server Error

## Tips

- Always use try-catch for API calls
- Show loading states during async operations
- Display user-friendly error messages
- JWT token is automatically included
- WebSocket connects automatically on login
- Check browser console for errors
- Use DevTools Network tab to debug API calls

## Documentation

- Full API docs: `frontend/src/services/README.md`
- E2E testing: `frontend/E2E_TEST_GUIDE.md`
- Implementation: `frontend/IMPLEMENTATION_SUMMARY.md`
