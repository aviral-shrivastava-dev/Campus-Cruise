import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import AvailableRidesPage from './pages/AvailableRidesPage';
import CreateRidePage from './pages/CreateRidePage';
import RideDetailsPage from './pages/RideDetailsPage';
import MyRidesPage from './pages/MyRidesPage';
import UserProfile from './pages/UserProfile';
import RideHistory from './pages/RideHistory';
import ChatPage from './pages/ChatPage';
import WalletPage from './pages/WalletPage';
import PaymentPage from './pages/PaymentPage';
import SplitPaymentPage from './pages/SplitPaymentPage';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <WebSocketProvider>
            <Router>
              <Toast />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/rides" 
                  element={
                    <ProtectedRoute>
                      <AvailableRidesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/rides/create" 
                  element={
                    <ProtectedRoute>
                      <CreateRidePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/rides/:id" 
                  element={
                    <ProtectedRoute>
                      <RideDetailsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-rides" 
                  element={
                    <ProtectedRoute>
                      <MyRidesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <ProtectedRoute>
                      <RideHistory />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wallet" 
                  element={
                    <ProtectedRoute>
                      <WalletPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/payment/:bookingId" 
                  element={
                    <ProtectedRoute>
                      <PaymentPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/split-payment/:rideId" 
                  element={
                    <ProtectedRoute>
                      <SplitPaymentPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Router>
          </WebSocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
