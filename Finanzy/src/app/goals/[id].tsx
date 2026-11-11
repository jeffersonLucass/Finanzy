import { useLocalSearchParams } from 'expo-router';
import { GoalDetailsScreen } from '../../features/goals/goal-screens';

export default function GoalDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GoalDetailsScreen id={Number(id)} />;
}
