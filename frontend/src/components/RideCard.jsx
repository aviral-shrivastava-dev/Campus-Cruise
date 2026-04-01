import { useNavigate } from 'react-router-dom';
import './RideCard.css';

function RideCard({ ride, viewMode = 'grid' }) {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
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

  const getTimeUntilDeparture = () => {
    const now = new Date();
    const departure = new Date(ride.departureTime);
    const diff = departure - now;
    
    if (diff < 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 7) return null;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  const getUrgencyLevel = () => {
    const now = new Date();
    const departure = new Date(ride.departureTime);
    const diff = departure - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 3) return 'urgent';
    if (hours < 24) return 'soon';
    return 'normal';
  };

  const handleCardClick = () => {
    navigate(`/rides/${ride.id}`);
  };

  const timeUntil = getTimeUntilDeparture();
  const urgencyLevel = getUrgencyLevel();

  return (
    <div 
      className={`ridecard-premium ${viewMode === 'list' ? 'ridecard-list-mode' : 'ridecard-grid-mode'}`} 
      onClick={handleCardClick}
    >
      {/* Animated Border Gradient */}
      <div className="ridecard-border-gradient"></div>
      
      <div className="ridecard-content">
        {/* Status Badges */}
        <div className="ridecard-badges">
          {timeUntil && (
            <div className={`ridecard-time-badge ridecard-urgency-${urgencyLevel}`}>
              <svg className="ridecard-badge-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="ridecard-badge-text">{timeUntil}</span>
            </div>
          )}
          
          {ride.availableSeats <= 2 && (
            <div className="ridecard-seats-badge">
              <svg className="ridecard-badge-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
              <span className="ridecard-badge-text">{ride.availableSeats} left</span>
            </div>
          )}
        </div>

        {/* Route Section with Premium Design */}
        <div className="ridecard-route">
          <div className="ridecard-location ridecard-location-from">
            <div className="ridecard-location-icon-wrapper">
              <svg className="ridecard-location-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ridecard-location-details">
              <div className="ridecard-location-label">From</div>
              <div className="ridecard-location-name">{ride.source}</div>
            </div>
          </div>

          <div className="ridecard-route-line">
            <div className="ridecard-route-dots">
              <span className="ridecard-dot"></span>
              <span className="ridecard-dot"></span>
              <span className="ridecard-dot"></span>
            </div>
            <svg className="ridecard-route-arrow" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="ridecard-location ridecard-location-to">
            <div className="ridecard-location-icon-wrapper">
              <svg className="ridecard-location-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ridecard-location-details">
              <div className="ridecard-location-label">To</div>
              <div className="ridecard-location-name">{ride.destination}</div>
            </div>
          </div>
        </div>

        {/* Info Pills */}
        <div className="ridecard-info-pills">
          <div className="ridecard-pill">
            <svg className="ridecard-pill-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="ridecard-pill-text">{formatDate(ride.departureTime)}</span>
          </div>

          <div className="ridecard-pill">
            <svg className="ridecard-pill-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="ridecard-pill-text">{formatTime(ride.departureTime)}</span>
          </div>

          <div className="ridecard-pill">
            <svg className="ridecard-pill-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="ridecard-pill-text">{ride.availableSeats} {ride.availableSeats === 1 ? 'seat' : 'seats'}</span>
          </div>
        </div>

        {/* Driver Section */}
        <div className="ridecard-driver">
          <div className="ridecard-driver-avatar">
            <div className="ridecard-avatar-inner">
              {ride.driver?.name?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="ridecard-avatar-ring"></div>
          </div>
          
          <div className="ridecard-driver-info">
            <div className="ridecard-driver-name">{ride.driver?.name || 'Driver'}</div>
            {ride.driver?.college && (
              <div className="ridecard-driver-college">
                <svg className="ridecard-college-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                <span>{ride.driver.college}</span>
              </div>
            )}
          </div>

          {ride.driver?.rating && (
            <div className="ridecard-driver-rating">
              <svg className="ridecard-rating-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{ride.driver.rating}</span>
            </div>
          )}
        </div>

        {/* Footer with Price and CTA */}
        <div className="ridecard-footer">
          <div className="ridecard-price-section">
            <div className="ridecard-price-label">Price per seat</div>
            <div className="ridecard-price-wrapper">
              <span className="ridecard-price-currency">$</span>
              <span className="ridecard-price-amount">{ride.pricePerSeat}</span>
            </div>
          </div>

          <button 
            className="ridecard-cta-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            aria-label={`Book ride from ${ride.source} to ${ride.destination}`}
          >
            <span className="ridecard-cta-text">Book Ride</span>
            <svg className="ridecard-cta-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <div className="ridecard-cta-shine"></div>
          </button>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="ridecard-glow"></div>
    </div>
  );
}

export default RideCard;
