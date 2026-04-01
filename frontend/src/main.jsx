import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './utils/axios'; // Configure axios defaults and interceptors

// Load API verification tools in development mode
if (import.meta.env.DEV) {
  import('./services/apiVerification').then(module => {
    console.log('🔧 Development mode: API verification tools loaded');
    console.log('   Run verifyAPI.setup() to check API configuration');
    console.log('   Run verifyAPI.connectivity() to test backend connection');
    console.log('   Run verifyAPI.all() to run all checks');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
