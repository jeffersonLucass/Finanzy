import { useLocalSearchParams } from 'expo-router';
import { TransactionType } from '../../domain/models';
import { CategoryFormScreen } from '../../features/categories/category-form-screen';

export default function CategoryFormRoute() {
  const { id, type } = useLocalSearchParams<{ id?: string; type?: TransactionType }>();
  return <CategoryFormScreen id={id ? Number(id) : undefined} initialType={type ?? 'expense'} />;
}
