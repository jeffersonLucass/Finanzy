import { useLocalSearchParams } from 'expo-router';
import { AddMoneyScreen } from '../../../features/goals/goal-screens';

export default function AddMoneyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AddMoneyScreen id={Number(id)} />;
}
