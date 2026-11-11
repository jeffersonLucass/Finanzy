import { useCallback } from 'react';
import { getRuntime } from '../../application/runtime';
import { useAsyncQuery } from '../../hooks/use-async-query';

export function useReport(period: string) {
  const load = useCallback(async () => {
    const runtime = await getRuntime();
    const [monthly, comparison] = await Promise.all([runtime.reports.getMonthlyReport(period), runtime.reports.getMonthlyComparison(period)]);
    return { monthly, comparison };
  }, [period]);
  return useAsyncQuery(load);
}
