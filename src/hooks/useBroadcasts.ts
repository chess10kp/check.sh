import { useState, useEffect } from 'react';
import { fetchBroadcasts } from '../lib/lichess-api';
import { Broadcast } from '../types';

export function useBroadcasts(token?: string) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const refresh = async () => {
    setLoading(true);
    setError(null);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const data = await fetchBroadcasts(token);
        setBroadcasts(data);
        setRetryCount(0);
        setLoading(false);
        return;
      } catch (err: any) {
        if (attempt === maxRetries - 1) {
          setError(err.message);
          setRetryCount(maxRetries);
          setLoading(false);
        } else {
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  };

  useEffect(() => {
    refresh();
  }, [token]);

  return { broadcasts, loading, error, refresh };
}
