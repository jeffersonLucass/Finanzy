import { Redirect } from 'expo-router';

export default function LegacyNewTransactionRoute() {
  return <Redirect href="/transactions/new" />;
}
