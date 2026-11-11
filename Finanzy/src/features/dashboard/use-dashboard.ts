import { useCallback } from 'react';
import { getRuntime } from '../../application/runtime';
import { useAsyncQuery } from '../../hooks/use-async-query';

export function useDashboard() {
  const load = useCallback(async () => {
    const runtime = await getRuntime();
    const [dashboard, categories, profile] = await Promise.all([runtime.reports.getDashboard(), runtime.categories.list(undefined, true), runtime.session.getProfile()]);
    const categoryMap = new Map(categories.map(category => [category.id, category]));
    return { ...dashboard, profile, latest: dashboard.latest.map(transaction => ({ ...transaction, categoryName: categoryMap.get(transaction.categoryId)?.name ?? '', categoryIcon: categoryMap.get(transaction.categoryId)?.icon ?? 'credit-card' })) };
  }, []);
  return useAsyncQuery(load);
}
