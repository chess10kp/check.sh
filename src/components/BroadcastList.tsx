import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useBroadcasts } from '../hooks/useBroadcasts';
import { Broadcast } from '../types';
import { defaultTheme } from '../lib/themes';

interface BroadcastListProps {
  onSelectGame: (game: any) => void;
  onFetchGames: (roundId: string) => void;
  loadingGames?: boolean;
}

export default function BroadcastList({ onSelectGame, onFetchGames, loadingGames }: BroadcastListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { broadcasts, loading, error, refresh } = useBroadcasts();

  useEffect(() => {
    setSelectedIndex(0);
  }, [broadcasts]);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(broadcasts.length - 1, i + 1));
    } else if (key.return) {
      if (broadcasts.length === 0) {
        return;
      }
      
      const selected = broadcasts[selectedIndex];
      
      if (selected && selected.rounds && selected.rounds.length > 0) {
        const round = selected.rounds[0];
        onFetchGames(round.id);
      }
    } else if (key.escape) {
      process.exit(0);
    } else if (input === 'r') {
      refresh();
    } else if (input === 'q') {
      process.exit(0);
    }
  });

  if (loading || loadingGames) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="yellow">{loading ? 'Loading broadcasts...' : 'Loading games...'}</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold marginBottom={1} color={defaultTheme.accent}>Available Broadcasts:</Text>
      {broadcasts.map((broadcast, index) => (
        <Box key={broadcast.tour.id}>
          <Box backgroundColor={index === selectedIndex ? defaultTheme.highlight : undefined} paddingX={1}>
            <Text>
              {index === selectedIndex ? '▶ ' : '  '}
              {broadcast.tour.name} - {broadcast.rounds && broadcast.rounds[0] ? broadcast.rounds[0].name : 'No rounds'}
            </Text>
          </Box>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="gray">
          [↑/k] Up  [↓/j] Down  [Enter] Fetch Games  [r] Refresh  [q/Esc] Quit
        </Text>
      </Box>
    </Box>
  );
}
