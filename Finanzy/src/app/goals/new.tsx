import { useLocalSearchParams } from 'expo-router';
import { GoalFormScreen } from '../../features/goals/goal-screens';

export default function GoalFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <GoalFormScreen id={id ? Number(id) : undefined} />;
}
