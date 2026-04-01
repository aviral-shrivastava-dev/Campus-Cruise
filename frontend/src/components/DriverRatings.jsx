import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from '../utils/axios';
import './DriverRatings.css';

function DriverRatings({ driverId, driverName }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    fetchDriverRatings();
  }, [driverId]);

  const fetchDriverRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/reviews/driver/${driverId}`);
      setRatingsData(response.data.data || response.data);
    } catch (err) {
      console.error('Error fetching driver ratings:', err);
      setError('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="star-display">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '⯨'}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="driver-ratings-container">
        <div className="ratings-loading">
          <div className="spinner-small"></div>
          <p>Loading ratings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="driver-ratings-container">
        <div className="ratings-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!ratingsData || ratingsData.totalReviews === 0) {
    return (
      <div className="driver-ratings-container">
        <div className="no-ratings">
          <p>No reviews yet</p>
        </div>
      </div>
    );
  }

  const displayedReviews = showAllReviews 
    ? ratingsData.reviews 
    : ratingsData.reviews.slice(0, 3);

  return (
    <div className="driver-ratings-container">
      <div className="ratings-summary">
        <div className="average-rating">
          <div className="rating-number">{ratingsData.averageRating.toFixed(1)}</div>
          <div className="rating-stars-large">
            {renderStars(ratingsData.averageRating)}
          </div>
          <div className="rating-count">
            {ratingsData.totalReviews} review{ratingsData.totalReviews !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="reviews-list">
        <h3>Reviews</h3>
        {displayedReviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  {review.reviewer?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="reviewer-details">
                  <div className="reviewer-name">{review.reviewer?.name || 'Anonymous'}</div>
                  <div className="reviewer-college">{review.reviewer?.college || ''}</div>
                </div>
              </div>
              <div className="review-meta">
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
                <div className="review-date">{formatDate(review.createdAt)}</div>
              </div>
            </div>
            {review.comment && (
              <div className="review-content">
                <p>{review.comment}</p>
              </div>
            )}
            {review.ride && (
              <div className="review-ride-info">
                <span className="ride-route">
                  {review.ride.source} → {review.ride.destination}
                </span>
                <span className="ride-date">
                  {formatDate(review.ride.departureTime)}
                </span>
              </div>
            )}
          </div>
        ))}

        {ratingsData.reviews.length > 3 && (
          <button
            className="btn-toggle-reviews"
            onClick={() => setShowAllReviews(!showAllReviews)}
          >
            {showAllReviews 
              ? 'Show Less' 
              : `Show All ${ratingsData.reviews.length} Reviews`}
          </button>
        )}
      </div>
    </div>
  );
}

DriverRatings.propTypes = {
  driverId: PropTypes.string.isRequired,
  driverName: PropTypes.string
};

export default DriverRatings;
