import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import './AuthPages.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', formData);
      
      // Handle different response structures
      let userData = null;
      let token = null;

      if (response.data.data) {
        userData = response.data.data.user;
        token = response.data.data.token;
      } else {
        userData = response.data.user;
        token = response.data.token;
      }

      if (!userData || !token) {
        throw new Error('Invalid response from server');
      }

      // Use AuthContext to manage authentication state
      login(userData, token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-layout">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <Link to="/" className="brand-logo">
              <span className="brand-icon">🚗</span>
              <span className="brand-name">Campus Cruise</span>
            </Link>
            
            <h2 className="branding-title">Welcome Back!</h2>
            <p className="branding-subtitle">
              Continue your journey with Campus Cruise. Connect with fellow students and share rides.
            </p>

            <div className="branding-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Verified student community</span>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Save up to 70% on travel</span>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Real-time ride tracking</span>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Secure in-app messaging</span>
              </div>
            </div>

            <div className="branding-stats">
              <div className="stat-mini">
                <div className="stat-mini-value">10K+</div>
                <div className="stat-mini-label">Students</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-value">50K+</div>
                <div className="stat-mini-label">Rides</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-value">4.9★</div>
                <div className="stat-mini-label">Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="form-header">
              <h1>Sign In</h1>
              <p>Enter your credentials to access your account</p>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@college.edu"
                  autoComplete="email"
                  inputMode="email"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="social-login">
              <button className="btn-social" disabled>
                <span className="social-icon">🎓</span>
                Google (.edu)
              </button>
            </div>

            <p className="auth-footer">
              Don't have an account? <Link to="/signup">Create one now</Link>
            </p>

            <p className="auth-terms">
              By signing in, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
