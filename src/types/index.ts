// TypeScript types for Lichess TUI Viewer
// Based on SPEC.md section 3.5

export interface Broadcast {
  tour: {
    id: string;
    name: string;
    description: string;
    url: string;
    markdown: string;
    tier: "official" | "high" | "medium" | "low";
  };
  rounds: BroadcastRound[];
}

export interface BroadcastRound {
  id: string;
  name: string;
  url: string;
  games: Game[];
}

export interface Player {
  id: string;
  username: string;
  title?: "GM" | "IM" | "FM" | "WGM" | "WIM" | "WFM" | "NM" | "CM" | "WCM";
  rating: number;
  clock?: {
    white: number;
    black: number;
  };
}

export interface Game {
  id: string;
  white: Player;
  black: Player;
  status: GameStatus;
  moves: string; // PGN notation
  fen: string;
  lastMove?: {
    from: string;
    to: string;
  };
}

export type GameStatus =
  | "started"
  | "playing"
  | "aborted"
  | "mate"
  | "draw"
  | "resign"
  | "stalemate"
  | "timeout"
  | "outoftime";

export type ViewState = "broadcast-list" | "game-view";

export interface ErrorState {
  message: string;
  retryCount: number;
  canRetry: boolean;
  lastError: Error | null;
}
