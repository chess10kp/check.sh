import { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Game } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import MiniBoard from './MiniBoard.js';
import HelpBar from './HelpBar.js';
import ScrollView, { truncateText } from './ScrollView.js';

interface MultiBoardViewProps {
  games: Game[];
  roundName: string;
  onSelectGame: (game: Game) => void;
  onBack: () => void;
}

const MINI_BOARD_WIDTH = 25;
const BOARD_PADDING = 2;
const MIN_WIDTH_FOR_MULTI_BOARD = 60;
const MIN_HEIGHT_FOR_MULTI_BOARD = 20;

function GameCard({ 
  game, 
  isSelected, 
  maxNameWidth 
}: { 
  game: Game; 
  isSelected: boolean; 
  maxNameWidth: number;
}) {
  const white = game.players[0];
  const black = game.players[1];
  
  const whiteName = truncateText(
    `${white?.title ? white.title + ' ' : ''}${white?.name || '?'}`,
    maxNameWidth
  );
  const blackName = truncateText(
    `${black?.title ? black.title + ' ' : ''}${black?.name || '?'}`,
    maxNameWidth
  );

  const resultText = game.status === 'mate' || game.status === 'resign' 
    ? (game.winner === 'white' ? '1-0' : '0-1')
    : game.status === 'draw' || game.status === 'stalemate'
    ? '½-½'
    : game.status === 'playing' || game.status === 'started'
    ? '...'
    : '';

  return (
    <Box 
      flexDirection="column" 
      borderStyle={isSelected ? 'bold' : 'single'}
      borderColor={isSelected ? defaultTheme.accent : 'gray'}
      paddingX={1}
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={defaultTheme.text} bold>{whiteName}</Text>
        <Text color="gray">{white?.rating || ''}</Text>
      </Box>
      
      <MiniBoard fen={game.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'} />
      
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={defaultTheme.text} bold>{blackName}</Text>
        <Text color="gray">{black?.rating || ''}</Text>
      </Box>
      
      {resultText && (
        <Box justifyContent="center">
          <Text color={defaultTheme.accent}>{resultText}</Text>
        </Box>
      )}
    </Box>
  );
}

function ListView({ 
  games, 
  selectedIndex, 
  scrollViewHeight, 
  maxNameWidth 
}: { 
  games: Game[]; 
  selectedIndex: number; 
  scrollViewHeight: number;
  maxNameWidth: number;
}) {
  return (
    <ScrollView height={scrollViewHeight} selectedIndex={selectedIndex}>
      {games.map((game, index) => {
        const white = game.players[0];
        const black = game.players[1];
        const gameTitle = truncateText(
          `${white?.name || '?'} vs ${black?.name || '?'}`,
          maxNameWidth
        );

        return (
          <Box
            key={game.id || index}
            backgroundColor={index === selectedIndex ? defaultTheme.highlight : undefined}
            paddingX={1}
          >
            <Text>
              {index === selectedIndex ? '▶ ' : '  '}
              {gameTitle}
              {game.status && (
                <Text color="gray"> ({game.status})</Text>
              )}
              {game.fen && (
                <Text color="gray" dimColor> ✓</Text>
              )}
            </Text>
          </Box>
        );
      })}
    </ScrollView>
  );
}

export default function MultiBoardView({
  games,
  roundName,
  onSelectGame,
  onBack,
}: MultiBoardViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [forceListView, setForceListView] = useState(false);
  const { width: terminalWidth, height: terminalHeight } = useTerminalSize(150);

  const canUseMultiBoardLayout = useMemo(() => {
    return terminalWidth >= MIN_WIDTH_FOR_MULTI_BOARD && 
           terminalHeight >= MIN_HEIGHT_FOR_MULTI_BOARD;
  }, [terminalWidth, terminalHeight]);

  const useMultiBoardLayout = canUseMultiBoardLayout && !forceListView;

  const boardsPerRow = useMemo(() => {
    if (!useMultiBoardLayout) return 1;
    const availableWidth = terminalWidth - 4;
    return Math.max(1, Math.floor(availableWidth / (MINI_BOARD_WIDTH + BOARD_PADDING)));
  }, [terminalWidth, useMultiBoardLayout]);

  const scrollViewHeight = useMemo(() => {
    const APP_HEADER_HEIGHT = 4;
    const LOCAL_HEADER_HEIGHT = 1;
    const SUBHEADER_HEIGHT = 2;
    const PADDING = 2;
    const HELPBAR_HEIGHT = 1;
    return Math.max(5, terminalHeight - APP_HEADER_HEIGHT - LOCAL_HEADER_HEIGHT - SUBHEADER_HEIGHT - PADDING - HELPBAR_HEIGHT);
  }, [terminalHeight]);

  const firstRowGames = useMemo(() => {
    if (!useMultiBoardLayout) return [];
    return games.slice(0, boardsPerRow);
  }, [games, boardsPerRow, useMultiBoardLayout]);

  const hasMoreGames = games.length > boardsPerRow;

  useInput((input, key) => {
    if (useMultiBoardLayout) {
      if (key.leftArrow || input === 'h') {
        if (selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        }
      } else if (key.rightArrow || input === 'l') {
        if (selectedIndex < firstRowGames.length - 1) {
          setSelectedIndex(selectedIndex + 1);
        }
      } else if (input === 't') {
        setForceListView(v => !v);
      } else if (key.return) {
        const selectedGame = firstRowGames[selectedIndex];
        if (selectedGame) {
          onSelectGame(selectedGame);
        }
      } else if (key.escape || input === 'q') {
        onBack();
      }
    } else {
      if (key.upArrow || input === 'k') {
        setSelectedIndex(i => Math.max(0, i - 1));
      } else if (key.downArrow || input === 'j') {
        setSelectedIndex(i => Math.min(games.length - 1, i + 1));
      } else if (input === 't' && canUseMultiBoardLayout) {
        setForceListView(v => !v);
      } else if (key.return) {
        const selectedGame = games[selectedIndex];
        if (selectedGame) {
          onSelectGame(selectedGame);
        }
      } else if (key.escape || input === 'q') {
        onBack();
      }
    }
  });

  const maxNameWidth = useMultiBoardLayout ? 12 : 40;

  if (games.length === 0) {
    return (
      <Box flexDirection="column" height="100%" padding={1}>
        <Text bold color={defaultTheme.accent}>{roundName}</Text>
        <Box padding={1}>
          <Text color="yellow">No games found in PGN</Text>
        </Box>
        <Text color="gray">Press q to return to rounds</Text>
        <HelpBar shortcuts="[q/Esc] Back" />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color={defaultTheme.accent}>{roundName}</Text>
        <Box marginBottom={1}>
          <Text color="gray">
            {games.length} game{games.length !== 1 ? 's' : ''} 
            {useMultiBoardLayout ? ' • Use arrow keys to navigate' : ''}
          </Text>
        </Box>

        {useMultiBoardLayout ? (
          <Box flexDirection="column" overflow="hidden">
            <Box flexDirection="row" gap={1}>
              {firstRowGames.map((game, index) => (
                <GameCard
                  key={game.id || index}
                  game={game}
                  isSelected={index === selectedIndex}
                  maxNameWidth={maxNameWidth}
                />
              ))}
            </Box>
            {hasMoreGames && (
              <Box marginTop={1}>
                <Text color="gray">
                  Showing {firstRowGames.length} of {games.length} games. Press [t] for all games.
                </Text>
              </Box>
            )}
          </Box>
        ) : (
          <ListView
            games={games}
            selectedIndex={selectedIndex}
            scrollViewHeight={scrollViewHeight}
            maxNameWidth={maxNameWidth}
          />
        )}
      </Box>
      <HelpBar 
        shortcuts={
          useMultiBoardLayout 
            ? "[←/h] [→/l] Navigate  [Enter] Select  [t] List View  [q/Esc] Back"
            : `[↑/k] Up  [↓/j] Down  [Enter] Select  ${canUseMultiBoardLayout ? '[t] Board View  ' : ''}[q/Esc] Back`
        } 
      />
    </Box>
  );
}
