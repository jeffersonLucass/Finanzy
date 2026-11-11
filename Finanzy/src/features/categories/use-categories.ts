import { useCallback } from 'react';
import { getRuntime } from '../../application/runtime';
import { TransactionType } from '../../domain/models';
import { useAsyncQuery } from '../../hooks/use-async-query';

export function useCategories(type: TransactionType) {
  const load = useCallback(async () => (await getRuntime()).categories.list(type), [type]);
  return useAsyncQuery(load);
}
