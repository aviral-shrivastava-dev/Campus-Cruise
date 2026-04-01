# Advanced Payment System - Campus Cruise

## Overview

An advanced, creative payment system with virtual wallets, ride credits, split payments, rewards, and escrow functionality - all without third-party integration.

## Features

### 1. Virtual Wallet System
- **Balance Management**: Users can add funds, track spending, and view earnings
- **Automatic Wallet Creation**: Wallets are created automatically for new users
- **Transaction History**: Complete audit trail of all financial activities
- **Wallet Locking**: Security feature to freeze suspicious accounts

### 2. Ride Credits System
- **Purchase Credits**: Buy credits at $0.10 per credit
- **Use for Rides**: Apply credits to reduce ride costs
- **Bulk Discounts**: Encourage bulk purchases for better value
- **Credit Tracking**: Monitor credit balance and usage

### 3. Reward Points Program
- **Earn Points**: Get 10 points per dollar spent on rides
- **Redeem Points**: Convert points to cash ($0.01 per point)
- **Automatic Accrual**: Points added automatically after each ride
- **Loyalty Incentive**: Encourages repeat usage

### 4. Cashback System
- **5% Cashback**: Earn 5% back on every ride payment
- **Automatic Credit**: Cashback added after ride completion
- **Transparent Tracking**: View cashback earnings in transaction history

### 5. Split Payment Feature
- **Group Payments**: Split ride costs among multiple passengers
- **Flexible Participation**: Select who participates in the split
- **Equal Division**: Automatically calculates per-person amount
- **Payment Tracking**: Monitor who has paid their share
- **Status Updates**: Real-time updates on split payment progress

### 6. Escrow System
- **Secure Holding**: Payments held until ride completion
- **Passenger Protection**: Funds returned if ride is cancelled
- **Driver Guarantee**: Payment released after successful ride
- **Dispute Resolution**: Funds held during dispute investigation

### 7. Payment Methods
- **Wallet Balance**: Pay directly from wallet
- **Ride Credits**: Use accumulated credits
- **Mixed Payment**: Combine wallet + credits
- **Split Payment**: Share costs with other passengers

## Database Schema

### Wallets Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key → users)
- balance (DECIMAL 10,2)
- credits (INTEGER)
- rewardPoints (INTEGER)
- totalEarnings (DECIMAL 10,2)
- totalSpent (DECIMAL 10,2)
- isLocked (BOOLEAN)
```

### Transactions Table
```sql
- id (UUID, Primary Key)
- walletId (UUID, Foreign Key → wallets)
- type (ENUM: deposit, withdrawal, ride_payment, ride_earning, refund, 
        credit_purchase, credit_usage, reward_redemption, cashback, 
        split_payment, escrow_hold, escrow_release)
- amount (DECIMAL 10,2)
- credits (INTEGER)
- rewardPoints (INTEGER)
- status (ENUM: pending, completed, failed, cancelled, held)
- description (STRING)
- referenceId (UUID)
- referenceType (ENUM: ride, booking, topup, withdrawal)
- metadata (JSON)
- balanceBefore (DECIMAL 10,2)
- balanceAfter (DECIMAL 10,2)
```

### RidePayments Table
```sql
- id (UUID, Primary Key)
- rideId (UUID, Foreign Key → rides)
- bookingId (UUID, Foreign Key → bookings)
- passengerId (UUID, Foreign Key → users)
- driverId (UUID, Foreign Key → users)
- totalAmount (DECIMAL 10,2)
- paidAmount (DECIMAL 10,2)
- creditsUsed (INTEGER)
- rewardPointsUsed (INTEGER)
- cashbackEarned (DECIMAL 10,2)
- rewardPointsEarned (INTEGER)
- paymentMethod (ENUM: wallet, credits, mixed, split)
- status (ENUM: pending, held, completed, refunded, failed)
- splitPaymentId (UUID, nullable)
- escrowTransactionId (UUID, nullable)
- completedAt (DATETIME)
- refundedAt (DATETIME)
```

### SplitPayments Table
```sql
- id (UUID, Primary Key)
- rideId (UUID, Foreign Key → rides)
- initiatorId (UUID, Foreign Key → users)
- totalAmount (DECIMAL 10,2)
- participantCount (INTEGER)
- amountPerPerson (DECIMAL 10,2)
- paidCount (INTEGER)
- status (ENUM: pending, partial, completed, cancelled)
- participants (JSON: [{userId, amount, paid, paidAt}])
```

## API Endpoints

### Wallet Endpoints
```
GET    /api/wallet                    - Get wallet balance
POST   /api/wallet/add-funds          - Add funds to wallet
POST   /api/wallet/purchase-credits   - Purchase ride credits
POST   /api/wallet/redeem-points      - Redeem reward points
GET    /api/wallet/transactions       - Get transaction history
```

### Payment Endpoints
```
POST   /api/payments/process          - Process ride payment
POST   /api/payments/:id/release      - Release escrow payment
POST   /api/payments/:id/refund       - Refund payment
POST   /api/payments/split/create     - Create split payment
POST   /api/payments/split/:id/pay    - Pay split share
GET    /api/payments/summary          - Get payment summary
GET    /api/payments/calculate-price  - Calculate ride price
```

## Payment Flow

### 1. Booking a Ride
```
1. Passenger books a ride
2. System calculates total cost
3. Passenger chooses payment options:
   - Use reward points (discount)
   - Use ride credits (discount)
   - Pay remaining from wallet
