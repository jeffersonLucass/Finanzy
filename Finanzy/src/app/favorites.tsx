import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { getRuntime } from '../application/runtime';
import { TransactionRow } from '../components/TransactionRow';
import { AppHeader } from '../components/ui/AppHeader';
import { AppScreen } from '../components/ui/AppScreen';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useTransactions } from '../features/transactions/use-transactions';

export default function FavoritesRoute() {
  const filters = useMemo(() => ({ favoritesOnly: true, limit: 100 }), []);
  const query = useTransactions(filters);
  const remove = useCallback(async (id: number) => { const runtime = await getRuntime(); await runtime.transactions.favorite(id, false); query.reload(); }, [query]);
  return (
    <AppScreen>
      <AppHeader back title="Favoritos" />
      {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} onRetry={query.reload} /> : query.data?.items.length ? query.data.items.map(item => <Card key={item.id} style={styles.card}><TransactionRow amountCents={item.amountCents} category={item.categoryName} date={item.date} description={item.description} icon={item.categoryIcon} onPress={() => router.push({ pathname: '/transactions/new', params: { favoriteId: item.id } })} type={item.type} /><Button label="Remover favorito" onPress={() => void remove(item.id)} variant="ghost" /></Card>) : <EmptyState text="Marque movimentações usadas com frequência para criar novos rascunhos rapidamente." title="Nenhum favorito" />}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ card: { marginBottom: 10 } });
