import { useState } from 'react';
import { Box, Text } from 'ink';
import BroadcastList from './components/BroadcastList.js';
import RoundsList from './components/RoundsList.js';
import GamesList from './components/GamesList.js';
import GameView from './components/GameView.js';
import { ViewState, Broadcast, Game } from './types/index.js';
import { streamRoundPGN } from './lib/lichess-api.js';
import { parsePGN } from './lib/pgn-parser.js';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('broadcast-list');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [roundName, setRoundName] = useState<string>('');

  const handleBackToList = () => {
    setSelectedGame(null);
    setSelectedBroadcast(null);
    setViewState('broadcast-list');
  };

  const handleSelectBroadcast = (broadcast: Broadcast) => {
    setSelectedBroadcast(broadcast);
    setViewState('rounds-list');
  };

  const handleBackToRounds = () => {
    setSelectedGame(null);
    setGames([]);
    setViewState('rounds-list');
  };

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setViewState('game-view');
  };

  const handleSelectRound = async (round: any) => {
    setLoadingGames(true);
    setRoundName(round.name);

    console.log('[App] Selecting round:', { id: round.id, name: round.name });

    try {
      const allPgnData: string[] = [];
      await streamRoundPGN(round.id, (pgn: string) => {
        console.log('[App] Received PGN chunk:', pgn.substring(0) + '...');
        allPgnData.push(pgn);
      });

      const fullPgn = allPgnData.join('\n\n');
      console.log('[App] Total PGN data received:', fullPgn.length, 'characters');

      const parsedGames = parsePGN(fullPgn);
      console.log('[App] Parsed games:', parsedGames.length);

      if (parsedGames.length > 0) {
        console.log('[App] First game players:', parsedGames[0].players.map(p => p.name));
        setGames(parsedGames);
        setViewState('games-list');
      } else {
        console.log('[App] No games parsed from PGN');
      }
    } catch (err: any) {
      console.error('[App] Error streaming PGN:', err.message);
      console.error('[App] Error stack:', err.stack);
    } finally {
      setLoadingGames(false);
    }
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          Check.sh
        </Text>
      </Box>

      {viewState === 'broadcast-list' ? (
        <BroadcastList
          onSelectBroadcast={handleSelectBroadcast}
          loadingGames={loadingGames}
        />
      ) : viewState === 'rounds-list' && selectedBroadcast ? (
        <RoundsList
          broadcastId={selectedBroadcast.tour.id}
          broadcastName={selectedBroadcast.tour.name}
          onSelectRound={handleSelectRound}
          onBack={handleBackToList}
        />
      ) : viewState === 'games-list' ? (
        <GamesList
          games={games}
          roundName={roundName}
          onSelectGame={handleSelectGame}
          onBack={handleBackToRounds}
        />
      ) : (
        <GameView game={selectedGame} onBack={handleBackToRounds} />
      )}
    </Box>
  );
}
