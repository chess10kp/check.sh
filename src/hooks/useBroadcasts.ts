import { useState, useEffect } from 'react';
import { fetchBroadcasts } from '../lib/lichess-api.js';
import { Broadcast } from '../types/index.js';
import { getCache, setCache } from '../lib/cache.js';

const CACHE_KEY = 'broadcasts';

export function useBroadcasts(token?: string) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const maxRetries = 3;

  const loadFromCache = async () => {
    try {
      const cached = await getCache<Broadcast[]>(CACHE_KEY, Number.MAX_SAFE_INTEGER);
      if (cached && cached.length > 0) {
        setBroadcasts(cached);
        setLoading(false);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const data = await fetchBroadcasts(token);
        setBroadcasts(data);
        await setCache(CACHE_KEY, data);
        setLoading(false);
        return;
      } catch (err: any) {
        if (attempt === maxRetries - 1) {
          setError(err.message);
          setLoading(false);
        } else {
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  };

  useEffect(() => {
    loadFromCache();
  }, []);

  return { broadcasts, loading, error, refresh };
}
