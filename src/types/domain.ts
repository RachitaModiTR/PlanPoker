/**
 * Domain types for Planning Poker application.
 * These types mirror the expected FastAPI WebSocket payloads.
 */

// --- Enums ---

/**
 * Role of a participant in the session.
 */
export type ParticipantRole = 'moderator' | 'voter' | 'observer';

/**
 * Status of a participant's connection or activity.
 */
export type ParticipantStatus = 'connected' | 'disconnected' | 'idle';

/**
 * Current phase of the session or the current round.
 */
export type SessionPhase = 'lobby' | 'voting' | 'revealing' | 'results';

/**
 * Represents the value of a vote.
 * Can be a number (points) or special strings ("?", "coffee").
 */
export type VoteValue = number | string | null;

// --- Entities ---

/**
 * Basic user information.
 */
export interface User {
  /** Unique identifier for the user. */
  id: string;
  /** Display name of the user. */
  name: string;
  /** Optional URL to an avatar image. */
  avatarUrl?: string;
}

/**
 * A user participating in a specific session.
 * Extends User with session-specific context.
 */
export interface Participant extends User {
  /** The role of the user in this session (e.g., who can control the flow). */
  role: ParticipantRole;
  /** Current connection or activity status. */
  status: ParticipantStatus;
  /**
   * Has the participant cast a vote for the current item?
   * Useful for showing 'voted' status without revealing the value.
   */
  hasVoted: boolean;
}

/**
 * A single vote cast by a participant.
 */
export interface Vote {
  /** ID of the user who cast the vote. */
  userId: string;
  /** The value of the vote. Null if retracted or not yet cast. */
  value: VoteValue;
  /** Timestamp when the vote was cast (ISO string). */
  timestamp: string;
}

/**
 * An item of work to be estimated.
 */
export interface WorkItem {
  /** Unique identifier for the work item. */
  id: string;
  /** Title or summary of the task. */
  title: string;
  /** Detailed description or acceptance criteria. */
  description?: string;
  /** The final agreed estimation value. Null if not yet decided. */
  agreedEstimate: VoteValue | null;
  /** External link (e.g., to Jira/GitHub issue). */
  linkUrl?: string;
}

/**
 * The full state of a Planning Poker session.
 */
export interface Session {
  /** Unique identifier for the session (room code). */
  id: string;
  /** Name of the session. */
  name: string;
  /** ID of the user who created/moderates the session. */
  moderatorId: string;
  /** List of all participants in the session. */
  participants: Participant[];
  /** List of work items to be estimated. */
  workItems: WorkItem[];
  /** ID of the work item currently being voted on. Null if none. */
  activeWorkItemId: string | null;
  /** Current phase of the active round. */
  phase: SessionPhase;
  /**
   * Map of User ID to their current Vote for the active item.
   * Only populated with values during 'revealing' or 'results' phase.
   * During 'voting', this might only indicate presence of a vote if sent to clients.
   */
  votes: Record<string, Vote>;
  /** Configuration settings for the session (e.g., card deck used). */
  settings: {
    cardDeck: string[]; // e.g., ['0', '1', '2', '3', '5', '8', ...]
    autoReveal: boolean;
  };
}

/**
 * A snapshot of the session state sent via WebSocket.
 * Used to synchronize client state with the server.
 */
export interface SessionSnapshot {
  /** The full session object. */
  session: Session;
  /** Timestamp of the snapshot generation. */
  timestamp: string;
  /** Sequence number to handle out-of-order updates if necessary. */
  sequenceId: number;
}

