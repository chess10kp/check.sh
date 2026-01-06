import React from 'react';
import { Box, Text } from 'ink';
import { BroadcastPlayer } from '../types';
import { defaultTheme } from '../lib/themes';

interface PlayerInfoProps {
  player: BroadcastPlayer;
  isWhite: boolean;
  isActive: boolean;
}

export default function PlayerInfo({ player, isWhite, isActive }: PlayerInfoProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="row">
        <Text color={isWhite ? defaultTheme.pieceWhite : defaultTheme.pieceBlack}>
          {isWhite ? '⬜' : '⬛'} {player.title || ''} {player.name}
        </Text>
        <Text color="gray"> ({player.rating})</Text>
      </Box>
      {player.clock !== undefined && (
        <Box paddingLeft={2}>
          <Text color={isActive ? 'yellow' : 'gray'}>
            ⏱️ {formatClock(player.clock)}
          </Text>
        </Box>
      )}
    </Box>
  );
}

function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
