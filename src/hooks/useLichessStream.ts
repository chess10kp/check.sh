import { useState, useEffect } from 'react';
import { readNdjsonStream } from '../lib/ndjson-parser.js';

export function useLichessStream(url: string, token?: string) {
  const [data, setData] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        await readNdjsonStream(response, (item: unknown) => {
          if (!cancelled) {
            setData(prev => [...prev, item]);
          }
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
    };
  }, [url, token]);

  return { data, error };
}
