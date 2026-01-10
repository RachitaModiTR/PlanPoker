import { User } from '../types/domain';
import { useSessionStore } from '../store/sessionStore';
import { SessionSnapshot } from '../types/domain';

// Determine WebSocket URL from environment or fallback to localhost
const getWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log('[SocketService] VITE_API_URL:', apiUrl);

  if (apiUrl) {
    if (apiUrl.startsWith('http')) {
      // https://backend.com -> wss://backend.com/ws
      return apiUrl.replace(/^http/, 'ws') + '/ws';
    } 
    if (apiUrl.startsWith('ws')) {
      // Already ws/wss
      return apiUrl + '/ws';
    }
    // Assume it's just the host (render property: host) -> wss://host/ws
    return `wss://${apiUrl}/ws`;
  }
  
  // Default fallback for local dev if not specified
  return 'ws://192.168.1.16:8000/ws';
};

const WS_BASE_URL = getWebSocketUrl();

/**
 * Real WebSocket service implementation.
 * Connects to the FastAPI backend.
 */
class SocketService {
  private socket: WebSocket | null = null;

  connect(sessionId: string, user: User) {
    if (this.socket) {
      this.socket.close();
    }

    // Construct URL with query params for auth/user info
    const params = new URLSearchParams({
      userId: user.id,
      name: user.name,
      jobRole: user.jobRole || 'Developer'
    });
    if (user.avatarUrl) {
      params.append('avatarUrl', user.avatarUrl);
    }

    const url = `${WS_BASE_URL}/${sessionId}?${params.toString()}`;
    console.log(`[SocketService] Connecting to ${url}`);

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[SocketService] Connected');
      useSessionStore.getState().setConnected(true);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Assuming the backend sends the raw SessionSnapshot object
        this.handleSnapshot(data);
      } catch (e) {
        console.error('[SocketService] Failed to parse message:', event.data);
      }
    };

    this.socket.onclose = () => {
      console.log('[SocketService] Disconnected');
      useSessionStore.getState().setConnected(false);
      this.socket = null;
      
      // Auto-reconnect logic could go here
    };

    this.socket.onerror = (error) => {
      console.error('[SocketService] Error:', error);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    useSessionStore.getState().setConnected(false);
  }

  send(event: string, payload: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[SocketService] Cannot send, socket not open');
      return;
    }

    const message = JSON.stringify({ event, payload });
    this.socket.send(message);
  }

  private handleSnapshot(snapshot: SessionSnapshot) {
    // Validate shape roughly?
    if (snapshot && snapshot.session) {
      useSessionStore.getState().updateSessionSnapshot(snapshot);
    } else {
      console.warn('[SocketService] Received invalid snapshot', snapshot);
    }
  }
}

export const socketService = new SocketService();
