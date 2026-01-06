import { useState } from 'react';
import { Box, Text } from 'ink';
import BroadcastList from './components/BroadcastList';
import GameView from './components/GameView';
import { ViewState } from './types';
import { streamGame } from './lib/lichess-api';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('broadcast-list');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [loadingGames, setLoadingGames] = useState(false);

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setViewState('game-view');
  };

  const handleBackToList = () => {
    setSelectedGame(null);
    setViewState('broadcast-list');
  };

  const handleFetchGames = async (roundId: string) => {
    setLoadingGames(true);

    try {
      const response = await streamGame(roundId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: { games?: any[] } = await response.json();
      const games = data.games || [];

      if (games.length === 0) {
        console.error('No games found in broadcast round:', roundId);
      } else {
        console.log('Successfully fetched', games.length, 'games');
      }

      if (games.length > 0) {
        handleSelectGame(games[0]);
      }
    } catch (err: any) {
      console.error('Error fetching games:', err.message);
    } finally {
      setLoadingGames(false);
    }
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          Lichess TUI Viewer v1.0
        </Text>
      </Box>

      {viewState === 'broadcast-list' ? (
        <>
          {loadingGames ? (
            <Box justifyContent="center" padding={2}>
              <Text color="yellow">Loading games...</Text>
            </Box>
          ) : (
            <BroadcastList
              onSelectGame={handleSelectGame}
              onFetchGames={handleFetchGames}
              loadingGames={loadingGames}
            />
          )}
        </>
      ) : (
        <GameView game={selectedGame} onBack={handleBackToList} />
      )}
    </Box>
  );
}
