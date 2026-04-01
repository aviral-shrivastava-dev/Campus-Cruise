require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { ApolloServer } = require('apollo-server-express');
const db = require('./models');
const { initializeFirebase } = require('./config/firebase');
const { initializeSocket } = require('./socket');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const context = require('./graphql/context');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { logger, logInfo, logError } = require('./utils/logger');
const { startBookingCleanup } = require('./utils/scheduler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize socket handlers
initializeSocket(io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Campus Cruise API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/rides', require('./routes/location.routes'));
app.use('/api/rides', require('./routes/ride.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/wallet', require('./routes/wallet.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

// 404 handler - must come after all routes
app.use(notFoundHandler);

// Global error handling middleware - must be last
app.use(errorHandler);

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logInfo('Database connection established successfully');

    // Initialize Firebase
    initializeFirebase();

    // Database migrations are handled via sequelize-cli
    // No need to sync in development
    logInfo('Using database migrations (run: npx sequelize-cli db:migrate)');

    // Initialize Apollo Server
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      context,
      formatError: (error) => {
        logError(error, { source: 'GraphQL' });
        return error;
      }
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app, path: '/graphql' });

    logInfo('GraphQL endpoint available at /graphql');

    // Start booking cleanup scheduler
    startBookingCleanup();
    logInfo('Booking cleanup scheduler started');

    // Start server
    server.listen(PORT, () => {
      logInfo(`Server running on port ${PORT}`);
      logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logError(error, { context: 'Server startup failed' });
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
