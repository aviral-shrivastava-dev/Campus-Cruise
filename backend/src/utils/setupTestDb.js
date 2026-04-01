const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupTestDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    // Create test database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS campus_cruise_test');
    console.log('Test database created or already exists');
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

setupTestDatabase();
