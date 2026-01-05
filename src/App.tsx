import React, { useState } from 'react';
import { Box, Text } from 'ink';
import BroadcastList from './components/BroadcastList';
import GameView from './components/GameView';
import { ViewState } from './types';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('broadcast-list');
  const [selectedGame, setSelectedGame] = useState<any>(null);

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setViewState('game-view');
  };

  const handleBackToList = () => {
    setSelectedGame(null);
    setViewState('broadcast-list');
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          Lichess TUI Viewer v1.0
        </Text>
      </Box>

      {viewState === 'broadcast-list' ? (
        <BroadcastList onSelectGame={handleSelectGame} />
      ) : (
        <GameView game={selectedGame} onBack={handleBackToList} />
      )}
    </Box>
  );
}
