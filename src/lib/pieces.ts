type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PieceColor = 'white' | 'black';
type PieceSize = 'small' | 'compact' | 'extended' | 'large';

export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export const COMPACT_PIECES: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '\n    ✚   \n   ███  ',
    queen: '\n    ◈   \n   ███  ',
    rook: '\n ▙█▟\n ███',
    bishop: '\n    ⭘   \n   ███  ',
    knight: '\n▞█▙\n ██',
    pawn: '\n ▟▙\n ██',
  },
  black: {
    king: '\n    ✚   \n   ███  ',
    queen: '\n    ◈   \n   ███  ',
    rook: '\n ▙█▟\n ███',
    bishop: '\n    ⭘   \n   ███  ',
    knight: '\n▞█▙\n ██',
    pawn: '\n ▟▙\n ██',
  },
};

export function getPieceSymbol(color: PieceColor, type: PieceType, size: PieceSize = 'small'): string {
  if (size === 'small') {
    return PIECE_SYMBOLS[color][type];
  }
  return COMPACT_PIECES[color][type];
}

export function determinePieceSize(cellHeight: number): PieceSize {
  if (cellHeight < 3) return 'small';
  if (cellHeight < 4) return 'compact';
  if (cellHeight < 5) return 'extended';
  return 'large';
}
