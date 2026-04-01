import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './RideHistory.css';

function RideHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [history, filterStartDate, filterEndDate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/users/${user.id}/history`);
      const historyData = response.data.history || response.data.rides || response.data;
      
      // Sort by date descending (most recent first)
      const sortedHistory = Array.isArray(historyData) 
        ? historyData.sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime))
        : [];
      
      setHistory(sortedHistory);
      setFilteredHistory(sortedHistory);
    } catch (err) {
      console.error('Error fetching ride history:', err);
      setError('Failed to load ride history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    if (!filterStartDate && !filterEndDate) {
      setFilteredHistory(history);
      return;
    }

    const filtered = history.filter(ride => {
      const rideDate = new Date(ride.departureTime);
      const startDate = filterStartDate ? new Date(filterStartDate) : null;
      const endDate = filterEndDate ? new Date(filterEndDate) : null;

      if (startDate && endDate) {
        return rideDate >= startDate && rideDate <= endDate;
      } else if (startDate) {
        return rideDate >= startDate;
      } else if (endDate) {
        return rideDate <= endDate;
      }
      return true;
    });

    setFilteredHistory(filtered);
  };

  const handleClearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
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

  const getRoleInRide = (ride) => {
    if (ride.driverId === user.id || ride.driver?.id === user.id) {
      return 'driver';
    }
    return 'passenger';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'active':
        return 'status-active';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="ride-history-page">
        <Navbar />
        <div className="page-container">
          <LoadingSpinner size="large" message="Loading ride history..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ride-history-page">
        <Navbar />
        <div className="page-container">
          <ErrorMessage 
            message={error}
            type="error"
            onRetry={fetchHistory}
          />
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ride-history-page">
      <Navbar />
      
      <div className="page-container">
        <div className="history-header">
          <h1>Ride History</h1>
          <p className="history-subtitle">
            View all your past rides as a driver or passenger
          </p>
        </div>

        {/* Date Filter */}
        <div className="filter-section">
          <div className="filter-group">
            <label htmlFor="startDate">From Date</label>
            <input
              type="date"
              id="startDate"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="endDate">To Date</label>
            <input
              type="date"
              id="endDate"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
          {(filterStartDate || filterEndDate) && (
            <button className="btn-clear-filters" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h2>No rides found</h2>
            <p>
              {filterStartDate || filterEndDate
                ? 'Try adjusting your date filters'
                : 'You haven\'t taken any rides yet'}
            </p>
            {!filterStartDate && !filterEndDate && (
              <button className="btn-find-rides" onClick={() => navigate('/rides')}>
                Find Rides
              </button>
            )}
          </div>
        ) : (
          <div className="history-list">
            <div className="history-count">
              Showing {filteredHistory.length} ride{filteredHistory.length !== 1 ? 's' : ''}
            </div>
            {filteredHistory.map((ride) => {
              const role = getRoleInRide(ride);
              const isDriver = role === 'driver';
              
              return (
                <div key={ride.id} className="history-card">
                  <div className="history-card-header">
                    <div className="role-indicator">
                      <span className={`role-badge ${role}`}>
                        {isDriver ? '🚗 Driver' : '👤 Passenger'}
                      </span>
                      <span className={`status-badge ${getStatusBadgeClass(ride.status)}`}>
                        {ride.status}
                      </span>
                    </div>
                    <div className="ride-date">
                      {formatDate(ride.departureTime)}
                    </div>
                  </div>

                  <div className="history-card-body">
                    <div className="route-info">
                      <div className="route-point">
                        <span className="route-icon">📍</span>
                        <span className="route-location">{ride.source}</span>
                      </div>
                      <div className="route-arrow">→</div>
                      <div className="route-point">
                        <span className="route-icon">🎯</span>
                        <span className="route-location">{ride.destination}</span>
                      </div>
                    </div>

                    <div className="ride-details">
                      <div className="detail-item">
                        <span className="detail-icon">🕐</span>
                        <span className="detail-text">{formatTime(ride.departureTime)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">💺</span>
                        <span className="detail-text">
                          {ride.totalSeats || ride.availableSeats} seat{(ride.totalSeats || ride.availableSeats) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {!isDriver && ride.driver && (
                        <div className="detail-item">
                          <span className="detail-icon">👤</span>
                          <span className="detail-text">Driver: {ride.driver.name}</span>
                        </div>
                      )}
                      {isDriver && ride.bookings && ride.bookings.length > 0 && (
                        <div className="detail-item">
                          <span className="detail-icon">👥</span>
                          <span className="detail-text">
                            {ride.bookings.length} passenger{ride.bookings.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {ride.status === 'cancelled' && (
                      <div className="cancellation-notice">
                        <span className="notice-icon">⚠️</span>
                        <span>This ride was cancelled</span>
                      </div>
                    )}
                  </div>

                  <div className="history-card-footer">
                    <button
                      className="btn-view-details"
                      onClick={() => navigate(`/rides/${ride.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RideHistory;
