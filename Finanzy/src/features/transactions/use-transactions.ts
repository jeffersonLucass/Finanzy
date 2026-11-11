import { useCallback } from 'react';
import { getRuntime } from '../../application/runtime';
import { TransactionFilters } from '../../domain/models';
import { useAsyncQuery } from '../../hooks/use-async-query';

export function useTransactions(filters: TransactionFilters = {}) {
  const load = useCallback(async () => {
    const runtime = await getRuntime();
    const [result, categories, dashboard] = await Promise.all([runtime.transactions.list(filters), runtime.categories.list(undefined, true), runtime.reports.getDashboard()]);
    const categoryMap = new Map(categories.map(category => [category.id, category]));
    return { ...result, balanceCents: dashboard.availableCents, items: result.items.map(transaction => ({ ...transaction, categoryName: categoryMap.get(transaction.categoryId)?.name ?? '', categoryIcon: categoryMap.get(transaction.categoryId)?.icon ?? '💳' })) };
  }, [filters]);
  return useAsyncQuery(load);
}

export function useTransaction(id: number) {
  const load = useCallback(async () => {
    const runtime = await getRuntime();
    const [transaction, categories] = await Promise.all([runtime.transactions.get(id), runtime.categories.list(undefined, true)]);
    const category = categories.find(item => item.id === transaction.categoryId);
    return { ...transaction, categoryName: category?.name ?? '', categoryIcon: category?.icon ?? '💳' };
  }, [id]);
  return useAsyncQuery(load);
}
