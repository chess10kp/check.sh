import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Game } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';

interface GamesListProps {
  games: Game[];
  roundName: string;
  onSelectGame: (game: Game) => void;
  onBack: () => void;
}

export default function GamesList({
  games,
  roundName,
  onSelectGame,
  onBack,
}: GamesListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(games.length - 1, i + 1));
    } else if (key.return) {
      if (games.length === 0) {
        return;
      }
      onSelectGame(games[selectedIndex]);
    } else if (key.escape || input === 'q') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color={defaultTheme.accent}>
        {roundName}
      </Text>
      <Text marginBottom={1} color="gray">
        Select a game ({games.length} available):
      </Text>
      {games.length === 0 ? (
        <Box padding={1}>
          <Text color="gray">No games available</Text>
        </Box>
      ) : (
        games.map((game, index) => {
          const white = game.players[0];
          const black = game.players[1];
          const gameTitle = `${white?.name || '?'} vs ${black?.name || '?'}`;

          return (
            <Box key={index}>
              <Box
                backgroundColor={index === selectedIndex ? defaultTheme.highlight : undefined}
                paddingX={1}
              >
                <Text>
                  {index === selectedIndex ? '▶ ' : '  '}
                  {gameTitle}
                  {game.status && (
                    <Text color="gray"> {game.status}</Text>
                  )}
                </Text>
              </Box>
            </Box>
          );
        })
      )}
      <Box marginTop={1}>
        <Text color="gray">
          [↑/k] Up  [↓/j] Down  [Enter] Select Game  [q/Esc] Back
        </Text>
      </Box>
    </Box>
  );
}
