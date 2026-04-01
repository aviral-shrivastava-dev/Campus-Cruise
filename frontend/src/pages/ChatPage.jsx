import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import LoadingSpinner from '../components/LoadingSpinner';
import './ChatPage.css';

function ChatPage() {
  const { user } = useAuth();
  const { socket, connected, on, off, emit } = useWebSocket();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, group, direct
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Handle ride query parameter for direct navigation to ride chat
  useEffect(() => {
    const rideId = searchParams.get('ride');
    if (rideId && conversations.length > 0) {
      const rideConversation = conversations.find(c => c.isGroupChat && c.rideId === parseInt(rideId));
      if (rideConversation) {
        handleSelectConversation(rideConversation);
      }
    }
  }, [searchParams, conversations]);

  const fetchConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      console.log('Fetching conversations for user:', user.id);

      // Fetch user's rides (as driver) and bookings (as passenger)
      const [ridesResponse, bookingsResponse] = await Promise.all([
        api.user.getUserRides(user.id).catch((err) => {
          console.error('Error fetching user rides:', err);
          return { data: [] };
        }),
        api.user.getUserBookings(user.id).catch((err) => {
          console.error('Error fetching user bookings:', err);
          return { data: [] };
        })
      ]);

      console.log('Rides response:', ridesResponse);
      console.log('Bookings response:', bookingsResponse);

      // Parse rides
      let rides = [];
      if (ridesResponse.data) {
        if (Array.isArray(ridesResponse.data)) {
          rides = ridesResponse.data;
        } else if (Array.isArray(ridesResponse.data.data)) {
          rides = ridesResponse.data.data;
        }
      }

      // Parse bookings
      let bookings = [];
      if (bookingsResponse.data) {
        if (Array.isArray(bookingsResponse.data)) {
          bookings = bookingsResponse.data;
        } else if (Array.isArray(bookingsResponse.data.data)) {
          bookings = bookingsResponse.data.data;
        }
      }

      console.log('Parsed rides:', rides);
      console.log('Parsed bookings:', bookings);

      // Combine all rides and bookings, removing duplicates
      const allRides = [...rides];
      
      // Add rides from bookings that aren't already in rides
      bookings.forEach(booking => {
        if (booking.ride && booking.ride.id) {
          const exists = allRides.some(r => r.id === booking.ride.id);
          if (!exists) {
            allRides.push(booking.ride);
          }
        }
      });

      // Create unique conversations from all rides
      const allConversations = allRides
        .filter(ride => ride && ride.id)
        .map(ride => ({
          id: `ride-${ride.id}`,
          rideId: ride.id,
          isGroupChat: true,
          name: `${ride.source || 'Unknown'} → ${ride.destination || 'Unknown'}`,
          ride: ride,
          participants: [
            { id: ride.driverId, name: ride.driver?.name || 'Driver', role: 'driver' },
            ...(ride.bookings || []).map(b => ({
              id: b.passengerId,
              name: b.passenger?.name || 'Passenger',
              role: 'passenger'
            }))
          ],
          lastMessage: null,
          lastMessageTime: ride.departureTime,
          unreadCount: 0,
          isPinned: false
        }));

      console.log('All conversations:', allConversations);

      // Sort by pinned first, then by departure time
      allConversations.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });

      setConversations(allConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversation) => {
    try {
      setMessagesLoading(true);
      
      if (conversation.isGroupChat) {
        const response = await api.message.getRideMessages(conversation.rideId);
        console.log('Ride messages response:', response);
        
        let msgs = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            msgs = response.data;
          } else if (Array.isArray(response.data.data)) {
            msgs = response.data.data;
          }
        }
        
        setMessages(msgs);
      } else {
        const response = await api.message.getConversation(conversation.userId);
        console.log('Conversation messages response:', response);
        
        let msgs = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            msgs = response.data;
          } else if (Array.isArray(response.data.data)) {
            msgs = response.data.data;
          }
        }
        
        setMessages(msgs);
        
        await api.message.markAsRead({ conversationUserId: conversation.userId }).catch(err => {
          console.error('Error marking messages as read:', err);
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation);
    
    if (conversation.isGroupChat && emit) {
      emit('join_ride', { rideId: conversation.rideId });
    }
  };

  const handleSendMessage = async (content) => {
    if (!activeConversation || !content.trim()) return;
    
    try {
      const messageData = {
        content: content.trim(),
        messageType: activeConversation.isGroupChat ? 'group' : 'direct'
      };
      
      if (activeConversation.isGroupChat) {
        messageData.rideId = activeConversation.rideId;
      } else {
        messageData.recipientId = activeConversation.userId;
      }
      
      const response = await api.message.sendMessage(messageData);
      const newMessage = response.data || response.data?.data || response;
      
      setMessages(prev => [...prev, newMessage]);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === activeConversation.id
            ? {
                ...conv,
                lastMessage: content.trim(),
                lastMessageTime: new Date().toISOString()
              }
            : conv
        )
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTyping = (isTyping) => {
    if (!activeConversation || !emit) return;
    
    if (activeConversation.isGroupChat) {
      emit('typing_start', { rideId: activeConversation.rideId });
    } else {
      emit(isTyping ? 'typing_start' : 'typing_stop', {
        recipientId: activeConversation.userId
      });
    }
  };

  const handlePinConversation = (conversationId) => {
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, isPinned: !conv.isPinned }
          : conv
      );
      
      // Re-sort after pinning
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });
    });
  };

  const handleDeleteConversation = (conversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    }
  };

  // WebSocket event handlers
  const handleMessageReceived = useCallback((data) => {
    if (activeConversation) {
      const isRelevant = activeConversation.isGroupChat
        ? data.rideId === activeConversation.rideId
        : data.senderId === activeConversation.userId;
      
      if (isRelevant) {
        setMessages(prev => [...prev, data]);
      }
    }
    
    setConversations(prev => {
      const existingConv = prev.find(c => 
        c.isGroupChat 
          ? c.rideId === data.rideId 
          : c.userId === data.senderId
      );
      
      if (existingConv) {
        return prev.map(conv =>
          conv.id === existingConv.id
            ? {
                ...conv,
                lastMessage: data.content,
                lastMessageTime: data.createdAt || new Date().toISOString(),
                unreadCount: activeConversation?.id === conv.id 
                  ? 0 
                  : (conv.unreadCount || 0) + 1
              }
            : conv
        );
      }
      
      return prev;
    });
  }, [activeConversation]);

  const handleTypingIndicator = useCallback((data) => {
    setTypingUsers(prev => ({
      ...prev,
      [data.userId || data.rideId]: data.isTyping
    }));
    
    setTimeout(() => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId || data.rideId]: false
      }));
    }, 3000);
  }, []);

  useEffect(() => {
    if (!connected || !socket) return;
    
    on('message_received', handleMessageReceived);
    on('typing_indicator', handleTypingIndicator);
    
    return () => {
      off('message_received', handleMessageReceived);
      off('typing_indicator', handleTypingIndicator);
    };
  }, [connected, socket, on, off, handleMessageReceived, handleTypingIndicator]);

  const isTypingNow = activeConversation 
    ? typingUsers[activeConversation.userId || activeConversation.rideId] 
    : false;

  // Filter conversations based on search and filter type
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'group' && conv.isGroupChat) ||
      (filterType === 'direct' && !conv.isGroupChat);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="chat-page-premium">
        <Navbar />
        <div className="chat-container-premium">
          <div className="chat-loading-state">
            <LoadingSpinner />
            <p>Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page-premium">
      <Navbar />
      
      <div className={`chat-container-premium ${activeConversation ? 'has-active-conversation' : ''}`}>
        {/* Enhanced Sidebar */}
        <div className={`chat-sidebar-premium ${activeConversation ? '' : 'mobile-visible'}`}>
          <div className="sidebar-header-premium">
            <div className="sidebar-title-section">
              <h2 className="sidebar-title">Messages</h2>
              <span className="conversation-count">{conversations.length}</span>
            </div>
            
            <button 
              className="settings-btn-premium"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="3"/>
                <path d="M10 1v2m0 14v2M18.66 5l-1.73 1M3.07 14l-1.73 1M18.66 15l-1.73-1M3.07 6l-1.73-1"/>
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-bar-premium">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-premium"
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 10.5l-1 1L8 9l-2.5 2.5-1-1L7 8 4.5 5.5l1-1L8 7l2.5-2.5 1 1L9 8l2.5 2.5z"/>
                </svg>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs-premium">
            <button 
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${filterType === 'group' ? 'active' : ''}`}
              onClick={() => setFilterType('group')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 1c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"/>
              </svg>
              Groups
            </button>
            <button 
              className={`filter-tab ${filterType === 'direct' ? 'active' : ''}`}
              onClick={() => setFilterType('direct')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2 1H6c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Direct
            </button>
          </div>

          {/* Conversations List */}
          <ConversationList
            conversations={filteredConversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={handleSelectConversation}
            onPinConversation={handlePinConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
        
        {/* Enhanced Chat Window */}
        <div className={`chat-main-premium ${activeConversation ? '' : 'mobile-hidden'}`}>
          {activeConversation ? (
            messagesLoading ? (
              <div className="messages-loading-premium">
                <LoadingSpinner />
                <p>Loading messages...</p>
              </div>
            ) : (
              <ChatWindow
                conversation={activeConversation}
                messages={messages}
                currentUserId={user.id}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                isTyping={isTypingNow}
                isGroupChat={activeConversation.isGroupChat}
                onBack={() => setActiveConversation(null)}
              />
            )
          ) : (
            <div className="no-conversation-selected-premium">
              <div className="empty-state-premium">
                <div className="empty-state-animation">
                  <div className="message-bubble-anim bubble-1"></div>
                  <div className="message-bubble-anim bubble-2"></div>
                  <div className="message-bubble-anim bubble-3"></div>
                </div>
                
                <h3>Welcome to Messages</h3>
                <p>
                  {conversations.length === 0 
                    ? 'Start your journey by booking or offering a ride'
                    : 'Select a conversation to start messaging'}
                </p>
                
                {conversations.length === 0 && (
                  <div className="empty-state-actions-premium">
                    <button 
                      className="action-btn-premium primary"
                      onClick={() => navigate('/rides')}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="10" r="8"/>
                        <path d="M10 6v8m-4-4h8"/>
                      </svg>
                      Find Rides
                    </button>
                    <button 
                      className="action-btn-premium secondary"
                      onClick={() => navigate('/rides/create')}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                      Offer Ride
                    </button>
                  </div>
                )}

                <div className="features-grid-premium">
                  <div className="feature-item-premium">
                    <div className="feature-icon">🔒</div>
                    <div className="feature-text">
                      <h4>Secure</h4>
                      <p>End-to-end encrypted</p>
                    </div>
                  </div>
                  <div className="feature-item-premium">
                    <div className="feature-icon">⚡</div>
                    <div className="feature-text">
                      <h4>Real-time</h4>
                      <p>Instant messaging</p>
                    </div>
                  </div>
                  <div className="feature-item-premium">
                    <div className="feature-icon">👥</div>
                    <div className="feature-text">
                      <h4>Group Chats</h4>
                      <p>Connect with everyone</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
