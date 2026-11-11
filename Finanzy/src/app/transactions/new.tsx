import { useLocalSearchParams } from 'expo-router';
import { TransactionForm } from '../../features/transactions/transaction-form';

export default function NewTransactionRoute() {
  const { favoriteId, duplicateId } = useLocalSearchParams<{ favoriteId?: string; duplicateId?: string }>();
  return <TransactionForm duplicateId={duplicateId ? Number(duplicateId) : undefined} favoriteId={favoriteId ? Number(favoriteId) : undefined} />;
}
