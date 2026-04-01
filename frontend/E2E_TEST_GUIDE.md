# End-to-End Testing Guide for Campus Cruise

This document provides a comprehensive guide for manually testing all user flows in the Campus Cruise application.

## Prerequisites

1. Backend server running on `http://localhost:5000`
2. Frontend development server running on `http://localhost:5173` (or configured port)
3. MySQL database properly configured and migrated
4. Firebase configured for real-time features

## Test Environment Setup

```bash
# Terminal 1 - Start Backend
cd backend
npm start

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

---

## Test Flow 1: Registration and Login

### 1.1 User Registration

**Steps:**
1. Navigate to `/signup`
2. Fill in the registration form:
   - Name: "Test User"
   - Email: "testuser@college.edu"
   - Password: "SecurePass123!"
   - College: "Test University"
   - Phone: "+1234567890"
   - Role: Select "Passenger" or "Driver" or both
   - If Driver selected, fill vehicle info:
     - Make: "Toyota"
     - Model: "Camry"
     - Color: "Blue"
     - License Plate: "ABC123"
3. Click "Sign Up"

**Expected Results:**
- ✅ User account created successfully
- ✅ JWT token stored in localStorage
- ✅ Redirected to dashboard
- ✅ Welcome email sent (check email or backend logs)
- ✅ User data displayed in navbar

**API Validation:**
- Check Network tab: `POST /api/auth/register` returns 201 with token
- Check localStorage: `token` and `user` keys present

---

### 1.2 User Login

**Steps:**
1. Logout if logged in
2. Navigate to `/login`
3. Enter credentials:
   - Email: "testuser@college.edu"
   - Password: "SecurePass123!"
4. Click "Login"

**Expected Results:**
- ✅ Authentication successful
- ✅ JWT token stored in localStorage
- ✅ Redirected to dashboard
- ✅ User online status updated
- ✅ WebSocket connection established

**API Validation:**
- Check Network tab: `POST /api/auth/login` returns 200 with token
- Check Console: "WebSocket connected" message
- Check Console: "WebSocket authenticated" message

---

### 1.3 Invalid Login Attempt

**Steps:**
1. Navigate to `/login`
2. Enter invalid credentials:
   - Email: "wrong@email.com"
   - Password: "wrongpassword"
3. Click "Login"

**Expected Results:**
- ✅ Error message displayed
- ✅ User remains on login page
- ✅ No token stored

**API Validation:**
- Check Network tab: `POST /api/auth/login` returns 401

---

## Test Flow 2: Ride Creation and Search

### 2.1 Create a Ride (Driver)

**Prerequisites:** Logged in as a user with "Driver" role

**Steps:**
1. Navigate to `/rides/create`
2. Fill in ride details:
   - Source: "Campus Main Gate"
   - Destination: "Downtown Mall"
   - Departure Time: Select a future date/time
   - Available Seats: 3
3. Click "Create Ride"

**Expected Results:**
- ✅ Ride created successfully
- ✅ Success notification displayed
- ✅ Redirected to ride details page
- ✅ WebSocket broadcasts new ride to all connected users
- ✅ Ride appears in available rides list

**API Validation:**
- Check Network tab: `POST /api/rides` returns 201
- Check WebSocket: `ride_created` event received by other users

---

### 2.2 Search Available Rides

**Steps:**
1. Navigate to `/rides`
2. View all available rides (no filters)
3. Apply filters:
   - Source: "Campus Main Gate"
   - Destination: "Downtown Mall"
   - Date: Select today's date
4. Click "Search" or filters auto-apply

**Expected Results:**
- ✅ Only rides matching filters displayed
- ✅ Each ride shows: driver info, route, time, available seats
- ✅ Only rides with future departure times shown
- ✅ Only rides with available seats > 0 shown

**API Validation:**
- Check Network tab: `GET /api/rides?source=...&destination=...` returns filtered results

---

### 2.3 View Ride Details

**Steps:**
1. From available rides list, click on a ride card
2. View ride details page

**Expected Results:**
- ✅ Full ride information displayed
- ✅ Driver profile information shown
- ✅ Route details visible
- ✅ Available seats count accurate
- ✅ "Book Ride" button visible (if passenger)
- ✅ "Cancel Ride" button visible (if driver/owner)

**API Validation:**
- Check Network tab: `GET /api/rides/:id` returns ride with driver info

---

## Test Flow 3: Booking and Cancellation

### 3.1 Book a Ride (Passenger)

**Prerequisites:** Logged in as a passenger, viewing a ride with available seats

**Steps:**
1. On ride details page, click "Book Ride"
2. Confirm booking in modal/dialog

**Expected Results:**
- ✅ Booking created successfully
- ✅ Available seats decremented by 1
- ✅ Success notification displayed
- ✅ Driver receives notification (WebSocket)
- ✅ Driver receives email notification
- ✅ Passenger receives confirmation notification
- ✅ Booking appears in user's bookings list
- ✅ Real-time update broadcast to all users viewing the ride

**API Validation:**
- Check Network tab: `POST /api/bookings` returns 201
- Check WebSocket: `booking_created` event received by driver
- Check WebSocket: `ride_updated` event broadcast

---

### 3.2 Cancel Booking (Passenger)

**Prerequisites:** User has an active booking

**Steps:**
1. Navigate to "My Bookings" or ride details
2. Click "Cancel Booking"
3. Confirm cancellation

**Expected Results:**
- ✅ Booking cancelled successfully
- ✅ Available seats incremented by 1
- ✅ Cancellation notification displayed
- ✅ Driver receives cancellation notification
- ✅ If within 2 hours of departure, marked as late cancellation
- ✅ Real-time update broadcast to all users

**API Validation:**
- Check Network tab: `DELETE /api/bookings/:id` returns 200
- Check WebSocket: `booking_cancelled` event received by driver
- Check response: `isLateCancellation` flag if applicable

---

### 3.3 Cancel Ride (Driver)

**Prerequisites:** Logged in as driver with an active ride

**Steps:**
1. Navigate to ride details (own ride)
2. Click "Cancel Ride"
3. Confirm cancellation

**Expected Results:**
- ✅ Ride cancelled successfully
- ✅ Ride status changed to "cancelled"
- ✅ All passengers notified via WebSocket
- ✅ All passengers receive email notifications
- ✅ Ride no longer appears in available rides
- ✅ New bookings prevented

**API Validation:**
- Check Network tab: `DELETE /api/rides/:id` returns 200
- Check WebSocket: `ride_cancelled` event received by all passengers

---

### 3.4 Attempt to Book Full Ride

**Prerequisites:** Ride with 0 available seats

**Steps:**
1. Navigate to a ride with 0 available seats
2. Attempt to book

**Expected Results:**
- ✅ Booking button disabled or error message shown
- ✅ Error notification: "No seats available"
- ✅ Booking not created

**API Validation:**
- Check Network tab: `POST /api/bookings` returns 400 error

---

## Test Flow 4: Messaging and Notifications

### 4.1 Direct Messaging

**Prerequisites:** Two users logged in (use two browsers/incognito)

**Steps:**
1. User A: Navigate to `/messages`
2. User A: Select User B from conversation list or start new conversation
3. User A: Type and send a message
4. User B: Check messages page

**Expected Results:**
- ✅ Message sent successfully
- ✅ Message appears in User A's chat window immediately
- ✅ User B receives message in real-time (if online)
- ✅ Message stored in database
- ✅ Message stored in Firebase
- ✅ Unread count updates for User B
- ✅ Notification shown to User B (if not on messages page)

**API Validation:**
- Check Network tab: `POST /api/messages` returns 201
- Check WebSocket: `message_received` event received by User B

---

### 4.2 Typing Indicators

**Prerequisites:** Two users in a conversation

**Steps:**
1. User A: Start typing in message input
2. User B: Observe chat window

**Expected Results:**
- ✅ "User A is typing..." indicator appears for User B
- ✅ Indicator disappears when User A stops typing
- ✅ Indicator disappears when User A sends message

**WebSocket Validation:**
- Check Console: `typing_start` and `typing_stop` events

---

### 4.3 Group Chat (Ride with Multiple Passengers)

**Prerequisites:** Ride with 2+ confirmed bookings

**Steps:**
1. Driver or any passenger: Navigate to ride details
2. Click "Group Chat" or messages tab
3. Send a message in group chat
4. Check that all participants receive the message

**Expected Results:**
- ✅ Group chat created automatically
- ✅ All participants (driver + passengers) in group
- ✅ Message broadcast to all members
- ✅ Sender name and timestamp included
- ✅ All participants see the message in real-time

**API Validation:**
- Check Network tab: `GET /api/messages/ride/:id` returns group messages
- Check WebSocket: `message_received` event broadcast to all members

---

### 4.4 Read Receipts

**Steps:**
1. User A sends message to User B
2. User B opens conversation
3. User A checks conversation

**Expected Results:**
- ✅ Messages marked as read when User B opens conversation
- ✅ Read status visible to User A
- ✅ Unread count decreases for User B

**API Validation:**
- Check Network tab: `PUT /api/messages/:id/read` called when opening conversation

---

### 4.5 Real-time Notifications

**Prerequisites:** User logged in, WebSocket connected

**Test Scenarios:**

**Booking Notification (Driver):**
- Another user books your ride
- ✅ Notification bell shows new notification
- ✅ Toast notification appears
- ✅ Notification includes passenger name

**Cancellation Notification (Driver):**
- Passenger cancels booking
- ✅ Notification received
- ✅ Toast shows cancellation message

**Ride Cancelled Notification (Passenger):**
- Driver cancels ride
- ✅ Notification received
- ✅ Error toast displayed
- ✅ Email sent

**Full Capacity Notification (Driver):**
- Last available seat is booked
- ✅ "Ride is full" notification received
- ✅ Success toast displayed

---

## Test Flow 5: Profile Updates

### 5.1 View Profile

**Steps:**
1. Navigate to `/profile` or click profile in navbar
2. View profile information

**Expected Results:**
- ✅ All profile fields displayed: name, email, college, phone, role
- ✅ Vehicle information displayed (if driver)
- ✅ Average rating displayed (if driver with reviews)

**API Validation:**
- Check Network tab: `GET /api/users/:id` returns user data

---

### 5.2 Update Profile

**Steps:**
1. On profile page, click "Edit Profile"
2. Update fields:
   - Name: "Updated Name"
   - Phone: "+9876543210"
   - If driver, update vehicle info
3. Click "Save Changes"

**Expected Results:**
- ✅ Profile updated successfully
- ✅ Success notification displayed
- ✅ Updated data displayed immediately
- ✅ Changes persisted (refresh page to verify)

**API Validation:**
- Check Network tab: `PUT /api/users/:id` returns 200 with updated data
- Check localStorage: `user` object updated

---

### 5.3 View Ride History

**Steps:**
1. Navigate to `/history` or "My Rides" section
2. View ride history
3. Apply date filter (optional)

**Expected Results:**
- ✅ All past rides displayed (as driver or passenger)
- ✅ Rides ordered by date (most recent first)
- ✅ Each ride shows: date, route, participants, status
- ✅ Cancelled rides show cancellation status
- ✅ Date filter works correctly

**API Validation:**
- Check Network tab: `GET /api/users/:id/history` returns ride history
- With filters: `GET /api/users/:id/history?startDate=...&endDate=...`

---

## Test Flow 6: Reviews and Ratings

### 6.1 Submit Review

**Prerequisites:** Completed ride as passenger

**Steps:**
1. Navigate to ride history
2. Find completed ride
3. Click "Leave Review"
4. Fill review form:
   - Rating: Select 1-5 stars
   - Comment: "Great driver, smooth ride!"
5. Submit review

**Expected Results:**
- ✅ Review submitted successfully
- ✅ Success notification displayed
- ✅ Review associated with ride and driver
- ✅ Cannot submit duplicate review for same ride

**API Validation:**
- Check Network tab: `POST /api/reviews` returns 201
- Duplicate attempt: returns 400 error

---

### 6.2 View Driver Ratings

**Steps:**
1. View driver profile or ride details
2. Check driver rating section

**Expected Results:**
- ✅ Average rating displayed (1-5 stars)
- ✅ Number of reviews shown
- ✅ Individual reviews listed
- ✅ Each review shows: rating, comment, date, reviewer name

**API Validation:**
- Check Network tab: `GET /api/reviews/driver/:id` returns reviews and average

---

## Test Flow 7: Location Tracking (Real-time)

### 7.1 Start Ride and Track Location

**Prerequisites:** Driver with active ride, location permissions granted

**Steps:**
1. Driver: Navigate to active ride
2. Driver: Click "Start Ride"
3. Driver: Allow location access
4. Passenger: View ride details on map

**Expected Results:**
- ✅ Location tracking initiated
- ✅ Driver location stored in Firebase
- ✅ Driver location updates every ≤10 seconds
- ✅ Passenger sees driver location on map in real-time
- ✅ Location updates broadcast via WebSocket

**API Validation:**
- Check Network tab: `POST /api/location/start/:id` returns 200
- Check WebSocket: `location_update` events received by passengers
- Check Firebase: Location data stored at `/rides/:id/location`

---

### 7.2 Stop Location Tracking

**Steps:**
1. Driver: Click "Complete Ride" or "Stop Tracking"

**Expected Results:**
- ✅ Location tracking stopped
- ✅ No more location updates sent
- ✅ Ride status updated to "completed"

**API Validation:**
- Check Network tab: `POST /api/location/stop/:id` returns 200

---

## Test Flow 8: Error Handling and Edge Cases

### 8.1 Network Error Handling

**Steps:**
1. Disconnect from network
2. Attempt any API operation
3. Reconnect network

**Expected Results:**
- ✅ Error message displayed: "Network error"
- ✅ User not redirected
- ✅ Operation can be retried after reconnection

---

### 8.2 Unauthorized Access

**Steps:**
1. Logout
2. Manually navigate to `/rides/create` (protected route)

**Expected Results:**
- ✅ Redirected to login page
- ✅ After login, redirected back to intended page (optional)

---

### 8.3 Token Expiration

**Steps:**
1. Login
2. Wait for token to expire (or manually expire in backend)
3. Attempt any API operation

**Expected Results:**
- ✅ 401 error received
- ✅ User logged out automatically
- ✅ Redirected to login page
- ✅ Token and user data cleared from localStorage

---

### 8.4 WebSocket Reconnection

**Steps:**
1. Login (WebSocket connects)
2. Stop backend server
3. Restart backend server
4. Wait for automatic reconnection

**Expected Results:**
- ✅ "WebSocket disconnected" logged
- ✅ Automatic reconnection attempts
- ✅ "WebSocket connected" after server restart
- ✅ Connection re-authenticated
- ✅ Real-time features resume working

**Console Validation:**
- Check Console: Reconnection attempts logged
- Check Console: "WebSocket connected" after successful reconnection

---

### 8.5 Validation Errors

**Test various validation scenarios:**

**Invalid Email Format:**
- Enter "notanemail" in email field
- ✅ Validation error displayed

**Past Departure Time:**
- Try to create ride with past time
- ✅ Error: "Departure time must be in the future"

**Invalid Seat Count:**
- Try to create ride with 0 or negative seats
- ✅ Error: "Seats must be positive"

**Duplicate Email Registration:**
- Try to register with existing email
- ✅ Error: "Email already exists"

---

## Test Flow 9: Responsive Design

### 9.1 Mobile View

**Steps:**
1. Open DevTools
2. Toggle device toolbar (mobile view)
3. Test all pages at various screen sizes:
   - 320px (small mobile)
   - 375px (iPhone)
   - 768px (tablet)
   - 1024px (desktop)

**Expected Results:**
- ✅ All pages responsive and usable
- ✅ Navigation adapts (hamburger menu on mobile)
- ✅ Forms optimized for mobile keyboards
- ✅ Touch targets appropriately sized
- ✅ No horizontal scrolling
- ✅ Text readable without zooming

---

## Test Flow 10: Online/Offline Status

### 10.1 User Status Updates

**Prerequisites:** Two users logged in

**Steps:**
1. User A: Login (WebSocket connects)
2. User B: View User A's profile or chat
3. User A: Logout or close browser
4. User B: Observe status change

**Expected Results:**
- ✅ User A shows "online" when connected
- ✅ User A shows "offline" after 30-second grace period
- ✅ Status updates broadcast to relevant users
- ✅ Online indicator visible in chat and user lists

**WebSocket Validation:**
- Check Console: `user_status` events received

---

## Automated Test Checklist

For each test flow, verify:

- [ ] API endpoints return correct status codes
- [ ] Response data matches expected schema
- [ ] JWT token included in protected requests
- [ ] WebSocket events sent and received correctly
- [ ] UI updates reflect data changes
- [ ] Error messages are user-friendly
- [ ] Loading states displayed during async operations
- [ ] Success/error notifications shown appropriately
- [ ] Data persists after page refresh
- [ ] Browser console has no errors

---

## Performance Checks

- [ ] Initial page load < 3 seconds
- [ ] API responses < 500ms (local)
- [ ] WebSocket connection established < 1 second
- [ ] Location updates every ≤10 seconds
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] Smooth scrolling and animations

---

## Security Checks

- [ ] Passwords not visible in network requests
- [ ] JWT tokens not exposed in console logs
- [ ] Protected routes require authentication
- [ ] Role-based access control enforced
- [ ] XSS prevention (input sanitization)
- [ ] SQL injection prevention (parameterized queries)

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Notes

- Keep browser DevTools open during testing
- Monitor Network tab for API calls
- Monitor Console for WebSocket events and errors
- Check Application tab for localStorage data
- Use React DevTools to inspect component state

---

## Reporting Issues

When reporting issues, include:
1. Test flow and step number
2. Expected vs actual behavior
3. Browser and version
4. Console errors (if any)
5. Network request/response (if relevant)
6. Screenshots or screen recording

---

## Success Criteria

All test flows should pass with:
- ✅ No console errors
- ✅ All API calls successful
- ✅ All WebSocket events working
- ✅ UI responsive and functional
- ✅ Data persistence working
- ✅ Real-time features operational
