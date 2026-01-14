import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Session, 
  SessionSnapshot, 
  User, 
  VoteValue, 
  Vote, 
  SessionPhase 
} from '../types/domain';

interface SessionState {
  currentUser: User | null;
  session: Session | null;
  isConnected: boolean;
  themeMode: 'light' | 'dark'; // Add theme mode
  
  // Actions
  joinSession: (user: User, sessionId: string) => void;
  leaveSession: () => void;
  castVote: (value: VoteValue) => void;
  revealVotes: () => void; // Admin/Moderator action
  clearVotes: () => void; // Admin/Moderator action
  resetSession: () => void;
  updateSessionSnapshot: (snapshot: SessionSnapshot) => void;
  setConnected: (connected: boolean) => void;
  toggleTheme: () => void; // Action to toggle theme
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      currentUser: null,
      session: null,
      isConnected: false,
      themeMode: (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light',

      joinSession: (user, _sessionId) => {
        // In a real app, this would trigger a WebSocket connection or API call
        // For now, we just update the local user state and mock a session if none exists
        set({ 
          currentUser: user,
          // Optimistic update or placeholder until snapshot is received
        });
      },

      leaveSession: () => {
        set({ session: null, isConnected: false });
      },

      castVote: (value) => {
        const { currentUser, session } = get();
        if (!currentUser || !session) return;

        // Optimistic update for local user's vote
        // In reality, this would be sent to server first
        const newVote: Vote = {
          userId: currentUser.id,
          value: value,
          timestamp: new Date().toISOString(),
        };

        const updatedVotes = { ...session.votes, [currentUser.id]: newVote };
        
        // Update participant status as well
        const updatedParticipants = session.participants.map(p => 
          p.id === currentUser.id ? { ...p, hasVoted: true } : p
        );

        set({
          session: {
            ...session,
            votes: updatedVotes,
            participants: updatedParticipants
          }
        });
      },

      revealVotes: () => {
        // This is typically a server-side action trigger
        // Optimistic local update
        const { session } = get();
        if (!session) return;
        
        set({
          session: {
            ...session,
            phase: 'revealing' as SessionPhase
          }
        });
      },

      clearVotes: () => {
        // Typically server-side trigger
        const { session } = get();
        if (!session) return;

        set({
          session: {
            ...session,
            votes: {},
            phase: 'voting' as SessionPhase,
            participants: session.participants.map(p => ({ ...p, hasVoted: false }))
          }
        });
      },

      resetSession: () => {
        set({ session: null, currentUser: null, isConnected: false });
      },

      updateSessionSnapshot: (snapshot: SessionSnapshot) => {
        // This is the main sync mechanism from WebSocket
        set({ 
          session: snapshot.session,
          // Potential to handle sequenceId logic here
        });
      },

      setConnected: (connected: boolean) => {
        set({ isConnected: connected });
      },

      toggleTheme: () => {
        const { themeMode } = get();
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        localStorage.setItem('themeMode', newMode);
        set({ themeMode: newMode });
      }
    }),
    { name: 'SessionStore' }
  )
);

