import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useLichessStream } from '../hooks/useLichessStream';
import { streamGame } from '../lib/lichess-api';
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
  const { data: streamData } = useLichessStream(
    `https://lichess.org/api/broadcast/round/${game.id}/games`,
    process.env.LICHESS_TOKEN
  );

  useInput((input) => {
    if (input === 'q') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" paddingX={1} marginBottom={1}>
        <Text bold color={defaultTheme.accent}>Tournament Game</Text>
      </Box>

      <Box flexDirection="row">
        <Box paddingRight={2}>
          <ChessBoard fen={game.fen} lastMove={game.lastMove} />
        </Box>

        <Box flexDirection="column" width={40}>
          <PlayerInfo
            player={game.white}
            isWhite={true}
            isActive={game.status === 'playing'}
          />
          <PlayerInfo
            player={game.black}
            isWhite={false}
            isActive={game.status === 'playing'}
          />

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
