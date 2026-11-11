import { useCallback } from 'react';
import { getRuntime } from '../../application/runtime';
import { useAsyncQuery } from '../../hooks/use-async-query';

export function useBudgets() {
  const load = useCallback(async () => (await getRuntime()).budgets.list(), []);
  return useAsyncQuery(load);
}
