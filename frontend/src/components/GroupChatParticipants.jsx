import { useState } from 'prop-types';
import PropTypes from 'prop-types';
import './GroupChatParticipants.css';

function GroupChatParticipants({ participants, onClose }) {
  return (
    <div className="participants-modal-overlay" onClick={onClose}>
      <div className="participants-modal" onClick={(e) => e.stopPropagation()}>
        <div className="participants-header">
          <h3>Participants ({participants.length})</h3>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        
        <div className="participants-list">
          {participants.map((participant) => (
            <div key={participant.id} className="participant-item">
              <div className="participant-avatar">
                {participant.name?.charAt(0).toUpperCase() || 'U'}
                {participant.isOnline && (
                  <span className="online-indicator"></span>
                )}
              </div>
              <div className="participant-info">
                <div className="participant-name">{participant.name}</div>
                <div className="participant-role">
                  {participant.isDriver ? '🚗 Driver' : '👤 Passenger'}
                </div>
              </div>
              {participant.isOnline && (
                <span className="status-badge online">Online</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

GroupChatParticipants.propTypes = {
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      isDriver: PropTypes.bool,
      isOnline: PropTypes.bool
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired
};

export default GroupChatParticipants;
