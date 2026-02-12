// Firestore schema for Flip 7 card game

// Card representation
export type CardType = "number" | "modifier" | "action";
export type ModifierValue = "+2" | "+4" | "+10" | "x2";
export type ActionValue = "freeze" | "flip-three" | "second-chance";

export interface Card {
  id: string;
  type: CardType;
  value: number | ModifierValue | ActionValue;
  label: string; // display name
}

// Player in a room
export interface RoomPlayer {
  uid: string;
  displayName: string;
  photoURL: string | null;
  joinedAt: number; // timestamp
}

// Player status in a round
export type PlayerStatus = "active" | "stayed" | "busted" | "frozen";

// Player's hand in a round
export interface PlayerHand {
  cards: Card[];
  score: number;
  status: PlayerStatus;
  hasSecondChance: boolean;
}

// Room document (rooms collection)
export type RoomStatus = "waiting" | "playing" | "finished";

export interface Room {
  id: string;
  code: string; // 6-char room code
  hostId: string;
  status: RoomStatus;
  players: RoomPlayer[];
  currentRound: number;
  targetScore: number; // default 200
  createdAt: number;
}

// Round sub-document (rooms/{id}/rounds/{n})
export interface Round {
  roundNumber: number;
  playerHands: Record<string, PlayerHand>; // keyed by uid
  turnOrder: string[]; // uid array
  currentTurnIndex: number;
  isComplete: boolean;
}

// Completed game document (games collection)
export interface GameRecord {
  id: string;
  roomCode: string;
  players: RoomPlayer[];
  rounds: RoundSummary[];
  finalScores: Record<string, number>; // uid → total
  winnerId: string;
  createdAt: number;
  duration: number; // ms
}

export interface RoundSummary {
  roundNumber: number;
  scores: Record<string, number>; // uid → round score
  hands: Record<string, Card[]>; // uid → cards drawn
}

// User profile document (users collection)
export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestRoundScore: number;
}
