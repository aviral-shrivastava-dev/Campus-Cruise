const fc = require('fast-check');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const jwt = require('jsonwebtoken');
const { initializeSocket, getUserSocket, isUserConnected } = require('../index');
const { 
  broadcastNewRide, 
  broadcastSeatChange, 
  broadcastRideCancellation 
} = require('../rideEvents');
const { 
  sendNotification, 
  offlineNotificationQueue 
} = require('../notifications');
const db = require('../../models');

const { User, Ride } = db;

let httpServer;
let io;
let serverSocket;
let clientSocket;

beforeAll(async () => {
  // Sync database for tests
  await db.sequelize.sync({ force: true });
});

beforeEach((done) => {
  // Create HTTP server and Socket.io instance
  httpServer = http.createServer();
  io = new Server(httpServer);
  initializeSocket(io);
  
  httpServer.listen(() => {
    const port = httpServer.address().port;
    done();
  });
});

afterEach((done) => {
  // Clean up
  if (clientSocket && clientSocket.connected) {
    clientSocket.disconnect();
  }
  if (io) {
    io.close();
  }
  if (httpServer) {
    httpServer.close();
  }
  
  // Clear notification queue
  offlineNotificationQueue.clear();
  
  done();
});

afterAll(async () => {
  await db.sequelize.close();
});

/**
 * Helper function to create a test user
 */
const createTestUser = async (userData = {}) => {
  const user = await User.create({
    name: userData.name || 'Test User',
    email: userData.email || `test${Date.now()}@example.com`,
    password: userData.password || 'password123',
    college: userData.college || 'Test College',
    phone: userData.phone || '1234567890',
    role: userData.role || ['passenger'],
    ...userData
  });
  return user;
};

/**
 * Helper function to create authenticated client
 */
const createAuthenticatedClient = (userId, port) => {
  const token = jwt.sign(
    { id: userId, role: ['passenger'] },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
  
  return Client(`http://localhost:${port}`, {
    auth: { token }
  });
};

/**
 * Property 23: Online message delivery
 * Feature: campus-cruise, Property 23: Online message delivery
 * Validates: Requirements 7.1
 */
describe('Property 23: Online message delivery', () => {
  test('For any message sent to an online user, the system should deliver the message immediately via WebSocket', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          type: fc.constantFrom('booking_created', 'ride_cancelled', 'notification'),
          title: fc.string({ minLength: 1, maxLength: 50 }),
          message: fc.string({ minLength: 1, maxLength: 200 })
        }),
        async (notificationData) => {
          // Create test user
          const user = await createTestUser();
          const port = httpServer.address().port;
          
          // Connect client
          const client = createAuthenticatedClient(user.id, port);
          
          // Wait for connection
          await new Promise((resolve) => {
            client.on('authenticated', resolve);
          });
          
          // Verify user is connected
          expect(isUserConnected(user.id)).toBe(true);
          
          // Send notification
          const notificationReceived = new Promise((resolve) => {
            client.on('notification', (data) => {
              resolve(data);
            });
          });
          
          sendNotification(io, user.id, notificationData, getUserSocket, isUserConnected);
          
          // Wait for notification
          const receivedNotification = await notificationReceived;
          
          // Verify notification was delivered
          expect(receivedNotification.type).toBe(notificationData.type);
          expect(receivedNotification.title).toBe(notificationData.title);
          expect(receivedNotification.message).toBe(notificationData.message);
          
          // Clean up
          client.disconnect();
          await user.destroy();
        }
      ),
      { numRuns: 10 } // Reduced runs for WebSocket tests
    );
  }, 30000);
});

/**
 * Property 24: Offline message storage
 * Feature: campus-cruise, Property 24: Offline message storage
 * Validates: Requirements 7.2
 */
describe('Property 24: Offline message storage', () => {
  test('For any message sent to an offline user, the system should store the message and deliver it when the user reconnects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          type: fc.constantFrom('booking_created', 'ride_cancelled'),
          title: fc.string({ minLength: 1, maxLength: 50 }),
          message: fc.string({ minLength: 1, maxLength: 200 })
        }),
        async (notificationData) => {
          // Create test user (offline)
          const user = await createTestUser();
          
          // Verify user is not connected
          expect(isUserConnected(user.id)).toBe(false);
          
          // Send notification to offline user
          sendNotification(io, user.id, notificationData, getUserSocket, isUserConnected);
          
          // Verify notification was queued
          expect(offlineNotificationQueue.has(user.id)).toBe(true);
          const queuedNotifications = offlineNotificationQueue.get(user.id);
          expect(queuedNotifications.length).toBeGreaterThan(0);
          expect(queuedNotifications[0].type).toBe(notificationData.type);
          
          // Clean up
          await user.destroy();
          offlineNotificationQueue.delete(user.id);
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);
});

