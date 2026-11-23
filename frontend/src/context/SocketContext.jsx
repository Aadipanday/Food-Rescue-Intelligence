import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Compute Socket server URL
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const socketUrl = rawApiUrl.replace(/\/api\/?$/, '');

  useEffect(() => {
    const token = localStorage.getItem('token') || '';

    // Initialize socket connection
    const socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join org room if user has organization
      if (user?.organization) {
        const orgId = typeof user.organization === 'object' ? user.organization._id : user.organization;
        socket.emit('join_org_room', orgId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const joinRescueRoom = (rescueId) => {
    if (socketRef.current && rescueId) {
      socketRef.current.emit('join_rescue_room', rescueId);
    }
  };

  const leaveRescueRoom = (rescueId) => {
    if (socketRef.current && rescueId) {
      socketRef.current.emit('leave_rescue_room', rescueId);
    }
  };

  const sendDriverLocation = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('driver_location_update', data);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinRescueRoom,
        leaveRescueRoom,
        sendDriverLocation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      joinRescueRoom: () => {},
      leaveRescueRoom: () => {},
      sendDriverLocation: () => {},
    };
  }
  return context;
};

export default SocketContext;
