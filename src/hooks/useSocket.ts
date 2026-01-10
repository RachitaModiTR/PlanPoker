import { useEffect, useRef } from 'react';
import { socketService } from '../services/socketService'; // Changed from mockSocketService
import { useSessionStore } from '../store/sessionStore';
import { User } from '../types/domain';

// Hook to manage socket connection lifecycle
export const useSocket = (sessionId: string | undefined, user: User | null) => {
  const isConnected = useSessionStore(state => state.isConnected);
  
  // Use a ref to ensure stable reference to the service
  const serviceRef = useRef(socketService);

  useEffect(() => {
    if (!sessionId || !user) return;

    const service = serviceRef.current;
    
    // Connect
    service.connect(sessionId, user);

    // Cleanup on unmount or when dependencies change
    return () => {
      service.disconnect();
    };
  }, [sessionId, user?.id]); // Reconnect only if session or user changes

  return {
    isConnected,
    socketService: serviceRef.current
  };
};
