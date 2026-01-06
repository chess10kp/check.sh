import React from 'react';
import { Box, Text, useInput } from 'ink';
import ChessBoard from './ChessBoard';
import PlayerInfo from './PlayerInfo';
import MoveHistory from './MoveHistory';
import { Game } from '../types';
import { defaultTheme } from '../lib/themes';

interface GameViewProps {
  game: Game;
  onBack: () => void;
}

export default function GameView({ game, onBack }: GameViewProps) {
  const whitePlayer = game.players[0];
  const blackPlayer = game.players[1];

  useInput((input) => {
    if (input === 'q') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" paddingX={1} marginBottom={1}>
        <Text bold color={defaultTheme.accent}>{game.name}</Text>
      </Box>

      <Box flexDirection="row">
        <Box paddingRight={2}>
          <ChessBoard fen={game.fen} lastMove={game.lastMove ? { from: game.lastMove.substring(0, 2), to: game.lastMove.substring(2, 4) } : undefined} />
        </Box>

        <Box flexDirection="column" width={40}>
          {whitePlayer && (
            <PlayerInfo
              player={whitePlayer}
              isWhite={true}
              isActive={game.status === 'playing'}
            />
          )}
          {blackPlayer && (
            <PlayerInfo
              player={blackPlayer}
              isWhite={false}
              isActive={game.status === 'playing'}
            />
          )}

          <Box marginTop={1}>
            <MoveHistory moves={game.moves} />
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} borderStyle="single" paddingX={1}>
        <Text color="gray">[q] Return to list</Text>
      </Box>
    </Box>
  );
}
