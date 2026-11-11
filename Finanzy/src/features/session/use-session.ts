import { useCallback } from 'react';
import { getRuntime } from '../../application/runtime';
import { useAsyncQuery } from '../../hooks/use-async-query';

export function useSession() {
  const load = useCallback(async () => (await getRuntime()).session.getState(), []);
  return useAsyncQuery(load);
}
