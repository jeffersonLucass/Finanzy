import { useLocalSearchParams } from 'expo-router';
import { RecurringDetailsScreen } from '../../../features/recurring/recurring-screens';

export default function InstallmentDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecurringDetailsScreen id={Number(id)} />;
}
