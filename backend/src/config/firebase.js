require('dotenv').config();
const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Skip Firebase initialization in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('Skipping Firebase initialization in test environment');
    return null;
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log('Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    return null;
  }
};

const getFirebaseDatabase = () => {
  // In test environment, return mock database
  if (process.env.NODE_ENV === 'test') {
    return admin.database();
  }
  
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp ? admin.database() : null;
};

module.exports = {
  initializeFirebase,
  getFirebaseDatabase
};
