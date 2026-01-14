import { useState, useCallback, useMemo } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';

export interface AnalysisMove {
  san: string;       // Standard algebraic notation (e.g., "e4")
  uci: string;       // UCI format (e.g., "e2e4")
  fen: string;       // FEN after this move
}

export interface AnalysisState {
  isAnalyzing: boolean;
  cursorSquare: string;
  selectedSquare: string | null;
  currentMoveIndex: number;
  analysisMoves: AnalysisMove[];
  analysisStartIndex: number;  // Index in original game where analysis branched
}

interface UseAnalysisModeOptions {
  initialFenHistory: string[];
  initialMoveHistory: (string | undefined)[];
  initialMoveIndex: number;
  flipped?: boolean;
}

interface UseAnalysisModeReturn {
  state: AnalysisState;
  enterAnalysis: () => void;
  exitAnalysis: () => void;
  moveCursor: (direction: 'up' | 'down' | 'left' | 'right') => void;
  selectSquare: () => void;
  goToMove: (index: number) => void;
  nextMove: () => void;
  prevMove: () => void;
  currentFen: string;
  combinedMoves: string;
  totalMoveCount: number;
  isAnalysisMove: (moveIndex: number) => boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

function squareToCoords(square: string): { file: number; rank: number } {
  const file = FILES.indexOf(square[0]!);
  const rank = RANKS.indexOf(square[1]!);
  return { file, rank };
}

function coordsToSquare(file: number, rank: number): string {
  return `${FILES[file]}${RANKS[rank]}`;
}

export function useAnalysisMode({
  initialFenHistory,
  initialMoveHistory,
  initialMoveIndex,
  flipped = false,
}: UseAnalysisModeOptions): UseAnalysisModeReturn {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    cursorSquare: 'e4',
    selectedSquare: null,
    currentMoveIndex: initialMoveIndex,
    analysisMoves: [],
    analysisStartIndex: -1,
  });

  // Combined FEN history: original game + analysis moves
  const combinedFenHistory = useMemo(() => {
    if (state.analysisStartIndex < 0 || state.analysisMoves.length === 0) {
      return initialFenHistory;
    }
    const baseFens = initialFenHistory.slice(0, state.analysisStartIndex + 1);
    const analysisFens = state.analysisMoves.map(m => m.fen);
    return [...baseFens, ...analysisFens];
  }, [initialFenHistory, state.analysisStartIndex, state.analysisMoves]);

  // Combined move strings for display
  const combinedMoves = useMemo(() => {
    // Parse original moves from moveHistory (skip undefined first entry)
    const originalMoves = initialMoveHistory
      .slice(1)
      .filter((m): m is string => m !== undefined);
    
    if (state.analysisStartIndex < 0 || state.analysisMoves.length === 0) {
      // No analysis - just show original moves in SAN format
      // We need to convert UCI to SAN using the FEN history
      const sanMoves: string[] = [];
      for (let i = 0; i < originalMoves.length; i++) {
        const fen = initialFenHistory[i];
        if (fen) {
          try {
            const chess = new Chess(fen);
            const uci = originalMoves[i];
            if (uci) {
              const from = uci.substring(0, 2) as ChessSquare;
              const to = uci.substring(2, 4) as ChessSquare;
              const promotion = uci.length > 4 ? uci[4] : undefined;
              const move = chess.move({ from, to, promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined });
              if (move) {
                sanMoves.push(move.san);
              }
            }
          } catch {
            // Skip invalid moves
          }
        }
      }
      return sanMoves.join(' ');
    }
    
    // Mix of original and analysis moves
    const sanMoves: string[] = [];
    
    // Original moves up to analysis start
    for (let i = 0; i < state.analysisStartIndex; i++) {
      const fen = initialFenHistory[i];
      const uci = originalMoves[i];
      if (fen && uci) {
        try {
          const chess = new Chess(fen);
          const from = uci.substring(0, 2) as ChessSquare;
          const to = uci.substring(2, 4) as ChessSquare;
          const promotion = uci.length > 4 ? uci[4] : undefined;
          const move = chess.move({ from, to, promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined });
          if (move) {
            sanMoves.push(move.san);
          }
        } catch {
          // Skip
        }
      }
    }
    
    // Analysis moves
    for (const analysisMove of state.analysisMoves) {
      sanMoves.push(analysisMove.san);
    }
    
    return sanMoves.join(' ');
  }, [initialMoveHistory, initialFenHistory, state.analysisStartIndex, state.analysisMoves]);

  const currentFen = useMemo(() => {
    return combinedFenHistory[state.currentMoveIndex] ?? 
           initialFenHistory[initialFenHistory.length - 1] ?? 
           'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }, [combinedFenHistory, state.currentMoveIndex, initialFenHistory]);

  const totalMoveCount = combinedFenHistory.length;

  const isAnalysisMove = useCallback((moveIndex: number): boolean => {
    if (state.analysisStartIndex < 0) return false;
    return moveIndex > state.analysisStartIndex;
  }, [state.analysisStartIndex]);

  const enterAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      cursorSquare: 'e4',
      selectedSquare: null,
      analysisStartIndex: prev.currentMoveIndex,
      analysisMoves: [],
    }));
  }, []);

  const exitAnalysis = useCallback(() => {
    // Reset to the move where analysis started
    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      selectedSquare: null,
      currentMoveIndex: prev.analysisStartIndex >= 0 ? prev.analysisStartIndex : initialMoveIndex,
      analysisMoves: [],
      analysisStartIndex: -1,
    }));
  }, [initialMoveIndex]);

  const moveCursor = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setState(prev => {
      if (!prev.isAnalyzing) return prev;

      const { file, rank } = squareToCoords(prev.cursorSquare);
      let newFile = file;
      let newRank = rank;

      // When flipped, directions are reversed
      if (flipped) {
        switch (direction) {
          case 'up': newRank = Math.max(0, rank - 1); break;
          case 'down': newRank = Math.min(7, rank + 1); break;
          case 'left': newFile = Math.min(7, file + 1); break;
          case 'right': newFile = Math.max(0, file - 1); break;
        }
      } else {
        switch (direction) {
          case 'up': newRank = Math.min(7, rank + 1); break;
          case 'down': newRank = Math.max(0, rank - 1); break;
          case 'left': newFile = Math.max(0, file - 1); break;
          case 'right': newFile = Math.min(7, file + 1); break;
        }
      }

      return {
        ...prev,
        cursorSquare: coordsToSquare(newFile, newRank),
      };
    });
  }, [flipped]);

  const selectSquare = useCallback(() => {
    setState(prev => {
      if (!prev.isAnalyzing) return prev;

      // First selection - select "from" square
      if (prev.selectedSquare === null) {
        // Check if there's a piece on this square that can move
        try {
          const chess = new Chess(currentFen);
          const piece = chess.get(prev.cursorSquare as ChessSquare);
          if (piece) {
            // Check if it's the right color to move
            const turn = chess.turn();
            if (piece.color === turn) {
              return {
                ...prev,
                selectedSquare: prev.cursorSquare,
              };
            }
          }
        } catch {
          // Invalid state
        }
        return prev;
      }

      // Second selection - try to make move
      const from = prev.selectedSquare as ChessSquare;
      const to = prev.cursorSquare as ChessSquare;

      // Same square - deselect
      if (from === to) {
        return {
          ...prev,
          selectedSquare: null,
        };
      }

      try {
        const chess = new Chess(currentFen);
        
        // Check if this is a pawn promotion
        const piece = chess.get(from);
        const isPromotion = piece?.type === 'p' && 
          ((piece.color === 'w' && to[1] === '8') || 
           (piece.color === 'b' && to[1] === '1'));

        const move = chess.move({
          from,
          to,
          promotion: isPromotion ? 'q' : undefined, // Auto-queen
        });

        if (move) {
          const newAnalysisMove: AnalysisMove = {
            san: move.san,
            uci: move.from + move.to + (move.promotion || ''),
            fen: chess.fen(),
          };

          // If we're not at the end of current analysis, truncate
          const movesFromStart = prev.currentMoveIndex - prev.analysisStartIndex;
          const newAnalysisMoves = prev.analysisMoves.slice(0, movesFromStart);
          newAnalysisMoves.push(newAnalysisMove);

          return {
            ...prev,
            selectedSquare: null,
            analysisMoves: newAnalysisMoves,
            currentMoveIndex: prev.analysisStartIndex + newAnalysisMoves.length,
          };
        }
      } catch {
        // Invalid move - silently ignore
      }

      // Invalid move - just deselect
      return {
        ...prev,
        selectedSquare: null,
      };
    });
  }, [currentFen]);

  const goToMove = useCallback((index: number) => {
    setState(prev => {
      const maxIndex = prev.isAnalyzing 
        ? prev.analysisStartIndex + prev.analysisMoves.length
        : initialFenHistory.length - 1;
      
      const clampedIndex = Math.max(0, Math.min(index, maxIndex));
      
      return {
        ...prev,
        currentMoveIndex: clampedIndex,
      };
    });
  }, [initialFenHistory.length]);

  const nextMove = useCallback(() => {
    setState(prev => {
      const maxIndex = prev.isAnalyzing 
        ? prev.analysisStartIndex + prev.analysisMoves.length
        : initialFenHistory.length - 1;
      
      if (prev.currentMoveIndex < maxIndex) {
        return {
          ...prev,
          currentMoveIndex: prev.currentMoveIndex + 1,
        };
      }
      return prev;
    });
  }, [initialFenHistory.length]);

  const prevMove = useCallback(() => {
    setState(prev => {
      if (prev.currentMoveIndex > 0) {
        return {
          ...prev,
          currentMoveIndex: prev.currentMoveIndex - 1,
        };
      }
      return prev;
    });
  }, []);

  return {
    state,
    enterAnalysis,
    exitAnalysis,
    moveCursor,
    selectSquare,
    goToMove,
    nextMove,
    prevMove,
    currentFen,
    combinedMoves,
    totalMoveCount,
    isAnalysisMove,
  };
}
