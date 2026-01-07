import { Chess } from 'chess.js';
import { Game, BroadcastPlayer } from '../types/index.js';

export function parsePGN(pgn: string): Game[] {
  const games: Game[] = [];

  const pgnArray = pgn.split(/\n\n+/);
  const gameHeaders: string[] = [];
  const gameBodies: string[] = [];

  for (let i = 0; i < pgnArray.length; i++) {
    const pgnPart = pgnArray[i];
    if (!pgnPart) continue;

    const lines = pgnPart.split('\n');
    let headerLines: string[] = [];
    let bodyLines: string[] = [];
    let inHeaders = true;

    for (const line of lines) {
      if (inHeaders && line.startsWith('[')) {
        headerLines.push(line);
      } else {
        inHeaders = false;
        bodyLines.push(line);
      }
    }

    if (headerLines.length > 0) {
      gameHeaders.push(headerLines.join('\n'));
      gameBodies.push(bodyLines.join('\n'));
    }
  }

  for (let i = 0; i < gameHeaders.length; i++) {
    const game = parseSingleGame(gameHeaders[i]!, gameBodies[i] ?? '');
    if (game) {
      games.push(game);
    }
  }

  return games;
}

function parseSingleGame(headers: string, body: string): Game | null {
  const headerMap = new Map<string, string>();
  const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
  let match;

  while ((match = headerRegex.exec(headers)) !== null) {
    if (match[1] !== undefined && match[2] !== undefined) {
      headerMap.set(match[1], match[2]);
    }
  }

  const whiteName = headerMap.get('White') ?? 'Unknown';
  const blackName = headerMap.get('Black') ?? 'Unknown';

  const whiteElo = parseInt(headerMap.get('WhiteElo') ?? '0', 10);
  const blackElo = parseInt(headerMap.get('BlackElo') ?? '0', 10);

  const players: BroadcastPlayer[] = [
    { name: whiteName, rating: whiteElo },
    { name: blackName, rating: blackElo },
  ];

  const pgnText = headers + '\n\n' + body;

  let fen: string | undefined;
  let status: 'started' | 'playing' | 'aborted' | 'mate' | 'draw' | 'resign' | 'stalemate' | 'timeout' | 'outoftime' = 'started';

  try {
    const chess = new Chess();
    chess.loadPgn(pgnText);
    fen = chess.fen();

    if (chess.isCheckmate()) {
      status = 'mate';
    } else if (chess.isDraw()) {
      status = 'draw';
    } else if (chess.isStalemate()) {
      status = 'stalemate';
    }
  } catch (err) {
    console.error('Failed to parse PGN:', err);
  }

  return {
    players,
    fen,
    status,
    pgn: pgnText,
  };
}

export function parseSinglePGN(pgn: string): Game | null {
  const games = parsePGN(pgn);
  return games.length > 0 ? (games[0] ?? null) : null;
}
