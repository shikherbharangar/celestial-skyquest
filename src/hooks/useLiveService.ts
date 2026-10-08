import { useCallback, useEffect, useRef, useState } from 'react';
export function useLiveService() {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setStatus('checking');
    try {
      const response = await fetch('/api/config', {
        cache: 'no-store',
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(5000)]),
      });
      if (!response.ok) throw new Error();
      const value: unknown = await response.json();
      if (!request.signal.aborted)
        setStatus(
          value &&
            typeof value === 'object' &&
            'liveAvailable' in value &&
            value.liveAvailable === true
            ? 'available'
            : 'unavailable',
        );
    } catch {
      if (!request.signal.aborted) setStatus('unavailable');
    }
  }, []);
  useEffect(() => {
    void refresh();
    return () => controller.current?.abort();
  }, [refresh]);
  return { status, refresh };
}
