import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type AsyncQueryState<T> = { data: T | null; loading: boolean; error: Error | null; reload: () => void };

export function useAsyncQuery<T>(load: (signal: AbortSignal) => Promise<T>): AsyncQueryState<T> {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<Omit<AsyncQueryState<T>, 'reload'>>({ data: null, loading: true, error: null });
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useFocusEffect(useCallback(() => {
    void revision;
    const controller = new AbortController();
    let current = true;
    setState(previous => ({ ...previous, loading: true, error: null }));
    void load(controller.signal).then(data => {
      if (current && !controller.signal.aborted) setState({ data, loading: false, error: null });
    }).catch(error => {
      if (current && !controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: error instanceof Error ? error : new Error('Falha ao carregar.') }));
    });
    return () => {
      current = false;
      controller.abort();
    };
  }, [load, revision]));
  return { ...state, reload };
}
