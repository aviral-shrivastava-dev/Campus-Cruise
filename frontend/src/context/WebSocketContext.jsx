import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { addNotification, showToast, showSuccess, showError } = useNotification();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      reconnectAttempts.current += 1;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        addNotification({
          type: 'error',
          message: 'Unable to connect to real-time services. Please refresh the page.'
        });
      }
    });

    newSocket.on('authenticated', () => {
      console.log('WebSocket authenticated');
    });

    // Handle incoming notifications
    newSocket.on('notification', (notification) => {
      addNotification({
        type: notification.type || 'info',
        message: notification.message,
        data: notification.data
      });
    });

    // Handle booking notifications
    newSocket.on('booking_created', (data) => {
      addNotification({
        type: 'booking',
        message: data.message || `New booking from ${data.passengerName}`,
        data: { rideId: data.rideId }
      });
      
      // Show toast for important booking events
      showSuccess(data.message || `New booking from ${data.passengerName}`);
    });

    // Handle cancellation notifications
    newSocket.on('booking_cancelled', (data) => {
      addNotification({
        type: 'cancellation',
        message: data.message || `Booking cancelled by ${data.passengerName}`,
        data: { rideId: data.rideId }
      });
      
      showToast(data.message || `Booking cancelled by ${data.passengerName}`, 'warning');
    });

    newSocket.on('ride_cancelled', (data) => {
      addNotification({
        type: 'cancellation',
        message: data.message || `Ride cancelled: ${data.source} to ${data.destination}`,
        data: { rideId: data.rideId }
      });
      
      showError(data.message || `Ride cancelled: ${data.source} to ${data.destination}`);
    });

    // Handle ride updates
    newSocket.on('ride_updated', (data) => {
      addNotification({
        type: 'ride',
        message: data.message || 'Ride information updated',
        data: { rideId: data.rideId }
      });
    });

    // Handle full capacity notification
    newSocket.on('ride_full', (data) => {
      addNotification({
        type: 'success',
        message: data.message || 'Your ride is now full!',
        data: { rideId: data.rideId }
      });
      
      showSuccess(data.message || 'Your ride is now full!');
    });

    // Handle new message notifications
    newSocket.on('message_received', (data) => {
      // Only show notification if not in the chat page
      if (!window.location.pathname.includes('/messages')) {
        addNotification({
          type: 'message',
          message: data.message || `New message from ${data.senderName}`,
          data: { conversationId: data.conversationId }
        });
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token, addNotification]);

  // Emit event to server
  const emit = useCallback((event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }, [socket, connected]);

  // Subscribe to event
  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  // Unsubscribe from event
  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  const value = {
    socket,
    connected,
    emit,
    on,
    off
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketContext;
