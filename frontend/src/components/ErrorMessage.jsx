import './ErrorMessage.css';

function ErrorMessage({ 
  message, 
  type = 'error', 
  onRetry = null, 
  onDismiss = null 
}) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-message-component ${type}`}>
      <div className="error-content">
        <span className="error-icon">{getIcon()}</span>
        <p className="error-text">{message}</p>
      </div>
      
      {(onRetry || onDismiss) && (
        <div className="error-actions">
          {onRetry && (
            <button onClick={onRetry} className="btn-retry">
              Try Again
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="btn-dismiss" aria-label="Dismiss">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorMessage;
