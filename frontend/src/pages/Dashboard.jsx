import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalRides: 0,
      totalBookings: 0,
      moneySaved: 0,
      co2Reduced: 0,
      averageRating: 0
    },
    upcomingRides: [],
    recentActivity: [],
    activeRides: []
  });
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [ridesResponse, bookingsResponse, historyResponse, reviewsResponse] = await Promise.all([
        api.user.getUserRides(user.id).catch((err) => {
          console.error('Error fetching rides:', err);
          return { data: [] };
        }),
        api.user.getUserBookings(user.id).catch((err) => {
          console.error('Error fetching bookings:', err);
          return { data: [] };
        }),
        api.user.getRideHistory(user.id).catch((err) => {
          console.error('Error fetching history:', err);
          return { data: { history: [] } };
        }),
        api.user.getUserReviews(user.id).catch((err) => {
          console.error('Error fetching reviews:', err);
          return { data: { reviews: [], averageRating: 0 } };
        })
      ]);

      let rides = [];
      if (ridesResponse.data) {
        if (Array.isArray(ridesResponse.data)) {
          rides = ridesResponse.data;
        } else if (Array.isArray(ridesResponse.data.data)) {
          rides = ridesResponse.data.data;
        } else if (ridesResponse.data.rides && Array.isArray(ridesResponse.data.rides)) {
          rides = ridesResponse.data.rides;
        }
      }

      let bookings = [];
      if (bookingsResponse.data) {
        if (Array.isArray(bookingsResponse.data)) {
          bookings = bookingsResponse.data;
        } else if (Array.isArray(bookingsResponse.data.data)) {
          bookings = bookingsResponse.data.data;
        } else if (bookingsResponse.data.bookings && Array.isArray(bookingsResponse.data.bookings)) {
          bookings = bookingsResponse.data.bookings;
        }
      }

      const history = historyResponse.data?.history || historyResponse.data?.data?.history || [];
      const reviews = reviewsResponse.data?.reviews || reviewsResponse.data?.data?.reviews || [];
      const averageRating = reviewsResponse.data?.averageRating || reviewsResponse.data?.data?.averageRating || 0;

      const totalRides = rides.length;
      const totalBookings = bookings.length;
      const completedRides = history.filter(h => h.status === 'completed').length;
      const moneySaved = completedRides * 20;
      const co2Reduced = (completedRides * 2.3).toFixed(1);

      const now = new Date();
      const upcomingRides = rides
        .filter(ride => {
          const rideDate = new Date(ride.departureTime);
          const status = ride.status?.toLowerCase();
          return rideDate > now && (status === 'active' || status === 'scheduled');
        })
        .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
        .slice(0, 3);

      const activeRides = rides.filter(ride => {
        const rideDate = new Date(ride.departureTime);
        const today = new Date();
        const status = ride.status?.toLowerCase();
        return (
          (status === 'in_progress') ||
          ((status === 'active' || status === 'scheduled') && 
           rideDate.toDateString() === today.toDateString())
        );
      });

      const recentActivity = [
        ...rides.map(ride => ({
          type: 'ride_created',
          data: ride,
          timestamp: ride.createdAt,
          icon: '🚗',
          title: 'Ride Created',
          description: `${ride.source} → ${ride.destination}`
        })),
        ...bookings.map(booking => ({
          type: 'booking_created',
          data: booking,
          timestamp: booking.createdAt,
          icon: '🎫',
          title: 'Ride Booked',
          description: booking.ride ? `${booking.ride.source} → ${booking.ride.destination}` : 'Ride details'
        }))
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

      setDashboardData({
        stats: {
          totalRides,
          totalBookings,
          moneySaved,
          co2Reduced,
          averageRating: averageRating.toFixed(1)
        },
        upcomingRides,
        recentActivity,
        activeRides
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
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

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-container">
          <div className="loading-state">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      
      <div className="dashboard-container">
        {/* Header Section */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="dashboard-title">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="dashboard-subtitle">
                🚗 Track your carpools, save money, and reduce your carbon footprint
              </p>
            </div>
            
            <div className="header-actions">
              <div className="period-selector">
                <button 
                  className={`period-btn ${selectedPeriod === 'day' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('day')}
                >
                  Day
                </button>
                <button 
                  className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('week')}
                >
                  Week
                </button>
                <button 
                  className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('month')}
                >
                  Month
                </button>
              </div>
              
              <button 
                onClick={fetchDashboardData} 
                className="refresh-button"
                aria-label="Refresh dashboard"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C9.84871 2 11.5 2.84871 12.5962 4.19231" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 2V4.5H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="alert-banner error">
            <div className="alert-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="alert-content">
              <p className="alert-title">Error loading data</p>
              <p className="alert-message">{error}</p>
            </div>
            <button onClick={fetchDashboardData} className="alert-action">
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Total Rides Shared</span>
              <div className="metric-icon rides">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 17h14v-5l-1.5-4.5h-11L5 12v5z"/>
                  <circle cx="7" cy="17" r="2"/>
                  <circle cx="17" cy="17" r="2"/>
                  <path d="M5 9l1.5-4.5h11L19 9"/>
                  <circle cx="12" cy="11" r="1" fill="currentColor"/>
                  <circle cx="9" cy="11" r="1" fill="currentColor"/>
                  <circle cx="15" cy="11" r="1" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{dashboardData.stats.totalRides}</div>
            <div className="metric-footer">
              <span className="metric-change positive">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 2L2 6h8L6 2z"/>
                </svg>
                12%
              </span>
              <span className="metric-period">vs last {selectedPeriod}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Carpooling Savings</span>
              <div className="metric-icon savings">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  <circle cx="12" cy="12" r="1" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">${dashboardData.stats.moneySaved}</div>
            <div className="metric-footer">
              <span className="metric-change positive">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 2L2 6h8L6 2z"/>
                </svg>
                8%
              </span>
              <span className="metric-period">vs last {selectedPeriod}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">CO₂ Emissions Saved</span>
              <div className="metric-icon impact">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M12 6v6l4 2"/>
                  <path d="M8 12c0-2.21 1.79-4 4-4"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{dashboardData.stats.co2Reduced}<span className="metric-unit">kg</span></div>
            <div className="metric-footer">
              <span className="metric-change positive">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 2L2 6h8L6 2z"/>
                </svg>
                15%
              </span>
              <span className="metric-period">vs last {selectedPeriod}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Driver Rating</span>
              <div className="metric-icon rating">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{dashboardData.stats.averageRating || 'N/A'}</div>
            <div className="metric-footer">
              <span className="metric-change neutral">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 6h8"/>
                </svg>
                0%
              </span>
              <span className="metric-period">vs last {selectedPeriod}</span>
            </div>
          </div>
        </div>

        {/* Active Rides Banner */}
        {dashboardData.activeRides.length > 0 && (
          <div className="active-banner">
            <div className="banner-content">
              <div className="banner-icon">
                <div className="pulse-dot"></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 17h14v-5l-1.5-4.5h-11L5 12v5z"/>
                  <circle cx="7" cy="17" r="2"/>
                  <circle cx="17" cy="17" r="2"/>
                  <path d="M5 9l1.5-4.5h11L19 9"/>
                  <path d="M8 12h8" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="banner-text">
                <h3>🚗 Active Carpools Today</h3>
                <p>You have {dashboardData.activeRides.length} carpool{dashboardData.activeRides.length > 1 ? 's' : ''} scheduled for today</p>
              </div>
            </div>
            <Link to="/my-rides" className="banner-action">
              View Carpools
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
              </svg>
            </Link>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Upcoming Rides Section */}
          <section className="content-section upcoming-section">
            <div className="section-header">
              <div className="section-title">
                <h2>🚙 Upcoming Carpools</h2>
                <span className="section-badge">{dashboardData.upcomingRides.length}</span>
              </div>
              <Link to="/history" className="section-link">
                View all
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                </svg>
              </Link>
            </div>

            <div className="rides-list">
              {dashboardData.upcomingRides.length > 0 ? (
                dashboardData.upcomingRides.map((ride) => (
                  <Link key={ride.id} to={`/rides/${ride.id}`} className="ride-card">
                    <div className="ride-card-header">
                      <div className="ride-route">
                        <span className="route-location">{ride.source}</span>
                        <div className="route-line">
                          <div className="route-dot start"></div>
                          <div className="route-connector"></div>
                          <div className="route-dot end"></div>
                        </div>
                        <span className="route-location">{ride.destination}</span>
                      </div>
                      <div className="ride-price">
                        <span className="price-amount">${ride.pricePerSeat}</span>
                        <span className="price-label">per seat</span>
                      </div>
                    </div>
                    
                    <div className="ride-card-footer">
                      <div className="ride-meta">
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path fillRule="evenodd" d="M7 13A6 6 0 107 1a6 6 0 000 12zm1-8a1 1 0 10-2 0v3a1 1 0 00.293.707l1.5 1.5a1 1 0 001.414-1.414L8 7.586V5z" clipRule="evenodd"/>
                          </svg>
                          <span>{formatDate(ride.departureTime)}</span>
                        </div>
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M7 6a2 2 0 100-4 2 2 0 000 4zM7 8a4 4 0 00-4 4v1h8v-1a4 4 0 00-4-4z"/>
                          </svg>
                          <span>{ride.availableSeats} seats</span>
                        </div>
                      </div>
                      <div className="ride-status-badge active">Active</div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 34h28v-10l-3-9H13l-3 9v10z"/>
                      <circle cx="14" cy="34" r="4"/>
                      <circle cx="34" cy="34" r="4"/>
                      <path d="M10 18l3-9h22l3 9"/>
                      <circle cx="24" cy="22" r="2" fill="currentColor"/>
                      <circle cx="18" cy="22" r="2" fill="currentColor"/>
                      <circle cx="30" cy="22" r="2" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3>No upcoming carpools</h3>
                  <p>Start sharing rides to save money and reduce emissions</p>
                  <div className="empty-actions">
                    <Link to="/rides" className="btn-primary">Find Carpools</Link>
                    <Link to="/rides/create" className="btn-secondary">Offer a Ride</Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Recent Activity Section */}
          <section className="content-section activity-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Recent Activity</h2>
              </div>
            </div>

            <div className="activity-timeline">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      <div className="marker-dot"></div>
                      {index < dashboardData.recentActivity.length - 1 && (
                        <div className="marker-line"></div>
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="activity-header">
                        <span className="activity-icon">{activity.icon}</span>
                        <div className="activity-info">
                          <h4>{activity.title}</h4>
                          <p>{activity.description}</p>
                        </div>
                      </div>
                      <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-small">
                  <div className="empty-icon-small">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor">
                      <circle cx="16" cy="16" r="12" strokeWidth="2"/>
                      <path d="M16 12v8M16 24h.01" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2 className="actions-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/rides" className="action-card primary">
              <div className="action-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v8M8 12h8"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div className="action-content">
                <h3>Find a Carpool</h3>
                <p>Search shared rides</p>
              </div>
              <div className="action-arrow">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                </svg>
              </div>
            </Link>

            <Link to="/rides/create" className="action-card secondary">
              <div className="action-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 17h14v-5l-1.5-4.5h-11L5 12v5z"/>
                  <circle cx="7" cy="17" r="2"/>
                  <circle cx="17" cy="17" r="2"/>
                  <path d="M5 9l1.5-4.5h11L19 9"/>
                  <path d="M12 7v6M9 10h6"/>
                </svg>
              </div>
              <div className="action-content">
                <h3>Offer a Carpool</h3>
                <p>Share your ride</p>
              </div>
              <div className="action-arrow">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                </svg>
              </div>
            </Link>

            <Link to="/my-rides" className="action-card tertiary">
              <div className="action-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div className="action-content">
                <h3>My Carpools</h3>
                <p>View bookings</p>
              </div>
              <div className="action-arrow">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                </svg>
              </div>
            </Link>

            <Link to="/messages" className="action-card quaternary">
              <div className="action-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  <circle cx="9" cy="10" r="1" fill="currentColor"/>
                  <circle cx="12" cy="10" r="1" fill="currentColor"/>
                  <circle cx="15" cy="10" r="1" fill="currentColor"/>
                </svg>
              </div>
              <div className="action-content">
                <h3>Messages</h3>
                <p>Chat with riders</p>
              </div>
              <div className="action-arrow">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                </svg>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
