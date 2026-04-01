import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import Navbar from '../components/Navbar';
import './CreateRidePage.css';

function CreateRidePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    departureTime: '',
    totalSeats: '',
    pricePerSeat: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const steps = [
    { number: 1, title: 'Route', icon: '🗺️', desc: 'Where are you going?' },
    { number: 2, title: 'Schedule', icon: '📅', desc: 'When are you leaving?' },
    { number: 3, title: 'Details', icon: '💺', desc: 'Seats and pricing' },
    { number: 4, title: 'Review', icon: '✓', desc: 'Confirm your ride' }
  ];

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.source.trim()) {
        newErrors.source = 'Pickup location is required';
      }
      if (!formData.destination.trim()) {
        newErrors.destination = 'Destination is required';
      }
      if (formData.source.trim() && formData.destination.trim() && 
          formData.source.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
        newErrors.destination = 'Destination must be different from pickup location';
      }
    }

    if (step === 2) {
      if (!formData.departureTime) {
        newErrors.departureTime = 'Departure time is required';
      } else {
        const departureDate = new Date(formData.departureTime);
        const now = new Date();
        if (departureDate <= now) {
          newErrors.departureTime = 'Departure time must be in the future';
        }
      }
    }

    if (step === 3) {
      if (!formData.totalSeats) {
        newErrors.totalSeats = 'Number of seats is required';
      } else {
        const seats = parseInt(formData.totalSeats);
        if (isNaN(seats) || seats < 1) {
          newErrors.totalSeats = 'Please enter a valid number of seats (minimum 1)';
        } else if (seats > 10) {
          newErrors.totalSeats = 'Maximum 10 seats allowed';
        }
      }

      if (!formData.pricePerSeat) {
        newErrors.pricePerSeat = 'Price per seat is required';
      } else {
        const price = parseFloat(formData.pricePerSeat);
        if (isNaN(price) || price < 0) {
          newErrors.pricePerSeat = 'Please enter a valid price';
        } else if (price > 1000) {
          newErrors.pricePerSeat = 'Maximum price is $1000';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setApiError(null);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setApiError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);
      setApiError(null);
      
      const response = await axios.post('/api/rides', {
        source: formData.source.trim(),
        destination: formData.destination.trim(),
        departureTime: formData.departureTime,
        totalSeats: parseInt(formData.totalSeats),
        availableSeats: parseInt(formData.totalSeats),
        pricePerSeat: parseFloat(formData.pricePerSeat)
      });

      let rideId = null;
      if (response.data) {
        if (response.data.data?.id) {
          rideId = response.data.data.id;
        } else if (response.data.id) {
          rideId = response.data.id;
        } else if (response.data.data?.ride?.id) {
          rideId = response.data.data.ride.id;
        } else if (response.data.ride?.id) {
          rideId = response.data.ride.id;
        }
      }

      if (rideId) {
        navigate(`/rides/${rideId}`);
      } else {
        navigate('/rides');
      }
    } catch (err) {
      console.error('Error creating ride:', err);
      setApiError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to create ride. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTotalEarnings = () => {
    const seats = parseInt(formData.totalSeats) || 0;
    const price = parseFloat(formData.pricePerSeat) || 0;
    return (seats * price).toFixed(2);
  };

  return (
    <div className="create-ride-page">
      <Navbar />
      
      <div className="page-container">
        {/* Hero Section */}
        <div className="page-hero-create">
          <div className="hero-content-create">
            <h1 className="hero-title-create">
              <span className="title-gradient">Create Your Ride</span>
            </h1>
            <p className="hero-subtitle-create">
              Share your journey and earn while helping your community
            </p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-icon-hero">🌱</span>
              <div>
                <div className="stat-value-hero">2.3kg</div>
                <div className="stat-label-hero">CO₂ Saved</div>
              </div>
            </div>
            <div className="hero-stat">
              <span className="stat-icon-hero">💰</span>
              <div>
                <div className="stat-value-hero">${getTotalEarnings()}</div>
                <div className="stat-label-hero">Potential Earnings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="progress-container">
          <div className="progress-steps">
            {steps.map((step, index) => (
              <div key={step.number} className="step-wrapper">
                <div 
                  className={`step-item ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
                  onClick={() => currentStep > step.number && setCurrentStep(step.number)}
                >
                  <div className="step-circle">
                    {currentStep > step.number ? (
                      <span className="step-check">✓</span>
                    ) : (
                      <span className="step-icon">{step.icon}</span>
                    )}
                  </div>
                  <div className="step-info">
                    <div className="step-title">{step.title}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${currentStep > step.number ? 'completed' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="form-container-wizard">
          {apiError && (
            <div className="alert-error">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <div className="alert-title">Error</div>
                <div className="alert-message">{apiError}</div>
              </div>
            </div>
          )}

          {/* Step 1: Route */}
          {currentStep === 1 && (
            <div className="step-content">
              <div className="step-header">
                <h2 className="step-heading">
                  <span className="heading-icon">🗺️</span>
                  Plan Your Route
                </h2>
                <p className="step-subheading">Tell us where you're starting and where you're headed</p>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="source" className="field-label">
                    <span className="label-icon-field">📍</span>
                    <span>Pickup Location</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="input-wrapper-field">
                    <input
                      type="text"
                      id="source"
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Campus Gate, Student Center"
                      className={`field-input ${errors.source ? 'error' : ''}`}
                      autoComplete="off"
                    />
                  </div>
                  {errors.source && (
                    <span className="field-error-msg">
                      <span className="error-icon">⚠️</span>
                      {errors.source}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="destination" className="field-label">
                    <span className="label-icon-field">🎯</span>
                    <span>Destination</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="input-wrapper-field">
                    <input
                      type="text"
                      id="destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      placeholder="e.g., Downtown Mall, Airport"
                      className={`field-input ${errors.destination ? 'error' : ''}`}
                      autoComplete="off"
                    />
                  </div>
                  {errors.destination && (
                    <span className="field-error-msg">
                      <span className="error-icon">⚠️</span>
                      {errors.destination}
                    </span>
                  )}
                </div>
              </div>

              <div className="info-box">
                <span className="info-icon">💡</span>
                <div className="info-text">
                  <strong>Tip:</strong> Be specific with locations to help passengers find you easily
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="step-header">
                <h2 className="step-heading">
                  <span className="heading-icon">📅</span>
                  Set Your Schedule
                </h2>
                <p className="step-subheading">When do you plan to depart?</p>
              </div>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="departureTime" className="field-label">
                    <span className="label-icon-field">🕐</span>
                    <span>Departure Date & Time</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="input-wrapper-field">
                    <input
                      type="datetime-local"
                      id="departureTime"
                      name="departureTime"
                      value={formData.departureTime}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                      className={`field-input ${errors.departureTime ? 'error' : ''}`}
                    />
                  </div>
                  {errors.departureTime && (
                    <span className="field-error-msg">
                      <span className="error-icon">⚠️</span>
                      {errors.departureTime}
                    </span>
                  )}
                </div>
              </div>

              {formData.departureTime && !errors.departureTime && (
                <div className="preview-box">
                  <span className="preview-icon">📅</span>
                  <div className="preview-content">
                    <div className="preview-label">Your ride departs on:</div>
                    <div className="preview-value">{formatDateTime(formData.departureTime)}</div>
                  </div>
                </div>
              )}

              <div className="info-box">
                <span className="info-icon">💡</span>
                <div className="info-text">
                  <strong>Tip:</strong> Set your departure time at least 2 hours in advance to give passengers time to book
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="step-content">
              <div className="step-header">
                <h2 className="step-heading">
                  <span className="heading-icon">💺</span>
                  Ride Details
                </h2>
                <p className="step-subheading">How many seats are available and what's your price?</p>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="totalSeats" className="field-label">
                    <span className="label-icon-field">💺</span>
                    <span>Available Seats</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="input-wrapper-field">
                    <input
                      type="number"
                      id="totalSeats"
                      name="totalSeats"
                      value={formData.totalSeats}
                      onChange={handleInputChange}
                      placeholder="e.g., 3"
                      min="1"
                      max="10"
                      className={`field-input ${errors.totalSeats ? 'error' : ''}`}
                      inputMode="numeric"
                    />
                  </div>
                  {errors.totalSeats && (
                    <span className="field-error-msg">
                      <span className="error-icon">⚠️</span>
                      {errors.totalSeats}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="pricePerSeat" className="field-label">
                    <span className="label-icon-field">💰</span>
                    <span>Price per Seat</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="input-wrapper-field price-input">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      id="pricePerSeat"
                      name="pricePerSeat"
                      value={formData.pricePerSeat}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      max="1000"
                      className={`field-input with-symbol ${errors.pricePerSeat ? 'error' : ''}`}
                      inputMode="decimal"
                    />
                  </div>
                  {errors.pricePerSeat && (
                    <span className="field-error-msg">
                      <span className="error-icon">⚠️</span>
                      {errors.pricePerSeat}
                    </span>
                  )}
                </div>
              </div>

              {formData.totalSeats && formData.pricePerSeat && !errors.totalSeats && !errors.pricePerSeat && (
                <div className="earnings-card">
                  <div className="earnings-header">
                    <span className="earnings-icon">💰</span>
                    <span className="earnings-title">Potential Earnings</span>
                  </div>
                  <div className="earnings-breakdown">
                    <div className="breakdown-item">
                      <span className="breakdown-label">{formData.totalSeats} seats × ${formData.pricePerSeat}</span>
                      <span className="breakdown-value">${getTotalEarnings()}</span>
                    </div>
                  </div>
                  <div className="earnings-total">
                    <span className="total-label">Total Earnings</span>
                    <span className="total-value">${getTotalEarnings()}</span>
                  </div>
                </div>
              )}

              <div className="info-box">
                <span className="info-icon">💡</span>
                <div className="info-text">
                  <strong>Tip:</strong> Fair pricing helps fill seats faster. Consider gas costs and distance
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="step-content">
              <div className="step-header">
                <h2 className="step-heading">
                  <span className="heading-icon">✓</span>
                  Review Your Ride
                </h2>
                <p className="step-subheading">Make sure everything looks good before publishing</p>
              </div>

              <div className="review-card">
                <div className="review-section">
                  <div className="review-label">
                    <span className="review-icon">🗺️</span>
                    Route
                  </div>
                  <div className="review-route">
                    <div className="review-point">
                      <span className="point-marker">📍</span>
                      <span className="point-text">{formData.source}</span>
                    </div>
                    <div className="route-arrow-review">→</div>
                    <div className="review-point">
                      <span className="point-marker">🎯</span>
                      <span className="point-text">{formData.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="review-divider"></div>

                <div className="review-section">
                  <div className="review-label">
                    <span className="review-icon">📅</span>
                    Departure
                  </div>
                  <div className="review-value">{formatDateTime(formData.departureTime)}</div>
                </div>

                <div className="review-divider"></div>

                <div className="review-grid">
                  <div className="review-section">
                    <div className="review-label">
                      <span className="review-icon">💺</span>
                      Seats
                    </div>
                    <div className="review-value">{formData.totalSeats} available</div>
                  </div>

                  <div className="review-section">
                    <div className="review-label">
                      <span className="review-icon">💰</span>
                      Price
                    </div>
                    <div className="review-value">${formData.pricePerSeat} per seat</div>
                  </div>
                </div>

                <div className="review-divider"></div>

                <div className="review-total">
                  <span className="total-label-review">Total Potential Earnings</span>
                  <span className="total-value-review">${getTotalEarnings()}</span>
                </div>
              </div>

              <div className="success-box">
                <span className="success-icon">🎉</span>
                <div className="success-text">
                  <strong>Ready to go!</strong> Your ride will be visible to all students once published
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn-nav btn-back"
                onClick={handleBack}
                disabled={loading}
              >
                <span className="btn-arrow">←</span>
                <span>Back</span>
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                className="btn-nav btn-next"
                onClick={handleNext}
              >
                <span>Continue</span>
                <span className="btn-arrow">→</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-nav btn-publish"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-btn"></span>
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Publish Ride</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              className="btn-nav btn-cancel-nav"
              onClick={() => navigate('/rides')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateRidePage;