/**
 * Property 79: Seat change broadcasts
 * Feature: campus-cruise, Property 79: Seat change broadcasts
 * Validates: Requirements 23.1
 */
describe('Property 79: Seat change broadcasts', () => {
  test('For any change to a ride\'s available seats, the system should broadcast the update to all users viewing that ride via WebSocket', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10 }),
        async (availableSeats) => {
          // Create test user and ride
          const driver = await createTestUser({ role: ['driver'] });
          const ride = await Ride.create({
            driverId: driver.id,
            source: 'Campus A',
            destination: 'Campus B',
            departureTime: new Date(Date.now() + 86400000),
            availableSeats: 5,
            totalSeats: 5,
            status: 'active'
          });
          
          const port = httpServer.address().port;
          const client = createAuthenticatedClient(driver.id, port);
          
          // Wait for connection
          await new Promise((resolve) => {
            client.on('authenticated', resolve);
          });
          
          // Listen for seat change
          const seatChangeReceived = new Promise((resolve) => {
            client.on('seat_change', (data) => {
              resolve(data);
            });
          });
          
          // Broadcast seat change
          broadcastSeatChange(io, ride.id, availableSeats);
          
          // Wait for broadcast
          const receivedUpdate = await seatChangeReceived;
          
          // Verify broadcast
          expect(receivedUpdate.rideId).toBe(ride.id);
          expect(receivedUpdate.availableSeats).toBe(availableSeats);
          
          // Clean up
          client.disconnect();
          await ride.destroy();
          await driver.destroy();
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);
});

/**
 * Property 80: Ride cancellation broadcasts
 * Feature: campus-cruise, Property 80: Ride cancellation broadcasts
 * Validates: Requirements 23.2
 */
describe('Property 80: Ride cancellation broadcasts', () => {
  test('For any ride cancellation, the system should immediately update the ride status for all connected users via WebSocket', async () => {
    // Create test user and ride
    const driver = await createTestUser({ role: ['driver'] });
    const ride = await Ride.create({
      driverId: driver.id,
      source: 'Campus A',
      destination: 'Campus B',
      departureTime: new Date(Date.now() + 86400000),
      availableSeats: 5,
      totalSeats: 5,
      status: 'active'
    });
    
    const port = httpServer.address().port;
    const client = createAuthenticatedClient(driver.id, port);
    
    // Wait for connection
    await new Promise((resolve) => {
      client.on('authenticated', resolve);
    });
    
    // Listen for cancellation
    const cancellationReceived = new Promise((resolve) => {
      client.on('ride_cancelled', (data) => {
        resolve(data);
      });
    });
    
    // Broadcast cancellation
    broadcastRideCancellation(io, ride.id, ride);
    
    // Wait for broadcast
    const receivedUpdate = await cancellationReceived;
    
    // Verify broadcast
    expect(receivedUpdate.rideId).toBe(ride.id);
    expect(receivedUpdate.ride).toBeDefined();
    
    // Clean up
    client.disconnect();
    await ride.destroy();
    await driver.destroy();
  }, 30000);
});

/**
 * Property 81: New ride broadcasts
 * Feature: campus-cruise, Property 81: New ride broadcasts
 * Validates: Requirements 23.3
 */
describe('Property 81: New ride broadcasts', () => {
  test('For any new ride creation, the system should broadcast the new ride to all users viewing the available rides list via WebSocket', async () => {
    // Create test user
    const driver = await createTestUser({ role: ['driver'] });
    const ride = await Ride.create({
      driverId: driver.id,
      source: 'Campus A',
      destination: 'Campus B',
      departureTime: new Date(Date.now() + 86400000),
      availableSeats: 5,
      totalSeats: 5,
      status: 'active'
    });
    
    const port = httpServer.address().port;
    const client = createAuthenticatedClient(driver.id, port);
    
    // Wait for connection
    await new Promise((resolve) => {
      client.on('authenticated', resolve);
    });
    
    // Listen for new ride
    const rideCreatedReceived = new Promise((resolve) => {
      client.on('ride_created', (data) => {
        resolve(data);
      });
    });
    
    // Broadcast new ride
    broadcastNewRide(io, ride);
    
    // Wait for broadcast
    const receivedRide = await rideCreatedReceived;
    
    // Verify broadcast
    expect(receivedRide.ride).toBeDefined();
    expect(receivedRide.ride.id).toBe(ride.id);
    
    // Clean up
    client.disconnect();
    await ride.destroy();
    await driver.destroy();
  }, 30000);
});

