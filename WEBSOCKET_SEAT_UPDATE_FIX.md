# WebSocket Seat Update Fix

## Problem
After canceling payment and returning to the ride details page, the seat count wasn't updating in real-time. The backend was broadcasting seat changes via WebSocket, but the frontend wasn't listening for these events.

## Root Cause
The frontend pages were missing WebSocket event listeners for `seat_update` events. While the backend was correctly broadcasting seat changes when:
- A booking is created
- A booking is cancelled
- A pending booking is auto-cancelled

The frontend wasn't receiving or processing these updates.

## Solution

### Backend (Already Working)
The backend correctly broadcasts seat updates via WebSocket in:
- `backend/src/socket/rideEvents.js` - `broadcastSeatChange()` function
- Called from:
  - `booking.controller.js` - When creating bookings
  - `booking.controller.js` - When cancelling bookings
  - `booking.controller.js` - When auto-cancelling pending bookings

### Frontend Changes

#### 1. RideDetailsPage.jsx
Added WebSocket listener for `seat_change` events:

```javascript
const handleSeatChange = (data) => {
  if (data.rideId === id) {
    console.log('Seat change received:', data);
    setRide(prevRide => ({
      ...prevRide,
      availableSeats: data.availableSeats
    }));
  }
};

on('seat_change', handleSeatChange);
```

#### 2. AvailableRidesPage.jsx
Added WebSocket listener to update the rides list:

```javascript
const handleSeatChange = (data) => {
  console.log('Seat change received in AvailableRidesPage:', data);
  setRides(prevRides => 
    prevRides.map(ride => 
      ride.id === data.rideId 
        ? { ...ride, availableSeats: data.availableSeats }
        : ride
    )
  );
};

on('seat_change', handleSeatChange);
```

## WebSocket Event Format

### seat_change Event
```javascript
{
  rideId: "uuid",
  availableSeats: 3,
  timestamp: "2024-03-29T..."
}
```

This event is broadcast to all connected clients when:
1. A new booking is created (seats decrease)
2. A booking is cancelled (seats increase)
3. A pending booking is auto-cancelled on rebooking (seats increase then decrease)

## Testing

### Test Scenario 1: Real-time Seat Updates
1. Open ride details page in two browser windows
2. Book the ride in window 1
3. Window 2 should immediately show decreased available seats
4. Cancel the booking in window 1
5. Window 2 should immediately show increased available seats

### Test Scenario 2: Auto-cancel and Rebook
1. User A books a ride (seat count: 3 → 2)
2. User A closes payment page
3. User A tries to book again
4. Old pending booking auto-cancelled (seat count: 2 → 3)
5. New booking created (seat count: 3 → 2)
6. All connected clients see the updates in real-time

### Test Scenario 3: Available Rides List
1. Open available rides page
2. Another user books a ride
3. The rides list should update the seat count immediately
4. No page refresh needed

## Files Modified

### Frontend
1. `frontend/src/pages/RideDetailsPage.jsx`
   - Added `useWebSocket` import
   - Added `handleSeatChange` function
   - Registered `seat_change` event listener (not `seat_update`)
   - Updates ride state when seat count changes

2. `frontend/src/pages/AvailableRidesPage.jsx`
   - Added `useWebSocket` import
   - Added `handleSeatChange` function
   - Registered `seat_change` event listener (not `seat_update`)
   - Updates rides array when any ride's seat count changes

## Benefits

1. ✅ Real-time seat availability updates
2. ✅ No page refresh needed
3. ✅ Multiple users see consistent data
4. ✅ Immediate feedback when bookings are created/cancelled
5. ✅ Better user experience with live updates

## How It Works

```
User Action (Book/Cancel)
        ↓
Backend Controller
        ↓
Database Update
        ↓
broadcastSeatChange(io, rideId, availableSeats)
        ↓
WebSocket Broadcast to All Clients
        ↓
Frontend Listeners (RideDetailsPage, AvailableRidesPage)
        ↓
State Update
        ↓
UI Re-renders with New Seat Count
```

## Additional Notes

- The WebSocket connection is managed by `WebSocketContext`
- The `on()` and `off()` functions handle event subscription/unsubscription
- Cleanup is handled in the `useEffect` return function to prevent memory leaks
- Console logs added for debugging (can be removed in production)

## Future Enhancements

Consider adding WebSocket listeners for:
- `booking_created` - Show notification when someone books
- `booking_cancelled` - Show notification when someone cancels
- `ride_full` - Show alert when ride becomes full
- `ride_available` - Show alert when seats become available again
