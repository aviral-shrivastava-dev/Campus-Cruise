import axios from '../utils/axios';

/**
 * API Service Layer
 * Centralized API functions for all backend endpoints
 */

// ============================================
// Authentication APIs
// ============================================

export const authAPI = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Response with token and user data
   */
  register: async (userData) => {
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Response with token and user data
   */
  login: async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise} Response
   */
  logout: async () => {
    const response = await axios.post('/api/auth/logout');
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise} Current user data
   */
  getCurrentUser: async () => {
    const response = await axios.get('/api/auth/me');
    return response.data;
  }
};

// ============================================
// User APIs
// ============================================

export const userAPI = {
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise} User data
   */
  getUser: async (userId) => {
    const response = await axios.get(`/api/users/${userId}`);
    return response.data;
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user data
   */
  updateProfile: async (userId, userData) => {
    const response = await axios.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Get user's rides
   * @param {string} userId - User ID
   * @returns {Promise} Array of rides
   */
  getUserRides: async (userId) => {
    const response = await axios.get(`/api/users/${userId}/rides`);
    return response.data;
  },

  /**
   * Get user's bookings
   * @param {string} userId - User ID
   * @returns {Promise} Array of bookings
   */
  getUserBookings: async (userId) => {
    const response = await axios.get(`/api/bookings/users/${userId}`);
    return response.data;
  },

  /**
   * Get user's reviews (reviews written by the user)
   * @param {string} userId - User ID
   * @returns {Promise} Array of reviews
   */
  getUserReviews: async (userId) => {
    const response = await axios.get(`/api/reviews/driver/${userId}`);
    return response.data;
  },

  /**
   * Get user's ride history
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters (startDate, endDate)
   * @returns {Promise} Array of historical rides
   */
  getRideHistory: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`/api/users/${userId}/history?${params}`);
    return response.data;
  }
};

// ============================================
// Ride APIs
// ============================================

export const rideAPI = {
  /**
   * Create a new ride
   * @param {Object} rideData - Ride data
   * @returns {Promise} Created ride data
   */
  createRide: async (rideData) => {
    const response = await axios.post('/api/rides', rideData);
    return response.data;
  },

  /**
   * Get all available rides with optional filters
   * @param {Object} filters - Optional filters (source, destination, date, startDate, endDate)
   * @returns {Promise} Array of rides
   */
  getRides: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await axios.get(`/api/rides?${params}`);
    return response.data;
  },

  /**
   * Get ride by ID
   * @param {string} rideId - Ride ID
   * @returns {Promise} Ride data
   */
  getRide: async (rideId) => {
    const response = await axios.get(`/api/rides/${rideId}`);
    return response.data;
  },

  /**
   * Cancel ride
   * @param {string} rideId - Ride ID
   * @returns {Promise} Response
   */
  cancelRide: async (rideId) => {
    const response = await axios.delete(`/api/rides/${rideId}`);
    return response.data;
  },

  /**
   * Get suggested rides based on user preferences
   * @param {Object} params - Search parameters
   * @returns {Promise} Array of suggested rides
   */
  getSuggestedRides: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await axios.get(`/api/rides/suggestions?${queryParams}`);
    return response.data;
  }
};

// ============================================
// Booking APIs
// ============================================

