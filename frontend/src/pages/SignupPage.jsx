import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import './AuthPages.css';

function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    phone: '',
    role: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      role: checked 
        ? [...prev.role, value]
        : prev.role.filter(r => r !== value)
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.college.trim()) {
      setError('College name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (formData.role.length === 0) {
      setError('Please select at least one role');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep3()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await axios.post('/api/auth/register', registrationData);
      
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
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
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
            
            <h2 className="branding-title">Join Campus Cruise</h2>
            <p className="branding-subtitle">
              Start your carpooling journey today. Save money, make friends, and reduce your carbon footprint.
            </p>

            <div className="signup-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">💰</div>
                <div className="benefit-content">
                  <h3>Save Money</h3>
                  <p>Cut travel costs by up to 70%</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🤝</div>
                <div className="benefit-content">
                  <h3>Build Community</h3>
                  <p>Connect with fellow students</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🌱</div>
                <div className="benefit-content">
                  <h3>Go Green</h3>
                  <p>Reduce your carbon footprint</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🔒</div>
                <div className="benefit-content">
                  <h3>Stay Safe</h3>
                  <p>Verified student community</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="form-header">
              <h1>Create Account</h1>
              <p>Step {step} of 3 - Let's get you started</p>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar">
              <div className="progress-step-container">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
              </div>
              <div className="progress-line">
                <div className="progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
              </div>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="name">
                      <span className="label-icon">👤</span>
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      autoComplete="name"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      <span className="label-icon">📧</span>
                      College Email
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
                    <span className="input-hint">Use your .edu email for verification</span>
                  </div>

                  <button type="button" className="btn-submit" onClick={handleNext}>
                    Continue
                  </button>
                </div>
              )}

              {/* Step 2: College & Role */}
              {step === 2 && (
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="college">
                      <span className="label-icon">🎓</span>
                      College/University
                    </label>
                    <input
                      type="text"
                      id="college"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      required
                      placeholder="Your College Name"
                      autoComplete="organization"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">
                      <span className="label-icon">📱</span>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="(555) 123-4567"
                      autoComplete="tel"
                      inputMode="tel"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <span className="label-icon">🚗</span>
                      I want to:
                    </label>
                    <div className="role-selection">
                      <label className="role-card">
                        <input
                          type="checkbox"
                          name="role"
                          value="driver"
                          checked={formData.role.includes('driver')}
                          onChange={handleRoleChange}
                        />
                        <div className="role-content">
                          <span className="role-icon">🚗</span>
                          <span className="role-title">Offer Rides</span>
                          <span className="role-desc">Share your car and earn</span>
                        </div>
                      </label>
                      <label className="role-card">
                        <input
                          type="checkbox"
                          name="role"
                          value="passenger"
                          checked={formData.role.includes('passenger')}
                          onChange={handleRoleChange}
                        />
                        <div className="role-content">
                          <span className="role-icon">👤</span>
                          <span className="role-title">Find Rides</span>
                          <span className="role-desc">Travel affordably</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-back" onClick={handleBack}>
                      Back
                    </button>
                    <button type="button" className="btn-submit" onClick={handleNext}>
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Password */}
              {step === 3 && (
                <div className="form-step">
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
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        className="form-input"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    <div className="password-strength">
                      <div className="strength-bars">
                        <div className={`strength-bar ${formData.password.length >= 4 ? 'active' : ''}`}></div>
                        <div className={`strength-bar ${formData.password.length >= 8 ? 'active' : ''}`}></div>
                        <div className={`strength-bar ${formData.password.length >= 12 ? 'active' : ''}`}></div>
                      </div>
                      <span className="strength-label">
                        {formData.password.length < 4 ? 'Weak' : formData.password.length < 8 ? 'Fair' : formData.password.length < 12 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      <span className="label-icon">🔒</span>
                      Confirm Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        className="form-input"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-back" onClick={handleBack}>
                      Back
                    </button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-small"></span>
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>

            <p className="auth-terms">
              By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
