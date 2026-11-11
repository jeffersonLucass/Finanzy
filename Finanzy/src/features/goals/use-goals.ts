import { useCallback } from 'react';
import { getRuntime } from '../../application/runtime';
import { useAsyncQuery } from '../../hooks/use-async-query';

export function useGoals() {
  const load = useCallback(async () => (await getRuntime()).goals.list(), []);
  return useAsyncQuery(load);
}
