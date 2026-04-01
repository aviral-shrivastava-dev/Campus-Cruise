import { useState } from 'react';
import PropTypes from 'prop-types';
import './ConversationList.css';

function ConversationList({ 
  conversations, 
  activeConversationId, 
  onSelectConversation,
  onPinConversation,
  onDeleteConversation 
}) {
  const [contextMenu, setContextMenu] = useState(null);

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'No messages yet';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const handleContextMenu = (e, conversation) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversation
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handlePin = () => {
    if (contextMenu && onPinConversation) {
      onPinConversation(contextMenu.conversation.id);
    }
    handleCloseContextMenu();
  };

  const handleDelete = () => {
    if (contextMenu && onDeleteConversation) {
      onDeleteConversation(contextMenu.conversation.id);
    }
    handleCloseContextMenu();
  };

  // Close context menu when clicking outside
  useState(() => {
    const handleClick = () => handleCloseContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="conversation-list-premium">
      <div className="conversations-container-premium">
        {conversations.length === 0 ? (
          <div className="no-conversations-premium">
            <div className="no-conversations-icon">💬</div>
            <p className="no-conversations-title">No conversations yet</p>
            <span className="no-conversations-subtitle">
              Start chatting with drivers or passengers!
            </span>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item-premium ${
                activeConversationId === conversation.id ? 'active' : ''
              } ${conversation.isPinned ? 'pinned' : ''}`}
              onClick={() => onSelectConversation(conversation)}
              onContextMenu={(e) => handleContextMenu(e, conversation)}
            >
              {conversation.isPinned && (
                <div className="pin-indicator">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6.5 0L8 1.5 7 2.5 8.5 4 10 3.5 11 4.5 7.5 8 9 9.5 8.5 10 6 7.5 2 11.5 1 10.5 5 6.5 2.5 4 3 3.5 4.5 5 5.5 4 4.5 2.5z"/>
                  </svg>
                </div>
              )}
              
              <div className="conversation-avatar-premium">
                {conversation.isGroupChat ? (
                  <div className="group-avatar-premium">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                ) : (
                  <div className="user-avatar-premium">
                    {conversation.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                {!conversation.isGroupChat && conversation.isOnline && (
                  <span className="online-indicator-premium"></span>
                )}
              </div>
              
              <div className="conversation-info-premium">
                <div className="conversation-header-premium">
                  <h4 className="conversation-name-premium">
                    {conversation.isGroupChat && conversation.ride
                      ? `${conversation.ride.source} → ${conversation.ride.destination}`
                      : conversation.name}
                  </h4>
                  <span className="conversation-time-premium">
                    {formatLastMessageTime(conversation.lastMessageTime)}
                  </span>
                </div>
                
                <div className="conversation-preview-premium">
                  <p className="last-message-premium">
                    {truncateMessage(conversation.lastMessage)}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge-premium">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu-premium"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`
          }}
        >
          <button className="context-menu-item" onClick={handlePin}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.5 0L11 1.5 10 2.5 11.5 4 13 3.5 14 4.5 10.5 8 12 9.5 11.5 10 9 7.5 5 11.5 4 10.5 8 6.5 5.5 4 6 3.5 7.5 5 8.5 4 7.5 2.5z"/>
            </svg>
            {contextMenu.conversation.isPinned ? 'Unpin' : 'Pin'} Conversation
          </button>
          <button className="context-menu-item danger" onClick={handleDelete}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
            Delete Conversation
          </button>
        </div>
      )}
    </div>
  );
}

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      isGroupChat: PropTypes.bool,
      isOnline: PropTypes.bool,
      lastMessage: PropTypes.string,
      lastMessageTime: PropTypes.string,
      unreadCount: PropTypes.number,
      isPinned: PropTypes.bool,
      ride: PropTypes.shape({
        source: PropTypes.string,
        destination: PropTypes.string
      })
    })
  ).isRequired,
  activeConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  onPinConversation: PropTypes.func,
  onDeleteConversation: PropTypes.func
};

export default ConversationList;
