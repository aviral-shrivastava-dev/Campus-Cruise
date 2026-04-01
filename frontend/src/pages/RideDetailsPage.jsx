import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import Navbar from '../components/Navbar';
import ReviewForm from '../components/ReviewForm';
import DriverRatings from '../components/DriverRatings';
import MapView from '../components/MapView';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './RideDetailsPage.css';

function RideDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, off } = useWebSocket();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [userBooking, setUserBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    fetchRideDetails();
    checkUserReview();
  }, [id]);

  useEffect(() => {
    if (!ride || !on || !off) return;

    const handleLocationUpdate = (data) => {
      if (data.rideId === id) {
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp
        });
      }
    };

    const handleSeatChange = (data) => {
      if (data.rideId === id) {
        console.log('Seat change received:', data);
        setRide(prevRide => ({
          ...prevRide,
          availableSeats: data.availableSeats
        }));
      }
    };

    on('location_update', handleLocationUpdate);
    on('seat_change', handleSeatChange);
    
    return () => {
      off('location_update', handleLocationUpdate);
      off('seat_change', handleSeatChange);
    };
  }, [ride, id, on, off]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/rides/${id}`);
      
      let rideData = null;
      if (response.data) {
        if (response.data.data) {
          rideData = response.data.data;
        } else if (response.data.ride) {
          rideData = response.data.ride;
        } else {
          rideData = response.data;
        }
      }

      if (!rideData) {
        throw new Error('Invalid response structure');
      }

      setRide(rideData);

      if (rideData.bookings && user) {
        const existingBooking = rideData.bookings.find(
          booking => {
            const passengerId = booking.passengerId || booking.passenger?.id;
            const bookingStatus = booking.status?.toLowerCase();
            return passengerId === user.id && bookingStatus === 'confirmed';
          }
        );
        setUserBooking(existingBooking);
      }
    } catch (err) {
      console.error('Error fetching ride details:', err);
      setError('Failed to load ride details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    if (!user || !ride) return;
    
    try {
      const response = await axios.get(`/api/reviews/driver/${ride.driverId || ride.driver?.id}`);
      const reviews = response.data.data?.reviews || response.data.reviews || [];
      const existingReview = reviews.find(review => 
        review.rideId === id && (review.reviewerId === user.id || review.reviewer?.id === user.id)
      );
      setUserReview(existingReview);
    } catch (err) {
      console.error('Error checking user review:', err);
    }
  };

  const handleReviewSubmitted = (review) => {
    setUserReview(review);
    setShowReviewForm(false);
  };

  const handleBookRide = async () => {
    try {
      setBookingLoading(true);
      setBookingError(null);
      setBookingSuccess(false);
      setCancelSuccess(false);
      
      const response = await axios.post('/api/bookings', { rideId: id });

      let bookingData = null;
      if (response.data) {
        if (response.data.data) {
          bookingData = response.data.data;
        } else if (response.data.booking) {
          bookingData = response.data.booking;
        } else {
          bookingData = response.data;
        }
      }

      if (bookingData?.id && ride.pricePerSeat > 0) {
        setBookingSuccess(true);
        setUserBooking(bookingData);
        
        setTimeout(() => {
          navigate(`/payment/${bookingData.id}`);
        }, 800);
      } else {
        setBookingSuccess(true);
        setUserBooking(bookingData);
        await fetchRideDetails();
        setTimeout(() => setBookingSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error booking ride:', err);
      setBookingError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to book ride. Please try again.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!userBooking) return;
    
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancelLoading(true);
      setCancelError(null);
      setCancelSuccess(false);
      
      await axios.delete(`/api/bookings/${userBooking.id}`);

      setUserBooking(null);
      setCancelSuccess(true);
      setBookingSuccess(false);
      await fetchRideDetails();
      
      setTimeout(() => setCancelSuccess(false), 3000);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setCancelError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to cancel booking. Please try again.'
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntilDeparture = () => {
    if (!ride) return null;
    const now = new Date();
    const departure = new Date(ride.departureTime);
    const diff = departure - now;
    
    if (diff < 0) return 'Departed';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Departing soon';
  };

  const isDriver = user && ride && (ride.driverId === user.id || ride.driver?.id === user.id);
  const hasConfirmedBooking = userBooking && userBooking.status?.toLowerCase() === 'confirmed';
  const canBook = !isDriver && !hasConfirmedBooking && ride?.availableSeats > 0 && ride?.status === 'active';

  if (loading) {
    return (
      <div className="ride-details-page">
        <Navbar />
        <div className="page-container">
          <LoadingSpinner size="large" message="Loading ride details..." />
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="ride-details-page">
        <Navbar />
        <div className="page-container">
          <ErrorMessage 
            message={error || 'Ride not found'}
            type="error"
            onRetry={fetchRideDetails}
          />
          <button className="btn-back" onClick={() => navigate('/rides')}>
            Back to Rides
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ride-details-page">
      <Navbar />
      
      <div className="page-container">
        <button className="back-button" onClick={() => navigate('/rides')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back to Rides</span>
        </button>

        <div className="hero-section">
          <div className="hero-main">
            <div className="status-badge" data-status={ride.status}>
              <span className="status-indicator"></span>
              <span className="status-text">{ride.status}</span>
            </div>
            
            <div className="route-display">
              <div className="route-endpoint">
                <div className="endpoint-icon start">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                  </svg>
                </div>
                <div className="endpoint-details">
                  <span className="endpoint-label">From</span>
                  <h1 className="endpoint-location">{ride.source}</h1>
                </div>
              </div>

              <div className="route-connector">
                <div className="connector-line"></div>
                <svg className="connector-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="route-endpoint">
                <div className="endpoint-icon end">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="endpoint-details">
                  <span className="endpoint-label">To</span>
                  <h1 className="endpoint-location">{ride.destination}</h1>
                </div>
              </div>
            </div>

            <div className="trip-metadata">
              <div className="metadata-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M13 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>{formatDate(ride.departureTime)}</span>
              </div>
              <div className="metadata-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 5V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>{formatTime(ride.departureTime)}</span>
              </div>
              <div className="metadata-item highlight">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 6V10L13 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>{getTimeUntilDeparture()}</span>
              </div>
            </div>
          </div>

          <div className="hero-sidebar">
            <div className="pricing-card">
              <div className="pricing-header">
                <span className="pricing-label">Price per seat</span>
              </div>
              <div className="pricing-amount">
                <span className="currency">$</span>
                <span className="price">{ride.pricePerSeat}</span>
              </div>
              <div className="pricing-footer">
                <span>Total for 1 passenger</span>
              </div>
            </div>
            
            <div className="availability-card">
              <div className="availability-header">
                <span>Seat Availability</span>
              </div>
              <div className="seats-grid">
                {[...Array(ride.totalSeats || 4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`seat ${i < (ride.totalSeats - ride.availableSeats) ? 'occupied' : 'available'}`}
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M8 12C8 10.8954 8.89543 10 10 10H22C23.1046 10 24 10.8954 24 12V20C24 21.1046 23.1046 22 22 22H10C8.89543 22 8 21.1046 8 20V12Z" fill="currentColor" opacity="0.2"/>
                      <path d="M8 12C8 10.8954 8.89543 10 10 10H22C23.1046 10 24 10.8954 24 12V20C24 21.1046 23.1046 22 22 22H10C8.89543 22 8 21.1046 8 20V12Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M6 14V18C6 19.1046 6.89543 20 8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M26 14V18C26 19.1046 25.1046 20 24 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                ))}
              </div>
              <div className="availability-summary">
                <span className="available-count">{ride.availableSeats}</span>
                <span className="available-text">of {ride.totalSeats} seats available</span>
              </div>
            </div>
          </div>
        </div>

        {bookingSuccess && (
          <div className="notification success">
            <div className="notification-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="notification-content">
              <h4>Booking Reserved!</h4>
              <p>Redirecting to payment page...</p>
            </div>
          </div>
        )}

        {cancelSuccess && (
          <div className="notification info">
            <div className="notification-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="notification-content">
              <h4>Booking Cancelled</h4>
              <p>Your booking has been cancelled successfully.</p>
            </div>
          </div>
        )}

        {bookingError && (
          <div className="notification error">
            <div className="notification-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="notification-content">
              <h4>Booking Failed</h4>
              <p>{bookingError}</p>
            </div>
          </div>
        )}

        {cancelError && (
          <div className="notification error">
            <div className="notification-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="notification-content">
              <h4>Cancellation Failed</h4>
              <p>{cancelError}</p>
            </div>
          </div>
        )}

        <div className="content-layout">
          <div className="main-content">
            <div className="content-card driver-section">
              <div className="card-header">
                <div className="header-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <h2>Driver Information</h2>
                </div>
                {isDriver && <span className="badge-primary">You</span>}
              </div>
              
              <div className="driver-profile-card">
                <div className="driver-avatar">
                  <span>{ride.driver?.name?.charAt(0).toUpperCase() || 'D'}</span>
                </div>
                <div className="driver-details">
                  <h3 className="driver-name">{ride.driver?.name || 'Driver'}</h3>
                  <div className="driver-info-grid">
                    {ride.driver?.college && (
                      <div className="info-row">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M9 2L2 6L9 10L16 6L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                          <path d="M2 13L9 17L16 13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                          <path d="M2 9.5L9 13.5L16 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                        <span>{ride.driver.college}</span>
                      </div>
                    )}
                    {ride.driver?.phone && (
                      <div className="info-row">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M16 12.5C16 12.5 14.5 14 12 14C9.5 14 5 11.5 4 7C3.5 4.5 4 3 4 3C4 3 5 2 6 2C6.5 2 7 2.5 7.5 3.5C8 4.5 8.5 5.5 8.5 6C8.5 6.5 8 7 7.5 7.5C7.5 7.5 8 9 9.5 10.5C11 12 12.5 12.5 12.5 12.5C13 12 13.5 11.5 14 11.5C14.5 11.5 15.5 12 16.5 12.5C17.5 13 18 13.5 18 14C18 15 17 16 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{ride.driver.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isDriver && ride.driver && (
                <button className="action-button secondary" onClick={() => navigate(`/messages?userId=${ride.driver.id}`)}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M17 8.5C17 12.6421 13.6421 16 9.5 16C8.23582 16 7.04366 15.6701 6 15.0922L3 16L3.90781 13C3.32988 11.9563 3 10.7642 3 9.5C3 5.35786 6.35786 2 10.5 2C14.6421 2 18 5.35786 18 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  <span>Message Driver</span>
                </button>
              )}
            </div>

            {ride.status === 'active' && (userBooking || isDriver) && (
              <div className="content-card map-section">
                <div className="card-header">
                  <div className="header-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h2>Live Tracking</h2>
                  </div>
                  {driverLocation && (
                    <span className="live-badge">
                      <span className="live-pulse"></span>
                      <span>Live</span>
                    </span>
                  )}
                </div>
                
                <div className="map-container">
                  <MapView 
                    driverLocation={driverLocation}
                    driverName={ride.driver?.name || 'Driver'}
                    height="400px"
                  />
                </div>
                
                {driverLocation && (
                  <div className="map-footer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 4V8L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Updated {new Date(driverLocation.timestamp).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            )}

            {!isDriver && ride.driver && (
              <div className="content-card">
                <DriverRatings 
                  driverId={ride.driverId || ride.driver.id} 
                  driverName={ride.driver.name} 
                />
              </div>
            )}

            {ride.status === 'completed' && hasConfirmedBooking && !isDriver && (
              <div className="content-card review-section">
                <div className="card-header">
                  <div className="header-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    <h2>Your Review</h2>
                  </div>
                </div>
                
                {userReview ? (
                  <div className="review-display-card">
                    <div className="review-stars">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill={i < userReview.rating ? "currentColor" : "none"}>
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                      ))}
                    </div>
                    {userReview.comment && (
                      <p className="review-text">{userReview.comment}</p>
                    )}
                    <p className="review-date">
                      {new Date(userReview.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                ) : showReviewForm ? (
                  <ReviewForm
                    rideId={id}
                    driverId={ride.driverId || ride.driver?.id}
                    onReviewSubmitted={handleReviewSubmitted}
                    onCancel={() => setShowReviewForm(false)}
                  />
                ) : (
                  <button className="action-button primary" onClick={() => setShowReviewForm(true)}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14 3L17 6L8 15L4 16L5 12L14 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Write a Review</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="sidebar-content">
            <div className="booking-card">
              <div className="booking-header">
                <h3>Booking Summary</h3>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">Departure</span>
                  <span className="detail-value">{formatTime(ride.departureTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {new Date(ride.departureTime).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Available Seats</span>
                  <span className="detail-value">{ride.availableSeats}</span>
                </div>
                <div className="detail-divider"></div>
                <div className="detail-row total">
                  <span className="detail-label">Total Price</span>
                  <span className="detail-value">${ride.pricePerSeat}</span>
                </div>
              </div>

              {isDriver && (
                <div className="status-notice driver">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 4V3C8 2.44772 8.44772 2 9 2H11C11.5523 2 12 2.44772 12 3V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M4 10C4 8.89543 4.89543 8 6 8H14C15.1046 8 16 8.89543 16 10V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V10Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>You're driving this ride</span>
                </div>
              )}

              {hasConfirmedBooking && !isDriver && (
                <>
                  <div className="status-notice booked">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>You're booked on this ride</span>
                  </div>
                  {ride.status === 'active' && (
                    <button
                      className="action-button danger"
                      onClick={handleCancelBooking}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (
                        <>
                          <span className="button-spinner"></span>
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <span>Cancel Booking</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {canBook && (
                <button
                  className="action-button primary large"
                  onClick={handleBookRide}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <>
                      <span className="button-spinner"></span>
                      <span>Booking...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="6" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 6V4C7 3.44772 7.44772 3 8 3H12C12.5523 3 13 3.44772 13 4V6" stroke="currentColor" strokeWidth="2"/>
                        <path d="M10 10V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>Book This Ride</span>
                    </>
                  )}
                </button>
              )}

              {!canBook && !isDriver && !hasConfirmedBooking && ride.availableSeats === 0 && ride.status === 'active' && (
                <div className="status-notice unavailable">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="10" cy="14" r="1" fill="currentColor"/>
                  </svg>
                  <span>Fully Booked</span>
                </div>
              )}

              {ride.status === 'cancelled' && (
                <div className="status-notice cancelled">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 7L13 13M7 13L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Ride Cancelled</span>
                </div>
              )}

              {ride.status === 'completed' && (
                <div className="status-notice completed">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Ride Completed</span>
                </div>
              )}
            </div>

            <div className="impact-cards">
              <div className="impact-card">
                <div className="impact-icon eco">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C12 2 8 6 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 6 12 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M12 14V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 18H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="impact-content">
                  <div className="impact-value">2.3kg</div>
                  <div className="impact-label">CO₂ Saved</div>
                </div>
              </div>
              
              <div className="impact-card">
                <div className="impact-icon savings">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="impact-content">
                  <div className="impact-value">~$20</div>
                  <div className="impact-label">You Save</div>
                </div>
              </div>
            </div>

            <div className="safety-features">
              <div className="safety-header">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L3 5V9C3 13.5 6 17 10 18C14 17 17 13.5 17 9V5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M7 9L9 11L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h4>Safety Features</h4>
              </div>
              <ul className="safety-list">
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Verified university email</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Real-time GPS tracking</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>24/7 support available</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Secure payment system</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RideDetailsPage;
