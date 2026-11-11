import { useLocalSearchParams } from 'expo-router';
import { MonthlySummaryScreen } from '../../features/reports/extended-screens';

export default function MonthlySummaryRoute() {
  const { month } = useLocalSearchParams<{ month?: string }>();
  return <MonthlySummaryScreen period={month ?? new Date().toISOString().slice(0, 7)} />;
}
