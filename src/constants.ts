// Session Phases
export const PHASE = {
  LOBBY: 'lobby',
  VOTING: 'voting',
  REVEALING: 'revealing',
  RESULTS: 'results',
} as const;

// Participant Roles
export const ROLE = {
  MODERATOR: 'moderator',
  VOTER: 'voter',
  OBSERVER: 'observer',
} as const;

// Participant Status
export const STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  IDLE: 'idle',
} as const;

// Card Decks
export const DECK = {
  FIBONACCI: ['0', '1', '2', '3', '5', '8', '13', '21', '?', 'coffee'],
  T_SHIRT: ['XS', 'S', 'M', 'L', 'XL', '?', 'coffee'],
  POWERS_OF_TWO: ['0', '1', '2', '4', '8', '16', '32', '64', '?', 'coffee'],
} as const;

// Configuration Defaults
export const CONFIG = {
  CONSENSUS_THRESHOLD_PERCENT: 70,
  LATENCY_MS: 300,
  DEFAULT_DECK: DECK.FIBONACCI,
} as const;

// Special Vote Values
export const VOTE = {
  UNKNOWN: '?',
  COFFEE: 'coffee',
} as const;

