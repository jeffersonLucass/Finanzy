import { useLocalSearchParams } from 'expo-router';
import { MonthlyComparisonScreen } from '../../features/reports/extended-screens';

export default function ComparisonRoute() {
  const { period } = useLocalSearchParams<{ period?: string }>();
  return <MonthlyComparisonScreen initialPeriod={period} />;
}
