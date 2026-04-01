import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Higher-Order Component for route protection
 * Checks if user is authenticated via AuthContext
 * Redirects to login page if not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated, render the protected component
  return children;
}

export default ProtectedRoute;
