import './LoadingSpinner.css';

function LoadingSpinner({ size = 'medium', message = '' }) {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
