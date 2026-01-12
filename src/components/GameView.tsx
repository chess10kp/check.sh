import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { Box, useInput } from "ink";
import ChessBoard from "./ChessBoard.js";
import PlayerInfo from "./PlayerInfo.js";
import MoveHistory from "./MoveHistory.js";
import GameListSidebar from "./GameListSidebar.js";
import StockfishEval from "./StockfishEval.js";
import { Game, BroadcastPlayer } from "../types/index.js";
import HelpBar from "./HelpBar.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { addFavorite } from "../lib/cache.js";

type FocusArea = "board" | "sidebar";

interface GameViewProps {
  game: Game;
  games: Game[];
  onBack: () => void;
  onGameSelect: (game: Game) => void;
  onOpen?: (url: string) => void;
}

// Memoized board container to prevent re-renders when only border color changes
const BoardContainer = memo(
  function BoardContainer({
    focus,
    currentFEN,
    lastMove,
    flipped,
  }: {
    focus: FocusArea;
    currentFEN: string | undefined;
    lastMove: { from: string; to: string } | undefined;
    flipped: boolean;
  }) {
    return (
      <Box
        flexDirection="column"
        borderStyle={focus === "board" ? "single" : "single"}
        borderColor={focus === "board" ? "greenBright" : undefined}
        paddingX={2}
        marginX={1}
      >
        {currentFEN && <ChessBoard fen={currentFEN} lastMove={lastMove} flipped={flipped} />}
      </Box>
    );
  },
  (prev: any, next: any) => {
    // Re-render if focus changes (border visibility)
    if (prev.focus !== next.focus) return false;
    // Also re-render if FEN or lastMove changes
    if (prev.currentFEN !== next.currentFEN) return false;
    if (prev.lastMove?.from !== next.lastMove?.from) return false;
    if (prev.lastMove?.to !== next.lastMove?.to) return false;
    if (prev.flipped !== next.flipped) return false;
    return true;
  }
);

// Memoized right panel to prevent re-renders of PlayerInfo, MoveHistory, StockfishEval when focus changes
const RightPanelContainer = memo(
  function RightPanelContainer({
    whitePlayer,
    blackPlayer,
    moves,
    currentMoveIndex,
    game,
    currentFEN,
    flipped,
  }: {
    whitePlayer: BroadcastPlayer | undefined;
    blackPlayer: BroadcastPlayer | undefined;
    moves: string | undefined;
    currentMoveIndex: number;
    game: Game;
    currentFEN: string | undefined;
    flipped: boolean;
  }) {
    const topPlayer = flipped ? whitePlayer : blackPlayer;
    const bottomPlayer = flipped ? blackPlayer : whitePlayer;
    const topIsWhite = flipped;
    const bottomIsWhite = !flipped;

    return (
      <Box flexDirection="column" width={45}>
        <Box flexDirection="column" flexGrow={1} marginTop={1}>
          {topPlayer && (
            <PlayerInfo
              player={topPlayer}
              isWhite={topIsWhite}
              isActive={game.status === "playing"}
            />
          )}
        </Box>

        <Box marginTop={1} flexGrow={1}>
          <MoveHistory moves={moves} currentMoveIndex={currentMoveIndex} />
        </Box>
        <StockfishEval fen={currentFEN} />

        {bottomPlayer && (
          <PlayerInfo
            player={bottomPlayer}
            isWhite={bottomIsWhite}
            isActive={game.status === "playing"}
          />
        )}
      </Box>
    );
  },
  (prev: any, next: any) => {
    // Only re-render if the actual data changes, not when focus changes
    if (prev.whitePlayer?.name !== next.whitePlayer?.name) return false;
    if (prev.whitePlayer?.rating !== next.whitePlayer?.rating) return false;
    if (prev.whitePlayer?.clock !== next.whitePlayer?.clock) return false;
    if (prev.whitePlayer?.title !== next.whitePlayer?.title) return false;
    if (prev.blackPlayer?.name !== next.blackPlayer?.name) return false;
    if (prev.blackPlayer?.rating !== next.blackPlayer?.rating) return false;
    if (prev.blackPlayer?.clock !== next.blackPlayer?.clock) return false;
    if (prev.blackPlayer?.title !== next.blackPlayer?.title) return false;
    if (prev.moves !== next.moves) return false;
    if (prev.currentMoveIndex !== next.currentMoveIndex) return false;
    if (prev.currentFEN !== next.currentFEN) return false;
    if (prev.game.status !== next.game.status) return false;
    if (prev.flipped !== next.flipped) return false;
    return true;
  }
);

