import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import './MyRidesPage.css';

function MyRidesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('offered');
  const [offeredRides, setOfferedRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyRides();
  }, [user]);

  const fetchMyRides = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [offeredResponse, bookedResponse] = await Promise.all([
        api.user.getUserRides(user.id).catch((err) => {
          console.error('Error fetching offered rides:', err);
          return { data: [] };
        }),
        api.user.getUserBookings(user.id).catch((err) => {
          console.error('Error fetching booked rides:', err);
          return { data: [] };
        })
      ]);

      let offered = [];
      if (offeredResponse.data) {
        if (Array.isArray(offeredResponse.data)) {
          offered = offeredResponse.data;
        } else if (Array.isArray(offeredResponse.data.data)) {
          offered = offeredResponse.data.data;
        }
      }

      let booked = [];
      if (bookedResponse.data) {
        if (Array.isArray(bookedResponse.data)) {
          booked = bookedResponse.data;
        } else if (Array.isArray(bookedResponse.data.data)) {
          booked = bookedResponse.data.data;
        }
      }

      booked = booked.filter(booking => {
        const status = booking.status?.toLowerCase();
        return status === 'confirmed';
      });

      setOfferedRides(offered);
      setBookedRides(booked);
    } catch (err) {
      console.error('Error fetching rides:', err);
      setError('Failed to load your rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getTimeStatus = (departureTime) => {
    const now = new Date();
    const departure = new Date(departureTime);
    const diff = departure - now;
    
    if (diff < 0) return { label: 'Departed', color: 'gray' };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return { label: `${days}d away`, color: 'blue' };
    if (hours > 2) return { label: `${hours}h away`, color: 'yellow' };
    return { label: 'Soon', color: 'red' };
  };

  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to cancel this ride? All passengers will be notified.')) {
      return;
    }

    try {
      await api.ride.cancelRide(rideId);
      alert('Ride cancelled successfully!');
      await fetchMyRides();
    } catch (err) {
      console.error('Error cancelling ride:', err);
      alert(err.response?.data?.error?.message || 'Failed to cancel ride. Please try again.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.booking.cancelBooking(bookingId);
      alert('Booking cancelled successfully!');
      await fetchMyRides();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.error?.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const getStats = () => {
    const activeOffered = offeredRides.filter(r => r.status === 'active').length;
    const activeBooked = bookedRides.length;
    const totalPassengers = offeredRides.reduce((sum, ride) => 
      sum + (ride.bookings?.length || 0), 0
    );
    const totalEarnings = offeredRides.reduce((sum, ride) => 
      sum + ((ride.bookings?.length || 0) * (ride.pricePerSeat || 0)), 0
    );

    return { activeOffered, activeBooked, totalPassengers, totalEarnings };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="myrides-page">
        <Navbar />
        <div className="myrides-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="myrides-page">
      <Navbar />
      
      <div className="myrides-container">
        <div className="myrides-hero">
          <div className="myrides-hero-content">
            <div className="myrides-hero-badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z" fill="currentColor"/>
              </svg>
              <span>Your Journey Dashboard</span>
            </div>
            <h1 className="myrides-hero-title">My Rides</h1>
            <p className="myrides-hero-subtitle">
              Manage your offered rides and bookings with precision and ease
            </p>
          </div>
          <Link to="/rides/create" className="myrides-hero-cta">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Offer New Ride</span>
          </Link>
        </div>


        <div className="myrides-stats">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon stat-icon-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 17H5C3.89543 17 3 16.1046 3 15V9C3 7.89543 3.89543 7 5 7H19C20.1046 7 21 7.89543 21 9V15C21 16.1046 20.1046 17 19 17Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-trend stat-trend-up">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 12L8 8L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>+12%</span>
              </div>
            </div>
            <div className="stat-value">{stats.activeOffered}</div>
            <div className="stat-label">Active Rides</div>
            <div className="stat-footer">Rides you're offering</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon stat-icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 6V4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V6" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="13" r="2" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-trend stat-trend-up">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 12L8 8L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>+8%</span>
              </div>
            </div>
            <div className="stat-value">{stats.activeBooked}</div>
            <div className="stat-label">Booked Rides</div>
            <div className="stat-footer">Your upcoming trips</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon stat-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 21C2 17.134 5.13401 14 9 14C12.866 14 16 17.134 16 21" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="17" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 21C22 18.2386 19.7614 16 17 16" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-trend stat-trend-up">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 12L8 8L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>+24%</span>
              </div>
            </div>
            <div className="stat-value">{stats.totalPassengers}</div>
            <div className="stat-label">Total Passengers</div>
            <div className="stat-footer">People you've helped</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon stat-icon-yellow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stat-trend stat-trend-up">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 12L8 8L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>+18%</span>
              </div>
            </div>
            <div className="stat-value">${stats.totalEarnings.toFixed(0)}</div>
            <div className="stat-label">Total Earnings</div>
            <div className="stat-footer">Revenue generated</div>
          </div>
        </div>


        {error && (
          <div className="myrides-alert">
            <div className="myrides-alert-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="10" cy="14" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="myrides-alert-content">
              <div className="myrides-alert-title">Error Loading Rides</div>
              <div className="myrides-alert-message">{error}</div>
            </div>
            <button className="myrides-alert-action" onClick={fetchMyRides}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.3 2 12.3 3.3 13.3 5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M13 2V5H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Retry</span>
            </button>
          </div>
        )}

        <div className="myrides-tabs">
          <button 
            className={`myrides-tab ${activeTab === 'offered' ? 'active' : ''}`}
            onClick={() => setActiveTab('offered')}
          >
            <div className="myrides-tab-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 17H19M5 17C3.89543 17 3 16.1046 3 15V9C3 7.89543 3.89543 7 5 7H19C20.1046 7 21 7.89543 21 9V15C21 16.1046 20.1046 17 19 17M5 17V19C5 19.5523 5.44772 20 6 20H7M19 17V19C19 19.5523 18.5523 20 18 20H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="7" cy="20" r="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17" cy="20" r="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="myrides-tab-content">
              <span className="myrides-tab-title">Rides I'm Offering</span>
              <span className="myrides-tab-count">{offeredRides.length} rides</span>
            </div>
            {activeTab === 'offered' && <div className="myrides-tab-indicator" />}
          </button>
          
          <button 
            className={`myrides-tab ${activeTab === 'booked' ? 'active' : ''}`}
            onClick={() => setActiveTab('booked')}
          >
            <div className="myrides-tab-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 6V4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V6" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="myrides-tab-content">
              <span className="myrides-tab-title">Rides I've Booked</span>
              <span className="myrides-tab-count">{bookedRides.length} bookings</span>
            </div>
            {activeTab === 'booked' && <div className="myrides-tab-indicator" />}
          </button>
        </div>


        <div className="myrides-content">
          {activeTab === 'offered' && (
            <>
              {offeredRides.length === 0 ? (
                <div className="myrides-empty">
                  <div className="myrides-empty-icon">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.2"/>
                      <path d="M20 40H60M20 40C17.7909 40 16 38.2091 16 36V28C16 25.7909 17.7909 24 20 24H60C62.2091 24 64 25.7909 64 28V36C64 38.2091 62.2091 40 60 40M20 40V44C20 45.1046 20.8954 46 22 46H24M60 40V44C60 45.1046 59.1046 46 58 46H56" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      <circle cx="24" cy="46" r="6" stroke="currentColor" strokeWidth="3"/>
                      <circle cx="56" cy="46" r="6" stroke="currentColor" strokeWidth="3"/>
                    </svg>
                  </div>
                  <h3 className="myrides-empty-title">No Active Rides</h3>
                  <p className="myrides-empty-description">
                    You haven't offered any rides yet. Start sharing your journey and earn while helping your community!
                  </p>
                  <Link to="/rides/create" className="myrides-empty-cta">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Create Your First Ride</span>
                  </Link>
                </div>
              ) : (
                <div className="myrides-grid">
                  {offeredRides.map((ride) => {
                    const timeStatus = getTimeStatus(ride.departureTime);
                    return (
                      <div key={ride.id} className="ride-card">
                        <div className="ride-card-header">
                          <div className={`ride-status-badge status-${timeStatus.color}`}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="6" cy="6" r="2" fill="currentColor"/>
                            </svg>
                            <span>{timeStatus.label}</span>
                          </div>
                          <div className={`ride-status-badge status-${ride.status?.toLowerCase()}`}>
                            <span>{ride.status}</span>
                          </div>
                        </div>

                        <div className="ride-route">
                          <div className="ride-route-line">
                            <div className="ride-route-dot ride-route-dot-start"></div>
                            <div className="ride-route-connector"></div>
                            <div className="ride-route-dot ride-route-dot-end"></div>
                          </div>
                          <div className="ride-route-details">
                            <div className="ride-route-location">
                              <span className="ride-route-label">From</span>
                              <span className="ride-route-text">{ride.source}</span>
                            </div>
                            <div className="ride-route-location">
                              <span className="ride-route-label">To</span>
                              <span className="ride-route-text">{ride.destination}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ride-datetime">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M8 4V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>{formatDate(ride.departureTime)}</span>
                        </div>


                        <div className="ride-metrics">
                          <div className="ride-metric">
                            <div className="ride-metric-icon">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="3" y="6" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M7 6V4C7 3.44772 7.44772 3 8 3H12C12.5523 3 13 3.44772 13 4V6" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                            </div>
                            <div className="ride-metric-content">
                              <div className="ride-metric-value">{ride.availableSeats}/{ride.totalSeats}</div>
                              <div className="ride-metric-label">Available</div>
                            </div>
                          </div>
                          
                          <div className="ride-metric">
                            <div className="ride-metric-icon">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M2 18C2 14.6863 4.68629 12 8 12C11.3137 12 14 14.6863 14 18" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M18 18C18 16.3431 16.6569 15 15 15" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                            </div>
                            <div className="ride-metric-content">
                              <div className="ride-metric-value">{ride.bookings?.length || 0}</div>
                              <div className="ride-metric-label">Passengers</div>
                            </div>
                          </div>
                          
                          <div className="ride-metric">
                            <div className="ride-metric-icon">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M10 6V10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <div className="ride-metric-content">
                              <div className="ride-metric-value">${((ride.bookings?.length || 0) * ride.pricePerSeat).toFixed(0)}</div>
                              <div className="ride-metric-label">Earnings</div>
                            </div>
                          </div>
                        </div>

                        {ride.bookings && ride.bookings.length > 0 && (
                          <div className="ride-passengers">
                            <div className="ride-passengers-label">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M1 14C1 11.2386 3.23858 9 6 9C8.76142 9 11 11.2386 11 14" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M15 14C15 12.3431 13.6569 11 12 11" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                              <span>Passengers</span>
                            </div>
                            <div className="ride-passengers-list">
                              {ride.bookings.slice(0, 4).map((booking, idx) => (
                                <div 
                                  key={booking.id} 
                                  className="ride-passenger-avatar"
                                  style={{ zIndex: 4 - idx }}
                                  title={booking.passenger?.name}
                                >
                                  {booking.passenger?.name?.charAt(0).toUpperCase() || 'P'}
                                </div>
                              ))}
                              {ride.bookings.length > 4 && (
                                <div className="ride-passenger-avatar ride-passenger-more">
                                  +{ride.bookings.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="ride-card-actions">
                          <button 
                            className="ride-action-btn ride-action-primary"
                            onClick={() => navigate(`/rides/${ride.id}`)}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                              <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            <span>View Details</span>
                          </button>
                          <button 
                            className="ride-action-btn ride-action-secondary"
                            onClick={() => navigate(`/messages?ride=${ride.id}`)}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M6 8H12M6 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span>Message</span>
                          </button>
                          <button 
                            className="ride-action-btn ride-action-danger"
                            onClick={() => handleCancelRide(ride.id)}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}


          {activeTab === 'booked' && (
            <>
              {bookedRides.length === 0 ? (
                <div className="myrides-empty">
                  <div className="myrides-empty-icon">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.2"/>
                      <rect x="16" y="24" width="48" height="32" rx="4" stroke="currentColor" strokeWidth="3"/>
                      <path d="M24 24V20C24 18.8954 24.8954 18 26 18H54C55.1046 18 56 18.8954 56 20V24" stroke="currentColor" strokeWidth="3"/>
                      <path d="M30 36L36 42L50 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="myrides-empty-title">No Booked Rides</h3>
                  <p className="myrides-empty-description">
                    You haven't booked any rides yet. Find a ride that matches your route and start traveling!
                  </p>
                  <Link to="/rides" className="myrides-empty-cta">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2"/>
                      <path d="M10 6V10L13 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Find Rides</span>
                  </Link>
                </div>
              ) : (
                <div className="myrides-grid">
                  {bookedRides.map((booking) => {
                    const ride = booking.ride;
                    if (!ride) return null;
                    
                    const timeStatus = getTimeStatus(ride.departureTime);
                    return (
                      <div key={booking.id} className="ride-card ride-card-booked">
                        <div className="ride-card-header">
                          <div className={`ride-status-badge status-${timeStatus.color}`}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="6" cy="6" r="2" fill="currentColor"/>
                            </svg>
                            <span>{timeStatus.label}</span>
                          </div>
                          <div className="ride-status-badge status-confirmed">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Confirmed</span>
                          </div>
                        </div>

                        <div className="ride-route">
                          <div className="ride-route-line">
                            <div className="ride-route-dot ride-route-dot-start"></div>
                            <div className="ride-route-connector"></div>
                            <div className="ride-route-dot ride-route-dot-end"></div>
                          </div>
                          <div className="ride-route-details">
                            <div className="ride-route-location">
                              <span className="ride-route-label">From</span>
                              <span className="ride-route-text">{ride.source}</span>
                            </div>
                            <div className="ride-route-location">
                              <span className="ride-route-label">To</span>
                              <span className="ride-route-text">{ride.destination}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ride-datetime">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M8 4V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>{formatDate(ride.departureTime)}</span>
                        </div>

                        <div className="ride-driver">
                          <div className="ride-driver-avatar">
                            {ride.driver?.name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div className="ride-driver-info">
                            <div className="ride-driver-name">{ride.driver?.name || 'Driver'}</div>
                            {ride.driver?.college && (
                              <div className="ride-driver-college">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M7 1L1 4L7 7L13 4L7 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                                  <path d="M3 5.5V9C3 9 3 11 7 11C11 11 11 9 11 9V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span>{ride.driver.college}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ride-price">
                          <span className="ride-price-label">You paid</span>
                          <span className="ride-price-value">${ride.pricePerSeat}</span>
                        </div>

                        <div className="ride-card-actions">
                          <button 
                            className="ride-action-btn ride-action-primary"
                            onClick={() => navigate(`/rides/${ride.id}`)}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                              <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            <span>View Details</span>
                          </button>
                          <button 
                            className="ride-action-btn ride-action-secondary"
                            onClick={() => navigate(`/messages?ride=${ride.id}`)}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M6 8H12M6 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span>Message</span>
                          </button>
                          <button 
                            className="ride-action-btn ride-action-danger"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyRidesPage;
