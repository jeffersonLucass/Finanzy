import { useLocalSearchParams } from 'expo-router';
import { AppScreen } from '../../../components/ui/AppScreen';
import { ErrorState, LoadingState } from '../../../components/ui/AsyncState';
import { TransactionForm } from '../../../features/transactions/transaction-form';
import { useTransaction } from '../../../features/transactions/use-transactions';

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useTransaction(Number(id));
  if (query.loading && !query.data) return <AppScreen><LoadingState /></AppScreen>;
  if (query.error || !query.data) return <AppScreen><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  return <TransactionForm transaction={query.data} />;
}