export default function GameView({
  game,
  games,
  onBack,
  onGameSelect,
  onOpen,
}: GameViewProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(
    game.currentMoveIndex ?? 0
  );
  const [focus, setFocus] = useState<FocusArea>("board");
  const [sidebarSelectedIndex, setSidebarSelectedIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "exists">(
    "idle"
  );
  const [flipped, setFlipped] = useState(false);
  const lastInputTime = useRef(0);
  const INPUT_DEBOUNCE_MS = 50;

  const { width: terminalWidth, height: terminalHeight } = useTerminalSize(150);
  const isCompactMode = useMemo(() => {
    const COMPACT_MIN_WIDTH = 75;
    const COMPACT_MIN_HEIGHT = 27;
    return (
      terminalWidth < COMPACT_MIN_WIDTH || terminalHeight < COMPACT_MIN_HEIGHT
    );
  }, [terminalWidth, terminalHeight]);

  const viewedGameIndex = useMemo(
    () => games.findIndex((g) => g.id === game.id),
    [games, game.id]
  );

  useEffect(() => {
    setSidebarSelectedIndex(viewedGameIndex);
  }, [viewedGameIndex]);

  useEffect(() => {
    setCurrentMoveIndex(game.currentMoveIndex ?? 0);
  }, [game.id]);

  const whitePlayer = useMemo(() => game.players[0], [game.players]);
  const blackPlayer = useMemo(() => game.players[1], [game.players]);

  const currentFEN = useMemo(
    () => game.fenHistory?.[currentMoveIndex] ?? game.fen ?? undefined,
    [game.fenHistory, game.fen, currentMoveIndex]
  );

  const canGoNext = useMemo(
    () =>
      game.fenHistory ? currentMoveIndex < game.fenHistory.length - 1 : false,
    [game.fenHistory, currentMoveIndex]
  );
  const canGoPrevious = currentMoveIndex > 0;

  // Memoize the shortcuts text to prevent HelpBar re-renders
  const boardShortcuts = useMemo(
    () =>
      `[n/→] Next | [p/←] Prev | [f] Flip | [s] Save | [o] Open | [Tab] Sidebar | [q] Return${
        saveStatus === "saved"
          ? " ✓ Saved!"
          : saveStatus === "exists"
          ? " (already saved)"
          : ""
      }`,
    [saveStatus]
  );

  const sidebarShortcuts =
    "[↑/k] Up | [↓/j] Down | [Enter] Select | [Tab] Board | [q] Return";

  const currentShortcuts = useMemo(
    () => (focus === "board" ? boardShortcuts : sidebarShortcuts),
    [focus, boardShortcuts, sidebarShortcuts]
  );

  const lastMoveRef = useRef<{ from: string; to: string } | undefined>(
    undefined
  );
  const lastMove = useMemo(() => {
    const currentMoveStr = game.moveHistory?.[currentMoveIndex];
    if (!currentMoveStr) {
      if (lastMoveRef.current === undefined) {
        return undefined;
      }
      lastMoveRef.current = undefined;
      return undefined;
    }

    const lastMoveFrom = currentMoveStr.substring(0, 2);
    const lastMoveTo = currentMoveStr.substring(2, 4);
    const newLastMove = { from: lastMoveFrom, to: lastMoveTo };

    if (
      lastMoveRef.current?.from === newLastMove.from &&
      lastMoveRef.current?.to === newLastMove.to
    ) {
      return lastMoveRef.current;
    }
    lastMoveRef.current = newLastMove;
    return newLastMove;
  }, [game.moveHistory, currentMoveIndex]);

  const handleSave = useCallback(() => {
    addFavorite(game).then((added) => {
      setSaveStatus(added ? "saved" : "exists");
      setTimeout(() => setSaveStatus("idle"), 2000);
    });
  }, [game]);

  useInput((input, key) => {
    const now = Date.now();
    if (now - lastInputTime.current < INPUT_DEBOUNCE_MS) {
      return;
    }
    lastInputTime.current = now;

    if (input === "q") {
      onBack();
    } else if (input === "n" || key.rightArrow) {
      if (focus === "board" && canGoNext) {
        setCurrentMoveIndex(currentMoveIndex + 1);
      }
    } else if (input === "p" || key.leftArrow) {
      if (focus === "board" && canGoPrevious) {
        setCurrentMoveIndex(currentMoveIndex - 1);
      }
    } else if (key.tab) {
      setFocus((prev) => (prev === "board" ? "sidebar" : "board"));
    } else if (input === "s" && focus === "board") {
      handleSave();
    } else if (input === "f" && focus === "board") {
      setFlipped((prev) => !prev);
    } else if (input === "o" && onOpen) {
      if (game.id) {
        onOpen(`https://lichess.org/${game.id}`);
      }
    } else if (focus === "sidebar") {
      if (key.upArrow || input === "k") {
        setSidebarSelectedIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow || input === "j") {
        setSidebarSelectedIndex((i) => Math.min(games.length - 1, i + 1));
      } else if (key.return) {
        const selectedGame = games[sidebarSelectedIndex];
        if (selectedGame) {
          onGameSelect(selectedGame);
        }
      }
    }
  });

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        {isCompactMode ? (
          <Box flexDirection="column">
            {(flipped ? whitePlayer : blackPlayer) && (
              <PlayerInfo
                player={(flipped ? whitePlayer : blackPlayer)!}
                isWhite={flipped}
                isActive={game.status === "playing"}
              />
            )}
            <Box flexDirection="column" paddingX={2}>
              {currentFEN && (
                <ChessBoard fen={currentFEN} lastMove={lastMove} flipped={flipped} />
              )}
            </Box>
            {(flipped ? blackPlayer : whitePlayer) && (
              <PlayerInfo
                player={(flipped ? blackPlayer : whitePlayer)!}
                isWhite={!flipped}
                isActive={game.status === "playing"}
              />
            )}
          </Box>
        ) : (
          <Box flexDirection="row">
            <GameListSidebar
              games={games}
              selectedIndex={sidebarSelectedIndex}
              viewedGameIndex={viewedGameIndex}
              hasFocus={focus === "sidebar"}
            />

            <BoardContainer
              focus={focus}
              currentFEN={currentFEN}
              lastMove={lastMove}
              flipped={flipped}
            />

            <RightPanelContainer
              whitePlayer={whitePlayer}
              blackPlayer={blackPlayer}
              moves={game.moves}
              currentMoveIndex={currentMoveIndex}
              game={game}
              currentFEN={currentFEN}
              flipped={flipped}
            />
          </Box>
        )}
      </Box>

      {!isCompactMode && <HelpBar shortcuts={currentShortcuts} />}
    </Box>
  );
}
