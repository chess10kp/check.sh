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
  const squares = parseFenToSquares(fen);

  return (
    <Box flexDirection="column">
      {squares.map((row, rankIndex) => (
        <Box key={`rank-${rankIndex}`} flexDirection="row">
          <Box width={1} justifyContent="center">
            <Text color="gray">{8 - rankIndex}</Text>
          </Box>
          {row.map((square, fileIndex) => {
            const file = String.fromCharCode(97 + fileIndex);
            const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
            const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
            const isLastMove = lastMove && (lastMove.from === square.position || lastMove.to === square.position);

            return (
              <Box
                key={`${file}${8 - rankIndex}`}
                width={3}
                justifyContent="center"
                backgroundColor={isLastMove ? defaultTheme.highlight : bgColor}
              >
                <Text color={square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack}>
                  {square.piece ? getPieceSymbol(square.piece.color, square.piece.type) : ' '}
                </Text>
              </Box>
            );
          })}
        </Box>
      ))}
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
  const boardState = fen.split(' ')[0];
  const rows = boardState.split('/');
  return rows.map(row => {
    const squares: Square[] = [];
    let fileIndex = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < parseInt(char); i++) {
          squares.push({ position: '', piece: null });
          fileIndex++;
        }
      } else {
        squares.push({
          position: `${String.fromCharCode(97 + fileIndex)}${8 - rows.indexOf(row)}`,
          piece: parsePieceChar(char),
        });
        fileIndex++;
      }
    }
    return squares;
  });
}

function parsePieceChar(char: string) {
  const color = char === char.toUpperCase() ? 'white' : 'black';
  const type = char.toLowerCase() as 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
  return { color, type };
}

interface Square {
  position: string;
  piece: { color: 'white' | 'black'; type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' } | null;
}
