import { useState } from 'react';
import PropTypes from 'prop-types';
import axios from '../utils/axios';
import './ReviewForm.css';

function ReviewForm({ rideId, driverId, onReviewSubmitted, onCancel }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/reviews', {
        rideId,
        rating,
        comment: comment.trim() || undefined
      });

      // Call the callback to notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to submit review. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoveredRating || rating);
      stars.push(
        <button
          key={i}
          type="button"
          className={`star-button ${isFilled ? 'filled' : ''}`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          disabled={loading}
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="review-form-container">
      <h3>Rate Your Experience</h3>
      
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label>Rating</label>
          <div className="star-rating">
            {renderStars()}
          </div>
          {rating > 0 && (
            <p className="rating-text">
              {rating} star{rating > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comment (Optional)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this ride..."
            rows="4"
            disabled={loading}
            maxLength="500"
          />
          <p className="char-count">{comment.length}/500</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || rating === 0}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}

ReviewForm.propTypes = {
  rideId: PropTypes.string.isRequired,
  driverId: PropTypes.string.isRequired,
  onReviewSubmitted: PropTypes.func,
  onCancel: PropTypes.func
};

export default ReviewForm;
