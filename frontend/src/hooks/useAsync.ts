import { useState, useEffect, useCallback, useRef } from 'react';

export function useAsync<T = any>(asyncFunction: () => Promise<T>, immediate = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(asyncFunction);
  fnRef.current = asyncFunction;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const status = loading ? 'loading' : error ? 'error' : data ? 'success' : 'idle';

  return { execute, data, loading, error, status };
}
