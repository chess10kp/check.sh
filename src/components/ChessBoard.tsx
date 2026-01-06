import React from 'react';
import { Box, Text } from 'ink';
import { getPieceSymbol } from '../lib/pieces';
import { rgbToInkColor, defaultTheme } from '../lib/themes';

interface ChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string };
}

interface Square {
  position: string;
  piece: { color: 'white' | 'black'; type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' } | null;
}

export default function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  const effectiveFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  console.log('[ChessBoard] Rendering with FEN:', effectiveFen);
  const squares = parseFenToSquares(effectiveFen);
  console.log('[ChessBoard] Parsed squares:', squares.length, 'rows');

  return (
    <Box flexDirection="column">
      {squares.map((row, rankIndex) => {
        const pieceCount = row.filter(s => s.piece !== null).length;
        console.log(`[ChessBoard Render] Row ${rankIndex} (${8-rankIndex}): ${pieceCount} pieces`);

        return (
          <Box key={`rank-${rankIndex}`} flexDirection="row">
            <Box width={1} justifyContent="center">
              <Text color="gray">{8 - rankIndex}</Text>
            </Box>
            {row.map((square, fileIndex) => {
            const file = String.fromCharCode(97 + fileIndex);
            const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
            const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
            const isLastMove = lastMove && (lastMove.from === square.position || lastMove.to === square.position);

            const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;
            const symbol = square.piece ? getPieceSymbol(square.piece.color, square.piece.type) : ' ';

            console.log(`[Render Square] ${square.position}: piece=${square.piece ? `${square.piece.color} ${square.piece.type}` : 'empty'}, symbol=${symbol}, color=${pieceColor}`);

            return (
              <Box
                key={`${file}${8 - rankIndex}`}
                width={3}
                justifyContent="center"
                backgroundColor={isLastMove ? defaultTheme.highlight : bgColor}
              >
                <Text color={pieceColor}>
                  {symbol}
                </Text>
              </Box>
            );
            })}
          </Box>
        );
      })}
      <Box flexDirection="row">
        <Box width={1} />
        {'abcdefgh'.split('').map(file => (
          <Box key={file} width={3} justifyContent="center">
            <Text color="gray">{file}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function parseFenToSquares(fen: string): Square[][] {
  console.log('[parseFenToSquares] Input FEN:', fen);
  const boardState = fen.split(' ')[0];
  const rows = boardState.split('/');
  console.log('[parseFenToSquares] Split into rows:', rows.length);

  const result = rows.map((row, rowIndex) => {
    const squares: Square[] = [];
    let fileIndex = 0;
    console.log(`[parseFenToSquares] Row ${rowIndex} (${row}):`);

    for (const char of row) {
      if (/\d/.test(char)) {
        const emptyCount = parseInt(char);
        for (let i = 0; i < emptyCount; i++) {
          const pos = `${String.fromCharCode(97 + fileIndex)}${8 - rowIndex}`;
          squares.push({ position: pos, piece: null });
          fileIndex++;
        }
      } else {
        const pos = `${String.fromCharCode(97 + fileIndex)}${8 - rowIndex}`;
        const piece = parsePieceChar(char);
        squares.push({ position: pos, piece });
        fileIndex++;
      }
    }
    console.log(`[parseFenToSquares] Row ${rowIndex} parsed to ${squares.length} squares`);
    return squares;
  });

  console.log('[parseFenToSquares] Total squares:', result.length, 'x', result[0]?.length);
  return result;
}

function parsePieceChar(char: string) {
  const color = char === char.toUpperCase() ? 'white' : 'black';
  const pieceChar = char.toLowerCase();
  const typeMap: Record<string, 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'> = {
    'k': 'king',
    'q': 'queen',
    'r': 'rook',
    'b': 'bishop',
    'n': 'knight',
    'p': 'pawn',
  };
  const type = typeMap[pieceChar] || 'pawn';
  console.log(`[parsePieceChar] Char '${char}' -> color: ${color}, type: ${type}`);
  return { color, type };
}

interface Square {
  position: string;
  piece: { color: 'white' | 'black'; type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' } | null;
}
