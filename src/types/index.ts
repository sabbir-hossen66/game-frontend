export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  isHost?: boolean;
  isReady?: boolean;
  isMuted?: boolean;
  isMutedByHost?: boolean;
  isSpeaking?: boolean;
  socketId?: string;
}

export interface UserStats {
  totalWins: number;
  gamesPlayed: number;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type GameType = 'rock-paper-scissors';

export interface RoomSettings {
  name: string;
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
  roundsToWin: number;
}

export interface Room {
  code: string;
  name: string;
  hostId: string;
  gameType: GameType;
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
  status: RoomStatus;
  players: Record<string, UserProfile>;
  roundsToWin: number;
  createdAt: number;
}

export interface RoomSummary {
  code: string;
  name: string;
  hostName: string;
  gameType: GameType;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  status: RoomStatus;
}

export type RpsChoice = 'rock' | 'paper' | 'scissors';

export interface RpsRoundHistory {
  round: number;
  p1Choice: RpsChoice;
  p2Choice: RpsChoice;
  winnerId: string | 'tie';
}

export type GamePhase =
  | 'idle'
  | 'countdown'
  | 'choosing'
  | 'revealing'
  | 'game_over';

export interface ClientRpsGameState {
  phase: GamePhase;
  round: number;
  targetScore: number;
  timerSeconds: number;
  playerIds: [string, string];
  scores: Record<string, number>;
  hasMadeChoice: Record<string, boolean>;
  myChoice: RpsChoice | null;
  revealedChoices: Record<string, RpsChoice> | null;
  lastRoundResult: {
    round: number;
    winnerId: string | 'tie';
    message: string;
  } | null;
  matchWinnerId: string | null;
  history: RpsRoundHistory[];
  rematchRequested: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  type: 'user' | 'system' | 'reaction';
  emoji?: string;
}

export interface WebRtcSignalPayload {
  senderUserId: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface VoicePeer {
  userId: string;
  peerConnection: RTCPeerConnection;
  stream?: MediaStream;
  isMuted: boolean;
  isSpeaking: boolean;
  volume: number; // 0 to 1
  isLocallyMuted: boolean;
}
