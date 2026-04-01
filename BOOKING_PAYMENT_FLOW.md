# Booking & Payment Flow - Updated Implementation

## Updated Flow (Fixed)

### Step 1: Booking Creation
- User clicks "Book Ride"
- System checks for existing pending booking for the SAME ride
  - If found: Auto-cancels old pending booking and releases seat
  - Allows user to rebook immediately
- System checks for unpaid bookings for OTHER rides
  - If found: Blocks booking and shows error with details
- Booking created with status: `pending` (not confirmed yet!)
- Seat is reserved (availableSeats decremented)
- Response includes: `requiresPayment: true`
- User has 15 minutes to complete payment

### Step 2: Payment Redirect
- User sees "Seat Reserved!" message
- Automatically redirected to payment page after 0.8 seconds
- Payment page shows ride details and payment options

### Step 3: Payment Processing
- User completes payment
- Payment status: `held` (escrow)
- Funds deducted from wallet
- Booking status updated to: `confirmed`
- Cashback and rewards calculated

### Step 4: Ride Completion
- Driver marks ride as complete
- Payment status: `completed`
- Funds released to driver
- Passenger receives cashback and reward points

## Important Changes

1. **Booking Status Flow**
   - Initial: `pending` (seat reserved but not confirmed)
   - After payment: `confirmed` (booking confirmed)
   - If cancelled: `cancelled`

2. **Payment is Required to Confirm**
   - Booking starts as `pending`
   - Only becomes `confirmed` after payment
   - User CAN rebook the same ride (auto-cancels old pending booking)
   - User CANNOT book different rides if they have unpaid bookings

3. **Auto-Cancellation**
   - Unpaid bookings are auto-cancelled after 15 minutes
   - Seat is released back to available pool
   - Cleanup runs every 5 minutes via scheduler

4. **Duplicate Booking Prevention**
   - Users cannot have multiple confirmed bookings for the same ride
   - Pending bookings for the SAME ride are auto-cancelled on rebooking
   - Users must complete payment before booking DIFFERENT rides
   - Smart handling: Can retry payment for same ride, but blocked for new rides

## Potential Issues - FIXED

### ✅ Issue: User can book without paying
**Previous Behavior:**
- User books ride → Booking confirmed immediately
- User closes browser before payment
- Booking exists but no payment

**Fixed Behavior:**
- User books ride → Booking pending
- User must pay within 15 minutes
- If user closes payment page and tries to rebook SAME ride:
  - Old pending booking auto-cancelled
  - Seat released and immediately re-reserved
  - User can try payment again
- If user tries to book DIFFERENT ride:
  - Blocked with error message
  - Must complete payment for existing booking first
- If no payment after 15 minutes:
  - Booking auto-cancelled by scheduler
  - Seat released back to available pool

## Current Implementation

### Booking States
1. `pending` - Seat reserved, awaiting payment (15 min timeout)
2. `confirmed` - Payment completed, booking confirmed
3. `cancelled` - Booking cancelled (manual or auto)

### Payment Enforcement
- ✅ Booking starts as `pending`
- ✅ Payment required to confirm
- ✅ Auto-cancel after 15 minutes
- ✅ Block new bookings if unpaid exists
- ✅ Seat released on cancellation

### Scheduler
- Runs every 5 minutes
- Checks for bookings older than 15 minutes
- Auto-cancels unpaid bookings
- Releases seats back to rides

## Migration Required

Run this migration to add `pending` status:
```bash
cd backend
npx sequelize-cli db:migrate
```

## API Changes

### Create Booking Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Seat reserved. Please complete payment within 15 minutes to confirm your booking.",
  "requiresPayment": true,
  "paymentUrl": "/payment/:bookingId"
}
```

### Booking Status Check
- Frontend should check booking status
- Show "Complete Payment" for `pending` bookings
- Show "Confirmed" for `confirmed` bookings

## Frontend Updates Needed

1. **MyRidesPage**
   - Show payment status indicator
   - Display "Complete Payment" button for pending bookings
   - Show countdown timer (15 min remaining)

2. **BookingFlow**
   - Update success message
   - Show payment urgency (15 min deadline)

3. **Validation**
   - Handle error: "Please complete payment for your existing booking"
   - Redirect to payment page for unpaid booking

## Testing

### Test Unpaid Booking Auto-Cancel
1. Create a booking
2. Don't complete payment
3. Wait 15 minutes (or modify timeout for testing)
4. Verify booking is auto-cancelled
5. Verify seat is released

### Test Duplicate Booking Prevention
1. Create a booking (pending)
2. Try to create another booking
3. Should receive error message
4. Complete payment for first booking
5. Now can create new bookings

## Current Status

✅ **Fixed:**
- Bookings start as `pending`
- Payment required to confirm
- Auto-cancellation of unpaid bookings
- Duplicate booking prevention
- Seat management on cancellation

✅ **Working:**
- Payment processing with escrow
- Automatic refunds on cancellation
- Reward points and cashback
- Scheduler for cleanup

## Next Steps

1. ✅ Run migration to add `pending` status
2. Update frontend to show payment status
3. Add countdown timer for payment deadline
4. Test auto-cancellation flow
5. Update user notifications for auto-cancellation