4. System validates sufficient funds
5. Payment held in escrow
6. Booking confirmed
```

### 2. Ride Completion
```
1. Driver marks ride as completed
2. System releases escrow payment
3. Platform fee deducted (10%)
4. Driver receives earnings
5. Passenger receives:
   - 5% cashback
   - 10 reward points per dollar
6. Transaction records updated
```

### 3. Split Payment Flow
```
1. Initiator creates split payment
2. Selects participants from bookings
3. System calculates per-person amount
4. Participants receive notification
5. Each participant pays their share
6. Status updates: pending → partial → completed
7. Once all paid, ride payment processed
```

### 4. Refund Flow
```
1. Ride cancelled or dispute raised
2. System checks payment status
3. If held in escrow:
   - Funds returned to passenger
   - Credits restored
   - Reward points reversed
4. Transaction marked as refunded
```

## Pricing Configuration

### Constants (in services)
```javascript
CREDIT_TO_MONEY_RATE = 0.10        // 1 credit = $0.10
REWARD_POINTS_TO_MONEY_RATE = 0.01 // 1 point = $0.01
CASHBACK_RATE = 0.05                // 5% cashback
REWARD_POINTS_RATE = 10             // 10 points per dollar
PLATFORM_FEE_RATE = 0.10            // 10% platform fee
```

### Dynamic Pricing Formula
```javascript
basePrice = $5.00
pricePerMile = $1.50
pricePerMinute = $0.25
surgeFactor = 1.0 (default)

totalPrice = (basePrice + (distance × pricePerMile) + (duration × pricePerMinute)) × surgeFactor
```

## Frontend Pages

### 1. WalletPage (`/wallet`)
- View balance, credits, and reward points
- Add funds to wallet
- Purchase ride credits
- Redeem reward points
- View transaction history
- Cashback information

### 2. PaymentPage (`/payment/:bookingId`)
- Review ride details
- View wallet summary
- Select payment options
- Apply credits and points
- View payment breakdown
- Complete payment

### 3. SplitPaymentPage (`/split-payment/:rideId`)
- Select participants
- View split calculation
- Create split payment group
- Track payment status

## Usage Examples

### Add Funds to Wallet
```javascript
POST /api/wallet/add-funds
{
  "amount": 50.00,
  "description": "Wallet top-up"
}
```

### Purchase Credits
```javascript
POST /api/wallet/purchase-credits
{
  "credits": 100  // Cost: $10.00
}
```

### Process Ride Payment
```javascript
POST /api/payments/process
{
  "bookingId": "uuid",
  "useCredits": true,
  "useRewardPoints": 50,
  "splitPaymentId": null  // or UUID if split payment
}
```

### Create Split Payment
```javascript
POST /api/payments/split/create
{
  "rideId": "uuid",
  "participantIds": ["uuid1", "uuid2", "uuid3"]
}
```

## Security Features

1. **Wallet Locking**: Suspicious accounts can be locked
2. **Transaction Validation**: All transactions validated before processing
3. **Balance Checks**: Insufficient funds prevented
4. **Escrow Protection**: Funds held until ride completion
5. **Audit Trail**: Complete transaction history
6. **Refund Protection**: Automatic refunds for cancelled rides

## Migration Instructions

### Run Migrations
```bash
cd backend
npx sequelize-cli db:migrate
```

### Migration Order
1. `20240327000001-create-wallets.js`
2. `20240327000002-create-transactions.js`
3. `20240327000003-create-ride-payments.js`
4. `20240327000004-create-split-payments.js`
5. `20240327000005-add-price-to-rides.js`

## Testing

### Test Wallet Creation
```bash
# User registers → Wallet auto-created
POST /api/auth/register
```

### Test Payment Flow
```bash
# 1. Add funds
POST /api/wallet/add-funds { amount: 100 }

# 2. Book ride
POST /api/bookings { rideId: "uuid" }

# 3. Process payment
POST /api/payments/process { bookingId: "uuid" }

# 4. Complete ride (driver)
PUT /api/rides/:id/complete

# 5. Check wallet (passenger)
GET /api/wallet  # Should show cashback + points
```

## Future Enhancements

1. **Subscription Plans**: Monthly passes for frequent riders
2. **Referral Bonuses**: Earn credits for referring friends
3. **Promotional Codes**: Discount codes for special events
4. **Tiered Rewards**: Higher tiers unlock better rewards
5. **Withdrawal System**: Allow drivers to withdraw earnings
6. **Payment Analytics**: Detailed spending insights
7. **Budget Limits**: Set spending limits
8. **Auto-Reload**: Automatically add funds when low

## Support

For issues or questions about the payment system:
1. Check transaction history in wallet
2. Review payment status in ride details
3. Contact support with transaction ID
4. Check escrow status for pending payments

---

**Note**: This is a simulated payment system for educational purposes. For production use, integrate with real payment gateways like Stripe, PayPal, or Braintree.
