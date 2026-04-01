const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development/testing, use ethereal email or configure SMTP
  if (process.env.NODE_ENV === 'test') {
    // Return a mock transporter for testing
    return {
      sendMail: async () => ({ messageId: 'test-message-id' })
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send email with retry logic
 * @param {Object} mailOptions - Email options
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} Email send result
 */
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  const transporter = createTransporter();
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully on attempt ${attempt}:`, info.messageId);
      return info;
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  console.error(`Failed to send email after ${maxRetries} attempts:`, lastError);
  throw lastError;
};

/**
 * Send welcome email to new user
 * @param {string} email - User email address
 * @param {string} name - User name
 * @returns {Promise<Object>} Email send result
 */
const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Campus Cruise" <noreply@campuscruise.com>',
    to: email,
    subject: 'Welcome to Campus Cruise!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Campus Cruise!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for joining Campus Cruise, the community-driven carpooling platform for college students!</p>
              <p>Your account has been successfully created. You can now:</p>
              <ul>
                <li>Offer rides as a driver</li>
                <li>Find and join rides as a passenger</li>
                <li>Connect with fellow students</li>
                <li>Build a trusted transport network</li>
              </ul>
              <p>Get started by logging in and exploring available rides in your area.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Campus Cruise</a>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2024 Campus Cruise. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      Thank you for joining Campus Cruise, the community-driven carpooling platform for college students!
      
      Your account has been successfully created. You can now:
      - Offer rides as a driver
      - Find and join rides as a passenger
      - Connect with fellow students
      - Build a trusted transport network
      
      Get started by logging in and exploring available rides in your area.
      
      Login at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
      
      This is an automated email. Please do not reply.
      © 2024 Campus Cruise. All rights reserved.
    `
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Send booking confirmation email
 * @param {string} email - User email address
 * @param {string} name - User name
 * @param {Object} rideDetails - Ride information
 * @returns {Promise<Object>} Email send result
 */
const sendBookingConfirmationEmail = async (email, name, rideDetails) => {
  const { source, destination, departureTime, driverName, passengerName, isDriver } = rideDetails;

  // Different message for driver vs passenger
  const subject = isDriver ? 'New Booking Received - Campus Cruise' : 'Booking Confirmed - Campus Cruise';
  const title = isDriver ? 'New Booking Received!' : 'Booking Confirmed!';
  const message = isDriver 
    ? `${passengerName} has booked your ride.`
    : `Your ride booking has been confirmed.`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Campus Cruise" <noreply@campuscruise.com>',
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .ride-details { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>${message}</p>
              <div class="ride-details">
                <p><strong>From:</strong> ${source}</p>
                <p><strong>To:</strong> ${destination}</p>
                <p><strong>Departure:</strong> ${new Date(departureTime).toLocaleString()}</p>
                ${isDriver ? `<p><strong>Passenger:</strong> ${passengerName}</p>` : `<p><strong>Driver:</strong> ${driverName}</p>`}
              </div>
              ${isDriver 
                ? '<p>You can contact your passenger through the Campus Cruise app.</p>' 
                : '<p>Please be ready at the pickup location on time. You can contact your driver through the Campus Cruise app.</p>'}
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2024 Campus Cruise. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      ${message}
      
      From: ${source}
      To: ${destination}
      Departure: ${new Date(departureTime).toLocaleString()}
      ${isDriver ? `Passenger: ${passengerName}` : `Driver: ${driverName}`}
      
      ${isDriver 
        ? 'You can contact your passenger through the Campus Cruise app.' 
        : 'Please be ready at the pickup location on time. You can contact your driver through the Campus Cruise app.'}
      
      This is an automated email. Please do not reply.
      © 2024 Campus Cruise. All rights reserved.
    `
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Send ride cancellation email
 * @param {string} email - User email address
 * @param {string} name - User name
 * @param {Object} rideDetails - Ride information
 * @returns {Promise<Object>} Email send result
 */
const sendRideCancellationEmail = async (email, name, rideDetails) => {
  const { source, destination, departureTime, reason } = rideDetails;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Campus Cruise" <noreply@campuscruise.com>',
    to: email,
    subject: 'Ride Cancelled - Campus Cruise',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .ride-details { background-color: white; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ride Cancelled</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We're sorry to inform you that the following ride has been cancelled:</p>
              <div class="ride-details">
                <p><strong>From:</strong> ${source}</p>
                <p><strong>To:</strong> ${destination}</p>
                <p><strong>Departure:</strong> ${new Date(departureTime).toLocaleString()}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
              <p>Please search for alternative rides on Campus Cruise.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/rides" class="button">Find Alternative Rides</a>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2024 Campus Cruise. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      We're sorry to inform you that the following ride has been cancelled:
      
      From: ${source}
      To: ${destination}
      Departure: ${new Date(departureTime).toLocaleString()}
      ${reason ? `Reason: ${reason}` : ''}
      
      Please search for alternative rides on Campus Cruise.
      
      Find rides at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/rides
      
      This is an automated email. Please do not reply.
      © 2024 Campus Cruise. All rights reserved.
    `
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Send booking cancellation email
 * @param {string} email - User email address
 * @param {string} name - User name
 * @param {Object} bookingDetails - Booking information
 * @returns {Promise<Object>} Email send result
 */
const sendBookingCancellationEmail = async (email, name, bookingDetails) => {
  const { source, destination, departureTime, passengerName, isDriver } = bookingDetails;

  const subject = isDriver ? 'Booking Cancelled - Campus Cruise' : 'Your Booking Cancellation Confirmed - Campus Cruise';
  const title = isDriver ? 'Booking Cancelled' : 'Cancellation Confirmed';
  const message = isDriver 
    ? `${passengerName} has cancelled their booking for your ride.`
    : 'Your booking has been cancelled successfully.';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Campus Cruise" <noreply@campuscruise.com>',
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .ride-details { background-color: white; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>${message}</p>
              <div class="ride-details">
                <p><strong>From:</strong> ${source}</p>
                <p><strong>To:</strong> ${destination}</p>
                <p><strong>Departure:</strong> ${new Date(departureTime).toLocaleString()}</p>
                ${isDriver ? `<p><strong>Passenger:</strong> ${passengerName}</p>` : ''}
              </div>
              ${isDriver 
                ? '<p>The seat is now available for other passengers.</p>' 
                : '<p>You can search for alternative rides on Campus Cruise.</p>'}
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2024 Campus Cruise. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      ${message}
      
      From: ${source}
      To: ${destination}
      Departure: ${new Date(departureTime).toLocaleString()}
      ${isDriver ? `Passenger: ${passengerName}` : ''}
      
      ${isDriver 
        ? 'The seat is now available for other passengers.' 
        : 'You can search for alternative rides on Campus Cruise.'}
      
      This is an automated email. Please do not reply.
      © 2024 Campus Cruise. All rights reserved.
    `
  };

  return sendEmailWithRetry(mailOptions);
};

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendRideCancellationEmail,
  sendEmailWithRetry
};
