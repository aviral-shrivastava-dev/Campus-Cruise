const { User, Ride, Booking, Message, Review } = require('../models');
const bcrypt = require('bcrypt');

/**
 * Test data factories for creating consistent test objects
 * These factories provide default values and allow overrides
 */

/**
 * Create a test user
 * @param {Object} overrides - Properties to override defaults
 * @returns {Promise<User>} Created user instance
 */
const createTestUser = async (overrides = {}) => {
  const defaults = {
    name: 'Test User',
    email: `test${Date.now()}${Math.random()}@example.com`,
    password: 'TestPassword123!',
    college: 'Test University',
    phone: '1234567890',
    role: ['passenger']
  };

  const userData = { ...defaults, ...overrides };
  return await User.create(userData);
};

/**
 * Create a test driver user
 * @param {Object} overrides - Properties to override defaults
 * @returns {Promise<User>} Created driver instance
 */
const createTestDriver = async (overrides = {}) => {
  const defaults = {
    name: 'Test Driver',
    email: `driver${Date.now()}${Math.random()}@example.com`,
    password: 'TestPassword123!',
    college: 'Test University',
    phone: '1234567890',
    role: ['driver'],
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleColor: 'Blue',
    licensePlate: 'ABC123'
  };

  const userData = { ...defaults, ...overrides };
  return await User.create(userData);
};

/**
 * Create a test ride
 * @param {Object} overrides - Properties to override defaults
 * @returns {Promise<Ride>} Created ride instance
 */
const createTestRide = async (overrides = {}) => {
  let driver = overrides.driver;
  
  // Create a driver if not provided
  if (!driver && !overrides.driverId) {
    driver = await createTestDriver();
  }

  const defaults = {
    driverId: driver ? driver.id : overrides.driverId,
    source: 'Campus Main Gate',
    destination: 'Downtown Mall',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    availableSeats: 3,
    totalSeats: 4,
    status: 'active'
  };

  const rideData = { ...defaults, ...overrides };
  delete rideData.driver; // Remove driver object if present
  
  return await Ride.create(rideData);
};

/**
 * Create a test booking
 * @param {Object} overrides - Properties to override defaults
 * @returns {Promise<Booking>} Created booking instance
 */
const createTestBooking = async (overrides = {}) => {
  let ride = overrides.ride;
  let passenger = overrides.passenger;

  // Create ride if not provided
  if (!ride && !overrides.rideId) {
    ride = await createTestRide();
  }

  // Create passenger if not provided
  if (!passenger && !overrides.passengerId) {
    passenger = await createTestUser();
  }

  const defaults = {
    rideId: ride ? ride.id : overrides.rideId,
    passengerId: passenger ? passenger.id : overrides.passengerId,
    status: 'confirmed',
    isLateCancellation: false
  };

  const bookingData = { ...defaults, ...overrides };
  delete bookingData.ride; // Remove ride object if present
  delete bookingData.passenger; // Remove passenger object if present

  return await Booking.create(bookingData);
};

/**
 * Create a test message
 * @param {Object} overrides - Properties to override defaults
 * @returns {Promise<Message>} Created message instance
 */
const createTestMessage = async (overrides = {}) => {
  let sender = overrides.sender;
  let recipient = overrides.recipient;

  // Create sender if not provided
  if (!sender && !overrides.senderId) {
    sender = await createTestUser({ name: 'Sender' });
  }

  // Create recipient if not provided for direct messages
  if (!recipient && !overrides.recipientId && overrides.messageType !== 'group') {
    recipient = await createTestUser({ name: 'Recipient' });
  }

  const defaults = {
    senderId: sender ? sender.id : overrides.senderId,
    recipientId: recipient ? recipient.id : overrides.recipientId,
    content: 'Test message content',
    isRead: false,
    messageType: 'direct'
  };

  const messageData = { ...defaults, ...overrides };
  delete messageData.sender; // Remove sender object if present
  delete messageData.recipient; // Remove recipient object if present

  return await Message.create(messageData);
};

/**
 * Create a test review
 * @param {Object} overrides - Properties to override defaults
 * @returns {Promise<Review>} Created review instance
 */
const createTestReview = async (overrides = {}) => {
  let ride = overrides.ride;
  let reviewer = overrides.reviewer;
  let driver = overrides.driver;

  // Create ride if not provided
  if (!ride && !overrides.rideId) {
    driver = driver || await createTestDriver();
    ride = await createTestRide({ driverId: driver.id });
  }

  // Get driver from ride if not provided
  if (!driver && !overrides.driverId) {
    if (ride) {
      driver = await User.findByPk(ride.driverId);
    } else {
      driver = await createTestDriver();
    }
  }

  // Create reviewer if not provided
  if (!reviewer && !overrides.reviewerId) {
    reviewer = await createTestUser({ name: 'Reviewer' });
  }

  const defaults = {
    rideId: ride ? ride.id : overrides.rideId,
    reviewerId: reviewer ? reviewer.id : overrides.reviewerId,
    driverId: driver ? driver.id : overrides.driverId,
    rating: 5,
    comment: 'Great ride!'
  };

  const reviewData = { ...defaults, ...overrides };
  delete reviewData.ride; // Remove ride object if present
  delete reviewData.reviewer; // Remove reviewer object if present
  delete reviewData.driver; // Remove driver object if present

  return await Review.create(reviewData);
};

/**
 * Create multiple test users
 * @param {Number} count - Number of users to create
 * @param {Object} overrides - Properties to override defaults
 * @returns {Promise<Array<User>>} Array of created users
 */
const createTestUsers = async (count, overrides = {}) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      name: `Test User ${i + 1}`,
      ...overrides
    });
    users.push(user);
  }
  return users;
};

/**
 * Create multiple test rides
 * @param {Number} count - Number of rides to create
 * @param {Object} overrides - Properties to override defaults
 * @returns {Promise<Array<Ride>>} Array of created rides
 */
const createTestRides = async (count, overrides = {}) => {
  const rides = [];
  for (let i = 0; i < count; i++) {
    const ride = await createTestRide({
      source: `Source ${i + 1}`,
      destination: `Destination ${i + 1}`,
      ...overrides
    });
    rides.push(ride);
  }
  return rides;
};

/**
 * Clean up all test data from database
 * Use this in afterEach or afterAll hooks
 */
const cleanupTestData = async () => {
  await Review.destroy({ where: {}, force: true });
  await Message.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await Ride.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
};

/**
 * Reset database to clean state
 * Useful for test setup
 */
const resetDatabase = async (sequelize) => {
  await sequelize.sync({ force: true });
};

module.exports = {
  createTestUser,
  createTestDriver,
  createTestRide,
  createTestBooking,
  createTestMessage,
  createTestReview,
  createTestUsers,
  createTestRides,
  cleanupTestData,
  resetDatabase
};
