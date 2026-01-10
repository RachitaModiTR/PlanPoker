import { useSessionStore } from '../store/sessionStore';
import { 
  Session, 
  SessionSnapshot, 
  Participant, 
  User,
  VoteValue
} from '../types/domain';
import { CONFIG } from '../constants';

const SIMULATED_LATENCY_MS = 300;

// Mock initial session data
const MOCK_SESSION_ID = 'demo-123';
const initialSession: Session = {
  id: MOCK_SESSION_ID,
  name: 'Sprint 42 Planning',
  moderatorId: 'user-1',
  participants: [],
  workItems: [
    { id: 'wi-1', title: 'Implement Login', description: 'User authentication via OAuth', agreedEstimate: null },
    { id: 'wi-2', title: 'Setup Database', agreedEstimate: 5 },
    { id: 'wi-3', title: 'Design Landing Page', agreedEstimate: null },
  ],
  activeWorkItemId: 'wi-1',
  phase: 'voting',
  votes: {},
  settings: {
    cardDeck: [...CONFIG.DEFAULT_DECK],
    autoReveal: false,
  }
};

const BOTS = [
  { id: 'bot-1', name: 'Alice (Bot)', avatarUrl: '' },
  { id: 'bot-2', name: 'Bob (Bot)', avatarUrl: '' },
  { id: 'bot-3', name: 'Charlie (Bot)', avatarUrl: '' }
];

class MockSocketService {
  private isConnected = false;
  private currentSession: Session = JSON.parse(JSON.stringify(initialSession));
  private botTimeouts: ReturnType<typeof setTimeout>[] = [];

  connect(sessionId: string, user: User) {
    if (this.isConnected) return;
    
    console.log(`[MockSocket] Connecting to session ${sessionId} as ${user.name}`);
    
    setTimeout(() => {
      this.isConnected = true;
      useSessionStore.getState().setConnected(true);
      
      // Add user to participants if not exists
      this.addParticipant(user);
      
      // Add bots if they aren't there yet
      this.addBots();

      this.broadcastSnapshot();
      
      // Bots start thinking/voting
      if (this.currentSession.phase === 'voting') {
        this.simulateBotVotes();
      }
    }, SIMULATED_LATENCY_MS);
  }

  disconnect() {
    if (!this.isConnected) return;
    console.log('[MockSocket] Disconnecting...');
    
    this.clearBotTimeouts();
    this.isConnected = false;
    useSessionStore.getState().setConnected(false);
  }

  send(event: string, payload: any) {
    if (!this.isConnected) {
      console.warn('[MockSocket] Cannot send message, not connected.');
      return;
    }

    console.log(`[MockSocket] Sending event: ${event}`, payload);

    setTimeout(() => {
      this.handleEvent(event, payload);
    }, SIMULATED_LATENCY_MS);
  }

  private handleEvent(event: string, payload: any) {
    switch (event) {
      case 'join_session':
        // Handled in connect usually, but if re-joining or specific logic needed
        break;
      
      case 'cast_vote':
        this.handleCastVote(payload);
        break;

      case 'reveal_votes':
        this.handleRevealVotes();
        break;
      
      case 'clear_votes':
        this.handleClearVotes();
        break;

      default:
        console.warn(`[MockSocket] Unknown event: ${event}`);
    }
  }

  private addParticipant(user: User) {
    const existing = this.currentSession.participants.find(p => p.id === user.id);
    if (!existing) {
      const participant: Participant = {
        ...user,
        role: this.currentSession.participants.length === 0 ? 'moderator' : 'voter',
        status: 'connected',
        hasVoted: false,
        jobRole: user.jobRole || 'Developer'
      };
      this.currentSession.participants.push(participant);
    } else {
        existing.status = 'connected';
    }
    // Note: broadcastSnapshot called by caller usually
  }

  private addBots() {
    BOTS.forEach(botUser => {
      const existing = this.currentSession.participants.find(p => p.id === botUser.id);
      if (!existing) {
        this.currentSession.participants.push({
          ...botUser,
          role: 'voter',
          status: 'connected',
          hasVoted: false,
          jobRole: 'Developer'
        });
      }
    });
  }

  private simulateBotVotes() {
    this.clearBotTimeouts();

    BOTS.forEach(bot => {
      // Random delay between 1s and 5s
      const delay = Math.random() * 4000 + 1000;
      
      const timeout = setTimeout(() => {
        if (!this.isConnected || this.currentSession.phase !== 'voting') return;

        // Pick a vote value. Bias towards 3, 5, 8.
        // Simple logic: pick from standard fibonacci subset
        const commonVotes = [3, 5, 8, 5, 5, 8]; 
        // 10% chance of random outlier
        const isOutlier = Math.random() < 0.1;
        
        let value: VoteValue;
        if (isOutlier) {
          value = Math.random() > 0.5 ? 21 : 1; 
        } else {
          value = commonVotes[Math.floor(Math.random() * commonVotes.length)];
        }

        // Apply vote locally
        this.handleCastVote({ userId: bot.id, value }, false); 
      }, delay);

      this.botTimeouts.push(timeout);
    });
  }

  private clearBotTimeouts() {
    this.botTimeouts.forEach(t => clearTimeout(t));
    this.botTimeouts = [];
  }

  private handleCastVote(payload: { userId: string; value: VoteValue }, broadcast = true) {
    const { userId, value } = payload;
    
    // Update vote record
    this.currentSession.votes[userId] = {
      userId,
      value,
      timestamp: new Date().toISOString()
    };

    // Update participant voted status
    const participant = this.currentSession.participants.find(p => p.id === userId);
    if (participant) {
      participant.hasVoted = true;
    }

    if (broadcast) {
      this.broadcastSnapshot();
    }
  }

  private handleRevealVotes() {
    this.currentSession.phase = 'revealing';
    this.clearBotTimeouts(); // Stop any pending bot votes
    this.broadcastSnapshot();
  }

  private handleClearVotes() {
    this.currentSession.votes = {};
    this.currentSession.participants.forEach(p => p.hasVoted = false);
    this.currentSession.phase = 'voting';
    this.broadcastSnapshot();
    
    // Start bot voting cycle again
    this.simulateBotVotes();
  }

  private broadcastSnapshot() {
    const snapshot: SessionSnapshot = {
      session: JSON.parse(JSON.stringify(this.currentSession)),
      timestamp: new Date().toISOString(),
      sequenceId: Date.now()
    };
    
    useSessionStore.getState().updateSessionSnapshot(snapshot);
  }
}

export const mockSocketService = new MockSocketService();
