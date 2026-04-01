const bookingService = require('../services/booking.service');
const { logInfo, logError } = require('./logger');

// Run cleanup every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

let cleanupInterval = null;

/**
 * Start the booking cleanup scheduler
 */
function startBookingCleanup() {
  if (cleanupInterval) {
    logInfo('Booking cleanup scheduler already running');
    return;
  }

  logInfo('Starting booking cleanup scheduler');

  // Run immediately on start
  runCleanup();

  // Then run every 5 minutes
  cleanupInterval = setInterval(runCleanup, CLEANUP_INTERVAL);
}

/**
 * Stop the booking cleanup scheduler
 */
function stopBookingCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logInfo('Booking cleanup scheduler stopped');
  }
}

/**
 * Run the cleanup task
 */
async function runCleanup() {
  try {
    const result = await bookingService.cancelUnpaidBookings();
    
    if (result.cancelledCount > 0) {
      logInfo(`Auto-cancelled ${result.cancelledCount} unpaid booking(s)`);
    }
  } catch (error) {
    logError(error, { context: 'Booking cleanup scheduler failed' });
  }
}

module.exports = {
  startBookingCleanup,
  stopBookingCleanup
};
