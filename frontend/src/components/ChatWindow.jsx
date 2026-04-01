import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MessageBubble from './MessageBubble';
import GroupChatParticipants from './GroupChatParticipants';
import './ChatWindow.css';

function ChatWindow({ 
  conversation, 
  messages, 
  currentUserId, 
  onSendMessage, 
  onTyping,
  isTyping,
  isGroupChat = false,
  onBack
}) {
  const [messageInput, setMessageInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 100);
    }
  }, [conversation.id]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Emit typing indicator
    if (onTyping) {
      onTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
      
      // Stop typing indicator
      if (onTyping) {
        onTyping(false);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Focus back on input
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const quickEmojis = ['👍', '❤️', '😊', '😂', '🎉', '🚗', '✅', '👋'];

  const getConversationTitle = () => {
    if (isGroupChat && conversation.ride) {
      return `${conversation.ride.source} → ${conversation.ride.destination}`;
    }
    return conversation.name || 'Chat';
  };

  const getConversationSubtitle = () => {
    if (isGroupChat && conversation.participants) {
      return `${conversation.participants.length} participants`;
    }
    return conversation.isOnline ? 'Online' : 'Offline';
  };

  return (
    <div className="chat-window-premium">
      {/* Enhanced Chat Header */}
      <div className="chat-header-premium">
        {onBack && (
          <button className="back-btn-premium" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4L6 10L12 16" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        
        <div className="chat-header-info-premium">
          <div className="chat-avatar-header">
            {isGroupChat ? (
              <div className="group-avatar-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
            ) : (
              <div className="user-avatar-header">
                {conversation.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {!isGroupChat && conversation.isOnline && (
              <span className="online-dot-header"></span>
            )}
          </div>
          
          <div className="chat-title-section">
            <h3 className="chat-title-premium">{getConversationTitle()}</h3>
            <p className="chat-subtitle-premium">
              {isTyping ? (
                <span className="typing-text">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  typing...
                </span>
              ) : (
                getConversationSubtitle()
              )}
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          {isGroupChat && conversation.participants && (
            <button 
              className="header-action-btn"
              onClick={() => setShowParticipants(true)}
              title="View participants"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </button>
          )}
          
          <button className="header-action-btn" title="Search messages">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M21 21l-6-6"/>
            </svg>
          </button>
          
          <button className="header-action-btn" title="More options">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
              <circle cx="11" cy="5" r="2"/>
              <circle cx="11" cy="11" r="2"/>
              <circle cx="11" cy="17" r="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container-premium">
        {messages.length === 0 ? (
          <div className="no-messages-premium">
            <div className="no-messages-icon">💬</div>
            <p className="no-messages-title">No messages yet</p>
            <p className="no-messages-subtitle">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDateDivider = index === 0 || 
                new Date(messages[index - 1].createdAt).toDateString() !== 
                new Date(message.createdAt).toDateString();
              
              return (
                <div key={message.id}>
                  {showDateDivider && (
                    <div className="date-divider">
                      <span>{new Date(message.createdAt).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwnMessage={message.senderId === currentUserId}
                    showSender={isGroupChat}
                  />
                </div>
              );
            })}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Message Input */}
      <div className="message-input-container-premium">
        <form className="message-input-form-premium" onSubmit={handleSubmit}>
          <div className="input-actions-left">
            <button 
              type="button"
              className="input-action-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emoji"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="9"/>
                <path d="M7 13s1.5 2 4 2 4-2 4-2"/>
                <line x1="8" y1="8" x2="8" y2="8"/>
                <line x1="14" y1="8" x2="14" y2="8"/>
              </svg>
            </button>
            
            <button 
              type="button"
              className="input-action-btn"
              title="Attach file"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L1 21l1.9-7.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </button>
          </div>

          <textarea
            ref={inputRef}
            className="message-input-premium"
            placeholder="Type a message..."
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            rows="1"
            autoComplete="off"
          />

          <div className="input-actions-right">
            {messageInput.trim() ? (
              <button 
                type="submit" 
                className="send-button-premium"
                disabled={!messageInput.trim()}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            ) : (
              <button 
                type="button"
                className={`voice-button-premium ${isRecording ? 'recording' : ''}`}
                onClick={() => setIsRecording(!isRecording)}
                title="Voice message"
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M17 11a6 6 0 0 1-12 0"/>
                  <line x1="11" y1="17" x2="11" y2="21"/>
                  <line x1="7" y1="21" x2="15" y2="21"/>
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker-premium">
            <div className="emoji-picker-header">
              <span>Emoji</span>
              <button onClick={() => setShowEmojiPicker(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
            <div className="emoji-grid">
              {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁'].map((emoji, index) => (
                <button
                  key={index}
                  className="emoji-item"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Participants Modal */}
      {showParticipants && conversation.participants && (
        <GroupChatParticipants
          participants={conversation.participants}
          onClose={() => setShowParticipants(false)}
        />
      )}
    </div>
  );
}

ChatWindow.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    isOnline: PropTypes.bool,
    ride: PropTypes.shape({
      source: PropTypes.string,
      destination: PropTypes.string
    }),
    participants: PropTypes.array
  }).isRequired,
  messages: PropTypes.array.isRequired,
  currentUserId: PropTypes.string.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onTyping: PropTypes.func,
  isTyping: PropTypes.bool,
  isGroupChat: PropTypes.bool,
  onBack: PropTypes.func
};

export default ChatWindow;
