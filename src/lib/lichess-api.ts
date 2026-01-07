import { readNdjsonStream } from './ndjson-parser.js';
import { BroadcastRound } from '../types/index.js';

const LICHESS_API_URL = 'https://lichess.org/api';

export async function fetchBroadcasts(token?: string): Promise<any[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${LICHESS_API_URL}/broadcast`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch broadcasts: ${response.status}`);
  }

  const broadcasts: any[] = [];
  await readNdjsonStream(response, (data) => {
    broadcasts.push(data);
  });

  return broadcasts;
}

export async function fetchBroadcastRounds(
  broadcastId: string,
  token?: string
): Promise<BroadcastRound[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${LICHESS_API_URL}/broadcast/${broadcastId}`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch broadcast rounds: ${response.status}`);
  }

  const data = await response.json();
  return data.rounds || [];
}

export async function streamRoundPGN(
  roundId: string,
  onUpdate: (pgn: string) => void,
  token?: string
): Promise<void> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${LICHESS_API_URL}/stream/broadcast/round/${roundId}.pgn`;
  console.log('[lichess-api] Fetching PGN from:', url);

  const response = await fetch(url, {
    headers,
  });

  console.log('[lichess-api] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[lichess-api] Error response:', errorText);
    throw new Error(`Failed to stream round PGN: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No reader available');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('[lichess-api] Stream finished, total bytes:', totalBytes);
        break;
      }

      totalBytes += value.length;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          onUpdate(line);
        }
      }
    }

    if (buffer.trim()) {
      onUpdate(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}