export const bookingAPI = {
  /**
   * Create a booking (join a ride)
   * @param {Object} bookingData - Booking data (rideId)
   * @returns {Promise} Created booking data
   */
  createBooking: async (bookingData) => {
    const response = await axios.post('/api/bookings', bookingData);
    return response.data;
  },

  /**
   * Get booking by ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Booking data
   */
  getBooking: async (bookingId) => {
    const response = await axios.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Cancel booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Response
   */
  cancelBooking: async (bookingId) => {
    const response = await axios.delete(`/api/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Cancel pending booking (for when user abandons payment)
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Response
   */
  cancelPendingBooking: async (bookingId) => {
    const response = await axios.post(`/api/bookings/${bookingId}/cancel-pending`);
    return response.data;
  },

  /**
   * Get all bookings for a ride
   * @param {string} rideId - Ride ID
   * @returns {Promise} Array of bookings
   */
  getRideBookings: async (rideId) => {
    const response = await axios.get(`/api/bookings/ride/${rideId}`);
    return response.data;
  }
};

// ============================================
// Message APIs
// ============================================

export const messageAPI = {
  /**
   * Send a message
   * @param {Object} messageData - Message data (recipientId or rideId, content)
   * @returns {Promise} Sent message data
   */
  sendMessage: async (messageData) => {
    const response = await axios.post('/api/messages', messageData);
    return response.data;
  },

  /**
   * Get conversation with a user
   * @param {string} userId - User ID
   * @returns {Promise} Array of messages
   */
  getConversation: async (userId) => {
    const response = await axios.get(`/api/messages/conversation/${userId}`);
    return response.data;
  },

  /**
   * Get group chat messages for a ride
   * @param {string} rideId - Ride ID
   * @returns {Promise} Array of messages
   */
  getRideMessages: async (rideId) => {
    const response = await axios.get(`/api/messages/ride/${rideId}`);
    return response.data;
  },

  /**
   * Mark messages as read
   * @param {Object} data - Either { conversationUserId } or { rideId }
   * @returns {Promise} Response
   */
  markAsRead: async (data) => {
    const response = await axios.put('/api/messages/read', data);
    return response.data;
  }
};

// ============================================
// Review APIs
// ============================================

export const reviewAPI = {
  /**
   * Create a review
   * @param {Object} reviewData - Review data (rideId, driverId, rating, comment)
   * @returns {Promise} Created review data
   */
  createReview: async (reviewData) => {
    const response = await axios.post('/api/reviews', reviewData);
    return response.data;
  },

  /**
   * Get reviews for a driver
   * @param {string} driverId - Driver ID
   * @returns {Promise} Array of reviews and average rating
   */
  getDriverReviews: async (driverId) => {
    const response = await axios.get(`/api/reviews/driver/${driverId}`);
    return response.data;
  }
};

// ============================================
// Location APIs
// ============================================

export const locationAPI = {
  /**
   * Start ride and begin location tracking
   * @param {string} rideId - Ride ID
   * @returns {Promise} Response
   */
  startRide: async (rideId) => {
    const response = await axios.post(`/api/rides/${rideId}/start-tracking`);
    return response.data;
  },

  /**
   * Update driver location
   * @param {string} rideId - Ride ID
   * @param {Object} location - Location data (latitude, longitude)
   * @returns {Promise} Response
   */
  updateLocation: async (rideId, location) => {
    const response = await axios.put(`/api/rides/${rideId}/location`, location);
    return response.data;
  },

  /**
   * Stop ride and end location tracking
   * @param {string} rideId - Ride ID
   * @returns {Promise} Response
   */
  stopRide: async (rideId) => {
    const response = await axios.post(`/api/rides/${rideId}/stop-tracking`);
    return response.data;
  },

  /**
   * Get current location for a ride
   * @param {string} rideId - Ride ID
   * @returns {Promise} Location data
   */
  getRideLocation: async (rideId) => {
    const response = await axios.get(`/api/rides/${rideId}/location`);
    return response.data;
  }
};

// ============================================
// Wallet APIs
// ============================================

export const walletAPI = {
  /**
   * Get wallet balance and details
   * @returns {Promise} Wallet data
   */
  getWallet: async () => {
    const response = await axios.get('/api/wallet');
    return response.data;
  },

  /**
   * Add funds to wallet
   * @param {number} amount - Amount to add
   * @param {string} description - Optional description
   * @returns {Promise} Updated wallet data
   */
  addFunds: async (amount, description = 'Wallet top-up') => {
    const response = await axios.post('/api/wallet/add-funds', { amount, description });
    return response.data;
  },

  /**
   * Purchase ride credits
   * @param {number} credits - Number of credits to purchase
   * @returns {Promise} Updated wallet data
   */
  purchaseCredits: async (credits) => {
    const response = await axios.post('/api/wallet/purchase-credits', { credits });
    return response.data;
  },

  /**
   * Redeem reward points
   * @param {number} points - Number of points to redeem
   * @returns {Promise} Updated wallet data
   */
  redeemPoints: async (points) => {
    const response = await axios.post('/api/wallet/redeem-points', { points });
    return response.data;
  },

  /**
   * Get transaction history
   * @param {number} limit - Number of transactions to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise} Transaction history
   */
  getTransactions: async (limit = 50, offset = 0) => {
    const response = await axios.get(`/api/wallet/transactions?limit=${limit}&offset=${offset}`);
    return response.data;
  }
};

// ============================================
// Payment APIs
// ============================================

export const paymentAPI = {
  /**
   * Process ride payment
   * @param {Object} paymentData - Payment data (bookingId, useCredits, useRewardPoints, splitPaymentId)
   * @returns {Promise} Payment data
   */
  processPayment: async (paymentData) => {
    const response = await axios.post('/api/payments/process', paymentData);
    return response.data;
  },

  /**
   * Release escrow payment to driver
   * @param {string} paymentId - Payment ID
   * @returns {Promise} Updated payment data
   */
  releasePayment: async (paymentId) => {
    const response = await axios.post(`/api/payments/${paymentId}/release`);
    return response.data;
  },

  /**
   * Refund payment
   * @param {string} paymentId - Payment ID
   * @param {string} reason - Refund reason
   * @returns {Promise} Updated payment data
   */
  refundPayment: async (paymentId, reason) => {
    const response = await axios.post(`/api/payments/${paymentId}/refund`, { reason });
    return response.data;
  },

  /**
   * Create split payment
   * @param {string} rideId - Ride ID
   * @param {Array<string>} participantIds - Array of participant user IDs
   * @returns {Promise} Split payment data
   */
  createSplitPayment: async (rideId, participantIds) => {
    const response = await axios.post('/api/payments/split/create', { rideId, participantIds });
    return response.data;
  },

  /**
   * Pay split payment share
   * @param {string} splitPaymentId - Split payment ID
   * @returns {Promise} Updated split payment data
   */
  paySplitShare: async (splitPaymentId) => {
    const response = await axios.post(`/api/payments/split/${splitPaymentId}/pay`);
    return response.data;
  },

  /**
   * Get payment summary
   * @returns {Promise} Payment summary with wallet, transactions, pending payments
   */
  getPaymentSummary: async () => {
    const response = await axios.get('/api/payments/summary');
    return response.data;
  },

  /**
   * Calculate ride price
   * @param {number} distance - Distance in miles
   * @param {number} duration - Duration in minutes
   * @param {number} surge - Surge multiplier (default 1.0)
   * @returns {Promise} Calculated price
   */
  calculatePrice: async (distance, duration, surge = 1.0) => {
    const response = await axios.get(`/api/payments/calculate-price?distance=${distance}&duration=${duration}&surge=${surge}`);
    return response.data;
  }
};

// ============================================
// Export all APIs
// ============================================

export default {
  auth: authAPI,
  user: userAPI,
  ride: rideAPI,
  booking: bookingAPI,
  message: messageAPI,
  review: reviewAPI,
  location: locationAPI,
  wallet: walletAPI,
  payment: paymentAPI
};
