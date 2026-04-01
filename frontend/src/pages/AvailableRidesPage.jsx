import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useWebSocket } from '../context/WebSocketContext';
import RideCard from '../components/RideCard';
import RideFilters from '../components/RideFilters';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './AvailableRidesPage.css';

function AvailableRidesPage() {
  const navigate = useNavigate();
  const { on, off } = useWebSocket();
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    source: '',
    destination: '',
    date: ''
  });
  const [sortBy, setSortBy] = useState('time');
  const [viewMode, setViewMode] = useState('grid');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rides, filters, sortBy]);

  // Listen for seat changes via WebSocket
  useEffect(() => {
    if (!on || !off) return;

    const handleSeatChange = (data) => {
      console.log('Seat change received in AvailableRidesPage:', data);
      setRides(prevRides => 
        prevRides.map(ride => 
          ride.id === data.rideId 
            ? { ...ride, availableSeats: data.availableSeats }
            : ride
        )
      );
    };

    on('seat_change', handleSeatChange);
    
    return () => {
      off('seat_change', handleSeatChange);
    };
  }, [on, off]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/rides');
      
      let ridesData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          ridesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data.rides)) {
          ridesData = response.data.data.rides;
        } else if (Array.isArray(response.data.rides)) {
          ridesData = response.data.rides;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          ridesData = response.data.data;
        }
      }
      
      setRides(ridesData);
    } catch (err) {
      console.error('Error fetching rides:', err);
      setError('Failed to load rides. Please try again later.');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(rides)) {
      setFilteredRides([]);
      return;
    }

    let filtered = [...rides];

    if (filters.source) {
      filtered = filtered.filter(ride =>
        ride.source?.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    if (filters.destination) {
      filtered = filtered.filter(ride =>
        ride.destination?.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter(ride => {
        const rideDate = new Date(ride.departureTime).toISOString().split('T')[0];
        return rideDate === filters.date;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(a.departureTime) - new Date(b.departureTime);
        case 'price-low':
          return a.pricePerSeat - b.pricePerSeat;
        case 'price-high':
          return b.pricePerSeat - a.pricePerSeat;
        case 'seats':
          return b.availableSeats - a.availableSeats;
        default:
          return 0;
      }
    });

    setFilteredRides(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getStatsData = () => {
    const totalRides = filteredRides.length;
    const avgPrice = totalRides > 0 
      ? (filteredRides.reduce((sum, ride) => sum + ride.pricePerSeat, 0) / totalRides).toFixed(2)
      : 0;
    const totalSeats = filteredRides.reduce((sum, ride) => sum + ride.availableSeats, 0);
    
    return { totalRides, avgPrice, totalSeats };
  };

  const stats = getStatsData();

  return (
    <div className="findride-page">
      <Navbar />
      
      {/* Animated Background */}
      <div className="findride-bg-gradient">
        <div className="findride-bg-orb findride-bg-orb-1"></div>
        <div className="findride-bg-orb findride-bg-orb-2"></div>
        <div className="findride-bg-orb findride-bg-orb-3"></div>
      </div>

      <div className="findride-container">
        {/* Premium Hero Section */}
        <div className="findride-hero">
          <div className="findride-hero-content">
            <div className="findride-hero-badge">
              <svg className="findride-badge-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Premium Ride Matching</span>
            </div>
            
            <h1 className="findride-hero-title">
              Discover Your
              <span className="findride-hero-gradient"> Perfect Ride</span>
            </h1>
            
            <p className="findride-hero-subtitle">
              AI-powered matching connects you with the best rides in seconds. 
              Safe, affordable, and built for students.
            </p>

            <div className="findride-hero-actions">
              <button 
                className="findride-btn-primary"
                onClick={() => navigate('/rides/create')}
              >
                <svg className="findride-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Offer a Ride</span>
              </button>
              
              <button 
                className="findride-btn-secondary"
                onClick={() => document.getElementById('findride-filters')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <svg className="findride-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <span>Search Rides</span>
              </button>
            </div>
          </div>

          {/* Floating Stats Cards */}
          <div className="findride-hero-stats">
            <div className="findride-stat-card findride-stat-card-1">
              <div className="findride-stat-icon-wrapper">
                <svg className="findride-stat-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
              <div className="findride-stat-content">
                <div className="findride-stat-value">{stats.totalRides}</div>
                <div className="findride-stat-label">Active Rides</div>
              </div>
              <div className="findride-stat-trend">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                <span>Live</span>
              </div>
            </div>

            <div className="findride-stat-card findride-stat-card-2">
              <div className="findride-stat-icon-wrapper">
                <svg className="findride-stat-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="findride-stat-content">
                <div className="findride-stat-value">${stats.avgPrice}</div>
                <div className="findride-stat-label">Avg Price</div>
              </div>
              <div className="findride-stat-trend findride-stat-trend-success">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Low</span>
              </div>
            </div>

            <div className="findride-stat-card findride-stat-card-3">
              <div className="findride-stat-icon-wrapper">
                <svg className="findride-stat-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div className="findride-stat-content">
                <div className="findride-stat-value">{stats.totalSeats}</div>
                <div className="findride-stat-label">Available Seats</div>
              </div>
              <div className="findride-stat-trend">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Section */}
        <div id="findride-filters" className="findride-filters-section">
          <div className="findride-filters-header">
            <div className="findride-filters-title-group">
              <h2 className="findride-filters-title">Find Your Match</h2>
              <p className="findride-filters-subtitle">Filter rides by location, date, and preferences</p>
            </div>
            {(filters.source || filters.destination || filters.date) && (
              <button 
                className="findride-btn-clear"
                onClick={() => setFilters({ source: '', destination: '', date: '' })}
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
          
          <RideFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Results Control Bar */}
        {!loading && !error && filteredRides.length > 0 && (
          <div className="findride-controls">
            <div className="findride-results-badge">
              <div className="findride-results-pulse"></div>
              <span className="findride-results-count">{filteredRides.length}</span>
              <span className="findride-results-text">
                {filteredRides.length === 1 ? 'ride available' : 'rides available'}
              </span>
            </div>

            <div className="findride-controls-group">
              <div className="findride-sort-wrapper">
                <label htmlFor="findride-sort" className="findride-sort-label">
                  <svg className="findride-sort-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                  </svg>
                  Sort by
                </label>
                <select 
                  id="findride-sort"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="findride-sort-select"
                >
                  <option value="time">Departure Time</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="seats">Most Seats Available</option>
                </select>
              </div>

              <div className="findride-view-toggle">
                <button 
                  className={`findride-view-btn ${viewMode === 'grid' ? 'findride-view-btn-active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                  </svg>
                </button>
                <button 
                  className={`findride-view-btn ${viewMode === 'list' ? 'findride-view-btn-active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                  aria-label="List view"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="findride-content">
          {loading ? (
            <div className="findride-loading">
              <LoadingSpinner size="large" message="Finding the best rides for you..." />
            </div>
          ) : error ? (
            <div className="findride-error">
              <ErrorMessage 
                message={error}
                type="error"
                onRetry={fetchRides}
              />
            </div>
          ) : filteredRides.length === 0 ? (
            <div className="findride-empty">
              <div className="findride-empty-illustration">
                <div className="findride-empty-icon-wrapper">
                  <svg className="findride-empty-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <div className="findride-empty-pulse"></div>
                </div>
              </div>
              
              <h3 className="findride-empty-title">
                {rides.length === 0 ? 'No rides available yet' : 'No matching rides found'}
              </h3>
              
              <p className="findride-empty-description">
                {rides.length === 0
                  ? "Be the first to create a ride and start building your campus community!"
                  : "Try adjusting your filters or check back soon. New rides are added every day."}
              </p>

              <div className="findride-empty-actions">
                {rides.length === 0 ? (
                  <button 
                    className="findride-btn-primary"
                    onClick={() => navigate('/rides/create')}
                  >
                    <svg className="findride-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create First Ride
                  </button>
                ) : (
                  <>
                    <button 
                      className="findride-btn-secondary"
                      onClick={() => setFilters({ source: '', destination: '', date: '' })}
                    >
                      <svg className="findride-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Clear Filters
                    </button>
                    <button 
                      className="findride-btn-primary"
                      onClick={() => navigate('/rides/create')}
                    >
                      <svg className="findride-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create a Ride
                    </button>
                  </>
                )}
              </div>

              {rides.length > 0 && (
                <div className="findride-empty-tips">
                  <p className="findride-tips-title">Search Tips:</p>
                  <ul className="findride-tips-list">
                    <li>Try broader location terms</li>
                    <li>Check different dates</li>
                    <li>Remove some filters</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className={`findride-rides-${viewMode}`}>
              {filteredRides.map(ride => (
                <RideCard key={ride.id} ride={ride} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AvailableRidesPage;
