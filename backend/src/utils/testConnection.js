require('dotenv').config();
const db = require('../models');
const { initializeFirebase } = require('../config/firebase');

/**
 * Test database and Firebase connections
 */
const testConnections = async () => {
  console.log('Testing connections...\n');

  // Test MySQL connection
  try {
    await db.sequelize.authenticate();
    console.log('✓ MySQL database connection successful');
    console.log(`  Database: ${db.sequelize.config.database}`);
    console.log(`  Host: ${db.sequelize.config.host}:${db.sequelize.config.port}`);
  } catch (error) {
    console.error('✗ MySQL database connection failed:', error.message);
  }

  // Test Firebase connection
  try {
    const firebase = initializeFirebase();
    if (firebase) {
      console.log('✓ Firebase initialization successful');
      console.log(`  Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    } else {
      console.log('✗ Firebase initialization failed (check credentials)');
    }
  } catch (error) {
    console.error('✗ Firebase initialization error:', error.message);
  }

  console.log('\nConnection test complete.');
  process.exit(0);
};

testConnections();
