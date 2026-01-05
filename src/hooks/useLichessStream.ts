import { useState, useEffect } from 'react';
import { readNdjsonStream } from '../lib/ndjson-parser';

export function useLichessStream(url: string, token?: string) {
  const [data, setData] = useState<any[]>([]);
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

        await readNdjsonStream(response, (item) => {
          if (!cancelled) {
            setData(prev => [...prev, item]);
          }
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
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
