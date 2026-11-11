import { useLocalSearchParams } from 'expo-router';
import { TransactionDetailsScreen } from '../../features/transactions/transaction-details-screen';

export default function TransactionDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionDetailsScreen id={Number(id)} />;
}
