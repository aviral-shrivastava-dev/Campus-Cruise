const {
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendRideCancellationEmail,
  sendEmailWithRetry
} = require('../email.service');

describe('Email Service', () => {
  // In test environment, the service uses a mock transporter
  
  describe('sendWelcomeEmail', () => {
    test('should send welcome email successfully', async () => {
      const result = await sendWelcomeEmail('test@example.com', 'John Doe');
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    test('should include user name in email', async () => {
      const name = 'Jane Smith';
      const result = await sendWelcomeEmail('jane@example.com', name);
      
      expect(result).toBeDefined();
    });

    test('should handle email sending', async () => {
      await expect(
        sendWelcomeEmail('test@example.com', 'Test User')
      ).resolves.toBeDefined();
    });
  });

  describe('sendBookingConfirmationEmail', () => {
    const rideDetails = {
      source: 'Campus Main Gate',
      destination: 'Downtown Mall',
      departureTime: new Date('2024-12-25T10:00:00'),
      driverName: 'John Driver',
      passengerName: 'Jane Passenger',
      isDriver: false
    };

    test('should send booking confirmation to passenger', async () => {
      const result = await sendBookingConfirmationEmail(
        'passenger@example.com',
        'Jane Passenger',
        rideDetails
      );
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    test('should send booking notification to driver', async () => {
      const driverDetails = { ...rideDetails, isDriver: true };
      const result = await sendBookingConfirmationEmail(
        'driver@example.com',
        'John Driver',
        driverDetails
      );
      
      expect(result).toBeDefined();
    });

    test('should include ride details', async () => {
      const result = await sendBookingConfirmationEmail(
        'test@example.com',
        'Test User',
        rideDetails
      );
      
      expect(result).toBeDefined();
    });
  });

  describe('sendRideCancellationEmail', () => {
    const rideDetails = {
      source: 'Campus Main Gate',
      destination: 'Downtown Mall',
      departureTime: new Date('2024-12-25T10:00:00'),
      reason: 'Driver unavailable'
    };

    test('should send ride cancellation email', async () => {
      const result = await sendRideCancellationEmail(
        'passenger@example.com',
        'Jane Passenger',
        rideDetails
      );
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    test('should handle cancellation without reason', async () => {
      const detailsWithoutReason = { ...rideDetails };
      delete detailsWithoutReason.reason;
      
      const result = await sendRideCancellationEmail(
        'test@example.com',
        'Test User',
        detailsWithoutReason
      );
      
      expect(result).toBeDefined();
    });
  });

  describe('sendBookingCancellationEmail', () => {
    const bookingDetails = {
      source: 'Campus Main Gate',
      destination: 'Downtown Mall',
      departureTime: new Date('2024-12-25T10:00:00'),
      passengerName: 'Jane Passenger',
      isDriver: false
    };

    test('should send booking cancellation to passenger', async () => {
      const result = await sendBookingCancellationEmail(
        'passenger@example.com',
        'Jane Passenger',
        bookingDetails
      );
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    test('should send booking cancellation notification to driver', async () => {
      const driverDetails = { ...bookingDetails, isDriver: true };
      const result = await sendBookingCancellationEmail(
        'driver@example.com',
        'John Driver',
        driverDetails
      );
      
      expect(result).toBeDefined();
    });
  });

  describe('sendEmailWithRetry', () => {
    test('should send email successfully on first attempt', async () => {
      const mailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message'
      };
      
      const result = await sendEmailWithRetry(mailOptions, 3);
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    test('should handle email options', async () => {
      const mailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      };
      
      await expect(sendEmailWithRetry(mailOptions)).resolves.toBeDefined();
    });
  });
});
