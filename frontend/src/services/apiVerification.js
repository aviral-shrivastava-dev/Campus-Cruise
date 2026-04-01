/**
 * API Service Verification Script
 * 
 * This script verifies that the API service layer is properly configured.
 * Run this in the browser console to check API setup.
 * 
 * Usage:
 * 1. Open browser DevTools Console
 * 2. Import and run: import { verifyAPISetup } from './services/apiVerification'
 * 3. Call: verifyAPISetup()
 */

import api from './api';
import axios from '../utils/axios';

/**
 * Verify API service configuration
 */
export function verifyAPISetup() {
  console.log('🔍 Verifying API Service Setup...\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Check 1: Axios configuration
  console.log('✓ Checking Axios configuration...');
  if (axios.defaults.baseURL) {
    console.log(`  ✅ Base URL configured: ${axios.defaults.baseURL}`);
    results.passed++;
  } else {
    console.log('  ❌ Base URL not configured');
    results.failed++;
  }

  // Check 2: Request interceptor
  console.log('\n✓ Checking request interceptor...');
  if (axios.interceptors.request.handlers.length > 0) {
    console.log('  ✅ Request interceptor configured (JWT token injection)');
    results.passed++;
  } else {
    console.log('  ⚠️  No request interceptor found');
    results.warnings++;
  }

  // Check 3: Response interceptor
  console.log('\n✓ Checking response interceptor...');
  if (axios.interceptors.response.handlers.length > 0) {
    console.log('  ✅ Response interceptor configured (error handling)');
    results.passed++;
  } else {
    console.log('  ⚠️  No response interceptor found');
    results.warnings++;
  }

  // Check 4: API modules
  console.log('\n✓ Checking API modules...');
  const modules = ['auth', 'user', 'ride', 'booking', 'message', 'review', 'location'];
  modules.forEach(module => {
    if (api[module]) {
      console.log(`  ✅ ${module} API module exists`);
      results.passed++;
    } else {
      console.log(`  ❌ ${module} API module missing`);
      results.failed++;
    }
  });

  // Check 5: Auth API methods
  console.log('\n✓ Checking Auth API methods...');
  const authMethods = ['register', 'login', 'logout', 'getCurrentUser'];
  authMethods.forEach(method => {
    if (typeof api.auth[method] === 'function') {
      console.log(`  ✅ auth.${method}() exists`);
      results.passed++;
    } else {
      console.log(`  ❌ auth.${method}() missing`);
      results.failed++;
    }
  });

  // Check 6: User API methods
  console.log('\n✓ Checking User API methods...');
  const userMethods = ['getUser', 'updateProfile', 'getUserRides', 'getUserBookings', 'getUserReviews', 'getRideHistory'];
  userMethods.forEach(method => {
    if (typeof api.user[method] === 'function') {
      console.log(`  ✅ user.${method}() exists`);
      results.passed++;
    } else {
      console.log(`  ❌ user.${method}() missing`);
      results.failed++;
    }
  });

  // Check 7: Ride API methods
  console.log('\n✓ Checking Ride API methods...');
  const rideMethods = ['createRide', 'getRides', 'getRide', 'updateRide', 'cancelRide', 'searchRides'];
  rideMethods.forEach(method => {
    if (typeof api.ride[method] === 'function') {
      console.log(`  ✅ ride.${method}() exists`);
      results.passed++;
    } else {
      console.log(`  ❌ ride.${method}() missing`);
      results.failed++;
    }
  });

  // Check 8: Booking API methods
  console.log('\n✓ Checking Booking API methods...');
  const bookingMethods = ['createBooking', 'getBooking', 'cancelBooking', 'getRideBookings'];
  bookingMethods.forEach(method => {
    if (typeof api.booking[method] === 'function') {
      console.log(`  ✅ booking.${method}() exists`);
      results.passed++;
    } else {
      console.log(`  ❌ booking.${method}() missing`);
      results.failed++;
    }
  });

  // Check 9: Message API methods
  console.log('\n✓ Checking Message API methods...');
  const messageMethods = ['sendMessage', 'getConversation', 'getRideMessages', 'markAsRead'];
  messageMethods.forEach(method => {
    if (typeof api.message[method] === 'function') {
      console.log(`  ✅ message.${method}() exists`);
      results.passed++;
    } else {
      console.log(`  ❌ message.${method}() missing`);
      results.failed++;
    }
  });

  // Check 10: Review API methods
  console.log('\n✓ Checking Review API methods...');
  const reviewMethods = ['createReview', 'getDriverReviews', 'getRideReviews'];
  reviewMethods.forEach(method => {
    if (typeof api.review[method] === 'function') {
      console.log(`  ✅ review.${method}() exists`);
      results.passed++;
    } else {
      console.log(`  ❌ review.${method}() missing`);
      results.failed++;
    }
  });

  // Check 11: Location API methods
  console.log('\n✓ Checking Location API methods...');
  const locationMethods = ['startRide', 'updateLocation', 'stopRide', 'getRideLocation'];
  locationMethods.forEach(method => {
    if (typeof api.location[method] === 'function') {
      console.log(`  ✅ location.${method}() exists`);
      results.passed++;
    } else {
      console.log(`  ❌ location.${method}() missing`);
      results.failed++;
    }
  });

  // Check 12: Environment variables
  console.log('\n✓ Checking environment variables...');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;
  
  if (apiBaseUrl) {
    console.log(`  ✅ VITE_API_BASE_URL: ${apiBaseUrl}`);
    results.passed++;
  } else {
    console.log('  ⚠️  VITE_API_BASE_URL not set (using default)');
    results.warnings++;
  }

  if (wsUrl) {
    console.log(`  ✅ VITE_WS_URL: ${wsUrl}`);
    results.passed++;
  } else {
    console.log('  ⚠️  VITE_WS_URL not set (using default)');
    results.warnings++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Verification Summary:');
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  ⚠️  Warnings: ${results.warnings}`);
  console.log('='.repeat(50));

  if (results.failed === 0) {
    console.log('\n✨ All checks passed! API service is properly configured.');
    return true;
  } else {
    console.log('\n⚠️  Some checks failed. Please review the errors above.');
    return false;
  }
}

/**
 * Test API connectivity (requires backend to be running)
 */
export async function testAPIConnectivity() {
  console.log('🔌 Testing API connectivity...\n');

  try {
    // Try to reach the backend
    const response = await axios.get('/api/health');
    console.log('✅ Backend is reachable');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Cannot reach backend');
    console.log('Error:', error.message);
    console.log('\nMake sure the backend server is running on:', axios.defaults.baseURL);
    return false;
  }
}

/**
 * Run all verifications
 */
export async function runAllVerifications() {
  console.log('🚀 Running all API verifications...\n');
  
  const setupOk = verifyAPISetup();
  console.log('\n');
  
  const connectivityOk = await testAPIConnectivity();
  
  console.log('\n' + '='.repeat(50));
  if (setupOk && connectivityOk) {
    console.log('✅ All verifications passed! Ready to use API.');
  } else {
    console.log('⚠️  Some verifications failed. Check the logs above.');
  }
  console.log('='.repeat(50));
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.verifyAPI = {
    setup: verifyAPISetup,
    connectivity: testAPIConnectivity,
    all: runAllVerifications
  };
  
  console.log('💡 API Verification tools loaded!');
  console.log('   Run: verifyAPI.setup() - Check API configuration');
  console.log('   Run: verifyAPI.connectivity() - Test backend connection');
  console.log('   Run: verifyAPI.all() - Run all checks');
}

export default {
  verifyAPISetup,
  testAPIConnectivity,
  runAllVerifications
};
