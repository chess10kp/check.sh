import { readNdjsonStream } from './ndjson-parser';

const LICHESS_API_URL = 'https://lichess.org/api';

export async function fetchBroadcasts(token?: string): Promise<any[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${LICHESS_API_URL}/broadcast`, {
    headers,
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

export async function streamGame(
  broadcastRoundId: string,
  token?: string
): Promise<Response> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${LICHESS_API_URL}/broadcast/round/${broadcastRoundId}/games`, {
    headers,
  });
}