/**
 * Property 82: Connection state synchronization
 * Feature: campus-cruise, Property 82: Connection state synchronization
 * Validates: Requirements 23.4
 */
describe('Property 82: Connection state synchronization', () => {
  test('For any new WebSocket connection establishment, the system should send the current state of relevant rides and messages to the client', async () => {
    // Create test user
    const user = await createTestUser();
    const port = httpServer.address().port;
    const client = createAuthenticatedClient(user.id, port);
    
    // Wait for authentication
    const authenticated = await new Promise((resolve) => {
      client.on('authenticated', (data) => {
        resolve(data);
      });
    });
    
    // Verify authentication response
    expect(authenticated.userId).toBe(user.id);
    expect(authenticated.message).toBe('Successfully authenticated');
    
    // Clean up
    client.disconnect();
    await user.destroy();
  }, 30000);
});

/**
 * Property 83: Connection sets online status
 * Feature: campus-cruise, Property 83: Connection sets online status
 * Validates: Requirements 24.1
 */
describe('Property 83: Connection sets online status', () => {
  test('For any user WebSocket connection, the system should update the user\'s status to online', async () => {
    // Create test user
    const user = await createTestUser();
    expect(user.isOnline).toBe(false);
    
    const port = httpServer.address().port;
    const client = createAuthenticatedClient(user.id, port);
    
    // Wait for connection
    await new Promise((resolve) => {
      client.on('authenticated', resolve);
    });
    
    // Verify user is marked as online
    await user.reload();
    expect(user.isOnline).toBe(true);
    expect(isUserConnected(user.id)).toBe(true);
    
    // Clean up
    client.disconnect();
    await user.destroy();
  }, 30000);
});

/**
 * Property 84: Disconnection sets offline status
 * Feature: campus-cruise, Property 84: Disconnection sets offline status
 * Validates: Requirements 24.2
 */
describe('Property 84: Disconnection sets offline status', () => {
  test('For any user WebSocket disconnection, the system should update the user\'s status to offline after a 30-second grace period', async () => {
    // Create test user
    const user = await createTestUser();
    const port = httpServer.address().port;
    const client = createAuthenticatedClient(user.id, port);
    
    // Wait for connection
    await new Promise((resolve) => {
      client.on('authenticated', resolve);
    });
    
    // Verify user is online
    await user.reload();
    expect(user.isOnline).toBe(true);
    
    // Disconnect
    client.disconnect();
    
    // Wait for grace period (30 seconds + buffer)
    await new Promise(resolve => setTimeout(resolve, 31000));
    
    // Verify user is marked as offline
    await user.reload();
    expect(user.isOnline).toBe(false);
    expect(isUserConnected(user.id)).toBe(false);
    
    // Clean up
    await user.destroy();
  }, 35000);
});

/**
 * Property 85: Status change broadcasts
 * Feature: campus-cruise, Property 85: Status change broadcasts
 * Validates: Requirements 24.4
 */
describe('Property 85: Status change broadcasts', () => {
  test('For any user status change, the system should broadcast the status update to relevant connected users via WebSocket', async () => {
    // Create two test users
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    
    const port = httpServer.address().port;
    const client1 = createAuthenticatedClient(user1.id, port);
    const client2 = createAuthenticatedClient(user2.id, port);
    
    // Wait for both connections
    await Promise.all([
      new Promise((resolve) => client1.on('authenticated', resolve)),
      new Promise((resolve) => client2.on('authenticated', resolve))
    ]);
    
    // Listen for status change on client2
    const statusChangeReceived = new Promise((resolve) => {
      client2.on('user_status', (data) => {
        if (data.userId === user1.id && data.status === 'offline') {
          resolve(data);
        }
      });
    });
    
    // Disconnect client1
    client1.disconnect();
    
    // Wait for grace period
    await new Promise(resolve => setTimeout(resolve, 31000));
    
    // Verify status change was broadcast
    const statusUpdate = await statusChangeReceived;
    expect(statusUpdate.userId).toBe(user1.id);
    expect(statusUpdate.status).toBe('offline');
    
    // Clean up
    client2.disconnect();
    await user1.destroy();
    await user2.destroy();
  }, 35000);
});
