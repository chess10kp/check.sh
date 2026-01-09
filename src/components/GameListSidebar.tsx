import { Box, Text } from 'ink';
import { Game } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';
import ScrollView, { truncateText } from './ScrollView.js';

interface GameListSidebarProps {
  games: Game[];
  selectedIndex: number;
  viewedGameIndex: number;
  hasFocus: boolean;
}

export default function GameListSidebar({
  games,
  selectedIndex,
  viewedGameIndex,
  hasFocus,
}: GameListSidebarProps) {
  const maxNameWidth = 35;

  return (
    <Box
      flexDirection="column"
      width={45}
      borderStyle="single"
      borderColor={hasFocus ? 'cyan' : 'gray'}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color={hasFocus ? 'cyan' : 'gray'}>
          Games ({games.length})
        </Text>
      </Box>

      <ScrollView
        height={18}
        selectedIndex={selectedIndex}
      >
        {games.map((game, index) => {
          const white = game.players[0];
          const black = game.players[1];
          const gameTitle = `${white?.name || '?'} vs ${black?.name || '?'}`;
          const isViewed = index === viewedGameIndex;
          const isSelected = index === selectedIndex;

          return (
            <Box key={game.id || index}>
              <Box
                backgroundColor={isViewed ? defaultTheme.highlight : undefined}
                paddingX={1}
                width="100%"
              >
                <Text>
                  {isSelected && !isViewed ? '> ' : '  '}
                  {truncateText(gameTitle, maxNameWidth)}
                  {game.status && (
                    <Text color="gray"> ({game.status})</Text>
                  )}
                </Text>
              </Box>
            </Box>
          );
        })}
      </ScrollView>
    </Box>
  );
}
