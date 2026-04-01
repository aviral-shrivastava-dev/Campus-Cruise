import { useNotification } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import './NotificationList.css';

function NotificationList({ onClose }) {
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotification();

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAll();
    if (onClose) onClose();
  };

  return (
    <div className="notification-list">
      <div className="notification-header">
        <h3 className="notification-title">
          Notifications
          {unreadCount > 0 && (
            <span className="unread-count">({unreadCount})</span>
          )}
        </h3>
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button 
              className="action-button"
              onClick={handleMarkAllRead}
              title="Mark all as read"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              className="action-button"
              onClick={handleClearAll}
              title="Clear all"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="notification-body">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notification-items">
            {notifications
              .filter(notif => !notif.isToast)
              .map(notification => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationList;
