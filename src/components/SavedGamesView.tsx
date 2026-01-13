import { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Game } from '../types/index.js';
import { getFavorites, removeFavorite, FavoriteGame } from '../lib/cache.js';
import { defaultTheme } from '../lib/themes.js';
import HelpBar from './HelpBar.js';
import ScrollView, { truncateText } from './ScrollView.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface SavedGamesViewProps {
  onSelectGame: (game: Game) => void;
  onBack: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getGameResult(game: Game): string {
  if (game.winner === 'white') return '1-0';
  if (game.winner === 'black') return '0-1';
  if (game.status === 'draw') return '½-½';
  if (game.status === 'playing' || game.status === 'started') return '*';
  return '?';
}

export default function SavedGamesView({ onSelectGame, onBack }: SavedGamesViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [favorites, setFavorites] = useState<FavoriteGame[]>([]);
  const [loading, setLoading] = useState(true);
  const { height: terminalHeight } = useTerminalSize(150);

  const scrollViewHeight = useMemo(() => {
    const APP_HEADER_HEIGHT = 4;
    const LOCAL_HEADER_HEIGHT = 2;
    const PADDING = 2;
    const HELPBAR_HEIGHT = 1;
    return Math.max(5, terminalHeight - APP_HEADER_HEIGHT - LOCAL_HEADER_HEIGHT - PADDING - HELPBAR_HEIGHT);
  }, [terminalHeight]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    const data = await getFavorites();
    setFavorites(data.games.sort((a, b) => b.savedAt - a.savedAt));
    setLoading(false);
  };

  const handleDelete = async () => {
    const favorite = favorites[selectedIndex];
    if (favorite?.game.id) {
      await removeFavorite(favorite.game.id);
      await loadFavorites();
      if (selectedIndex >= favorites.length - 1) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }
    }
  };

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onBack();
    } else if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(favorites.length - 1, i + 1));
    } else if (key.return) {
      const favorite = favorites[selectedIndex];
      if (favorite) {
        onSelectGame(favorite.game);
      }
    } else if (input === 'd' || key.delete) {
      handleDelete();
    } else if (input === 'r') {
      loadFavorites();
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">Loading saved games...</Text>
      </Box>
    );
  }

  if (favorites.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={defaultTheme.accent}>Saved Games</Text>
        <Box marginTop={1}>
          <Text color="gray">No saved games yet. Press 's' while viewing a game to save it.</Text>
        </Box>
        <Box marginTop={2}>
          <HelpBar shortcuts="[q/Esc] Back" />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Box marginBottom={1}>
          <Text bold color={defaultTheme.accent}>Saved Games </Text>
          <Text color="gray">({favorites.length} game{favorites.length !== 1 ? 's' : ''})</Text>
        </Box>
        <ScrollView
          height={scrollViewHeight}
          selectedIndex={selectedIndex}
        >
          {favorites.map((favorite, index) => {
            const { game, savedAt } = favorite;
            const white = game.players[0];
            const black = game.players[1];
            const result = getGameResult(game);
            const moveCount = game.fenHistory ? Math.floor((game.fenHistory.length - 1) / 2) : 0;

            return (
              <Box
                key={game.id}
                backgroundColor={index === selectedIndex ? defaultTheme.highlight : undefined}
                paddingX={1}
                flexDirection="column"
              >
                <Box>
                  <Text>
                    {index === selectedIndex ? '▶ ' : '  '}
                    <Text color="white" bold>{truncateText(white?.name ?? 'Unknown', 20)}</Text>
                    {white?.rating ? <Text color="gray"> ({white.rating})</Text> : null}
                    <Text color="gray"> vs </Text>
                    <Text color="white" bold>{truncateText(black?.name ?? 'Unknown', 20)}</Text>
                    {black?.rating ? <Text color="gray"> ({black.rating})</Text> : null}
                    <Text color="yellow" bold> {result}</Text>
                  </Text>
                </Box>
                <Box paddingLeft={4}>
                  <Text color="gray" dimColor>
                    {moveCount} moves • Saved {formatDate(savedAt)}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </ScrollView>
      </Box>
      <HelpBar shortcuts="[↑/k] Up  [↓/j] Down  [Enter] View  [d] Delete  [r] Refresh  [q/Esc] Back" />
    </Box>
  );
}
