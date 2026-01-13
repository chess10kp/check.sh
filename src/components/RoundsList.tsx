import { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { BroadcastRound, LeaderboardPlayer, Broadcast } from '../types/index.js';
import { fetchBroadcastRounds, fetchBroadcastLeaderboard } from '../lib/lichess-api.js';
import { defaultTheme } from '../lib/themes.js';
import HelpBar from './HelpBar.js';
import ScrollView from './ScrollView.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface RoundsListProps {
  broadcastId: string;
  broadcastName: string;
  broadcast?: Broadcast;
  onSelectRound: (round: BroadcastRound) => void;
  onBack: () => void;
  token?: string;
  setLoadingRounds?: (loading: boolean) => void;
  onOpen?: () => void;
}

export default function RoundsList({
  broadcastId,
  broadcastName,
  broadcast,
  onSelectRound,
  onBack,
  token,
  setLoadingRounds,
  onOpen,
}: RoundsListProps) {
  const [rounds, setRounds] = useState<BroadcastRound[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedPanel, setFocusedPanel] = useState<'rounds' | 'standings'>('rounds');
  const [standingsScrollTop, setStandingsScrollTop] = useState(0);
  const { height: terminalHeight, width: terminalWidth } = useTerminalSize(150);

  const scrollViewHeight = useMemo(() => {
    const APP_HEADER_HEIGHT = 4;
    const LOCAL_HEADER_HEIGHT = 1;
    const SUBHEADER_HEIGHT = 2;
    const PADDING = 2;
    const HELPBAR_HEIGHT = 1;
    return Math.max(5, terminalHeight - APP_HEADER_HEIGHT - LOCAL_HEADER_HEIGHT - SUBHEADER_HEIGHT - PADDING - HELPBAR_HEIGHT);
  }, [terminalHeight]);

  const leaderboardHeight = useMemo(() => {
    return Math.max(3, scrollViewHeight - 4);
  }, [scrollViewHeight]);

  useEffect(() => {
    setLoadingRounds?.(loading);
  }, [loading, setLoadingRounds]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roundsData, leaderboardData] = await Promise.all([
          fetchBroadcastRounds(broadcastId, token),
          fetchBroadcastLeaderboard(broadcastId, token),
        ]);
        setRounds(roundsData);
        setLeaderboard(leaderboardData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [broadcastId, token]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [rounds]);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roundsData, leaderboardData] = await Promise.all([
        fetchBroadcastRounds(broadcastId, token),
        fetchBroadcastLeaderboard(broadcastId, token),
      ]);
      setRounds(roundsData);
      setLeaderboard(leaderboardData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => b.score - a.score);
  }, [leaderboard]);

  const hasLeaderboard = leaderboard.length > 0;

  useInput((input, key) => {
    if (key.tab || input === '\t') {
      if (hasLeaderboard) {
        setFocusedPanel(prev => {
          const newPanel = prev === 'rounds' ? 'standings' : 'rounds';
          if (newPanel === 'standings') {
            setStandingsScrollTop(0);
          }
          return newPanel;
        });
      }
      return;
    }

    if (focusedPanel === 'standings' && hasLeaderboard) {
      if (key.upArrow || input === 'k') {
        setStandingsScrollTop(Math.max(0, standingsScrollTop - 1));
      } else if (key.downArrow || input === 'j') {
        setStandingsScrollTop(Math.max(0, Math.min(sortedLeaderboard.length - 15, standingsScrollTop + 1)));
      } else if (key.escape || input === 'q') {
        onBack();
      }
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(rounds.length - 1, i + 1));
    } else if (key.return) {
      if (rounds.length === 0) {
        return;
      }
      const selected = rounds[selectedIndex];
      if (selected) {
        onSelectRound(selected);
      }
    } else if (key.escape || input === 'q') {
      onBack();
    } else if (input === 'r') {
      refreshData();
    } else if (input === 'o' && onOpen) {
      onOpen();
    }
  });

  const hasRoundInfo = broadcast?.tour.info;
  const showDetailPanel = hasLeaderboard || hasRoundInfo;
  const roundsWidth = showDetailPanel ? Math.floor(terminalWidth * 0.35) : terminalWidth - 4;
  const detailWidth = showDetailPanel ? Math.floor(terminalWidth * 0.6) : 0;

  const formatScore = (score: number): string => {
    if (Number.isInteger(score)) {
      return score.toString();
    }
    return score.toFixed(1);
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };


  if (error) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color={defaultTheme.accent}>
          {broadcastName}
        </Text>
        <Box flexDirection="row" height={scrollViewHeight}>
          <Box flexDirection="column" width={roundsWidth}>
            {loading ? null : rounds.length === 0 ? (
              <Box padding={1} minWidth={40}>
                <Text color="gray">No rounds available</Text>
              </Box>
            ) : (
              <ScrollView height={scrollViewHeight} selectedIndex={selectedIndex}>
                {rounds.map((round, index) => (
                  <Box
                    key={round.id}
                    backgroundColor={index === selectedIndex ? defaultTheme.highlight : undefined}
                    paddingX={1}
                  >
                    <Text>
                      {index === selectedIndex ? '▶ ' : '  '}
                      {round.name}
                      {round.finished !== undefined && (
                        <Text color={round.finished ? 'green' : 'yellow'}>
                          {' '}{round.finished ? '(Finished)' : '(Live)'}
                        </Text>
                      )}
                    </Text>
                  </Box>
                ))}
              </ScrollView>
            )}
          </Box>

          {showDetailPanel && (
            <Box flexDirection="column" width={detailWidth} marginLeft={2}>
              {hasLeaderboard && terminalWidth > 100 && (
                <Box flexDirection="column" marginBottom={1} borderStyle={focusedPanel === 'standings' ? 'double' : 'single'} borderColor={focusedPanel === 'standings' ? defaultTheme.accent : 'gray'} paddingX={1}>
                  <Text bold color={defaultTheme.accent}>Standings</Text>
                  <Box marginTop={1} flexDirection="column">
                    <Box>
                      <Text dimColor>
                        <Text>{' # '}</Text>
                        <Text>{'Player'.padEnd(18)}</Text>
                        <Text>{'Pts'.padStart(4)}</Text>
                        <Text>{'Elo'.padStart(5)}</Text>
                      </Text>
                    </Box>
                    <ScrollView height={Math.floor(leaderboardHeight * 0.5)} selectedIndex={-1}>
                      {sortedLeaderboard.slice(standingsScrollTop, standingsScrollTop + 15).map((player, index) => (
                        <Box key={player.fideId || player.name}>
                          <Text>
                            <Text color="gray">{(standingsScrollTop + index + 1).toString().padStart(2)}.</Text>
                            <Text> </Text>
                            {player.title && <Text color="yellow">{player.title} </Text>}
                            <Text>{player.name.slice(0, player.title ? 14 : 17).padEnd(player.title ? 14 : 17)}</Text>
                            <Text bold color="green">{formatScore(player.score).padStart(4)}</Text>
                            <Text color="cyan">{player.rating.toString().padStart(5)}</Text>
                          </Text>
                        </Box>
                      ))}
                    </ScrollView>
                  </Box>
                </Box>
              )}

              <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
                <Text bold color={defaultTheme.accent}>Information</Text>

                {broadcast?.tour.info && (
                  <Box marginTop={1} flexDirection="column">
                    <Text dimColor>Tournament Info:</Text>
                    {broadcast.tour.info.format && (
                      <Text>  Format: <Text color="cyan">{broadcast.tour.info.format}</Text></Text>
                    )}
                    {broadcast.tour.info.tc && (
                      <Text>  Time Control: <Text color="cyan">{broadcast.tour.info.tc}</Text></Text>
                    )}
                    {broadcast.tour.info.location && (
                      <Text>  Location: <Text color="cyan">{broadcast.tour.info.location}</Text></Text>
                    )}
                    {broadcast.tour.info.website && (
                      <Text>  Website: <Text color="blue" dimColor>{broadcast.tour.info.website}</Text></Text>
                    )}
                  </Box>
                )}

                <Box marginTop={1}>
                  <Text dimColor>{rounds[selectedIndex]?.name}</Text>
                </Box>

                {rounds[selectedIndex] && (
                  <Box flexDirection="column">
                    {rounds[selectedIndex].startsAt && (
                      <Text>  Starts: <Text color="green">{formatDate(rounds[selectedIndex].startsAt)}</Text></Text>
                    )}
                    {rounds[selectedIndex].finished && (
                      <Text>  Status: <Text color="yellow">Finished</Text></Text>
                    )}
                    {rounds[selectedIndex].ongoing && (
                      <Text>  Status: <Text color="green">Live Now</Text></Text>
                    )}
                    {rounds[selectedIndex].rated !== undefined && (
                      <Text>  Rated: <Text color={rounds[selectedIndex].rated ? 'green' : 'gray'}>{rounds[selectedIndex].rated ? 'Yes' : 'No'}</Text></Text>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <HelpBar shortcuts={`${focusedPanel === 'standings' ? '[↑/k] Scroll Standings  [↓/j] Scroll Standings  [Tab] Rounds  ' : ''}[↑/k] Up  [↓/j] Down  [Enter] Select  [o] Open  ${hasLeaderboard ? '[Tab] Standings  ' : ''}[r] Refresh  [q/Esc] Back`} />
    </Box>
  );
}
