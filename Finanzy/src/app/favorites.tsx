import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { getRuntime } from '../application/runtime';
import { TransactionRow } from '../components/TransactionRow';
import { AppHeader } from '../components/ui/AppHeader';
import { AppScreen } from '../components/ui/AppScreen';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { Card } from '../components/ui/Card';
import { useTransactions } from '../features/transactions/use-transactions';
import { useTheme } from '../theme/ThemeProvider';
import { errorMessage } from '../domain/core';

export default function FavoritesRoute() {
  const { theme } = useTheme();
  const [feedback, setFeedback] = useState('');
  const filters = useMemo(() => ({ favoritesOnly: true, limit: 100 }), []);
  const query = useTransactions(filters);
  const remove = useCallback(async (id: number) => { const runtime = await getRuntime(); await runtime.transactions.favorite(id, false); query.reload(); }, [query]);
  return (
    <AppScreen>
      <AppHeader back title="Favoritos" />
      {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} onRetry={query.reload} /> : query.data?.items.length ? <>{query.data.items.map(item => <TransactionRow amountCents={item.amountCents} category={item.categoryName} date={item.date} description={item.description} icon={item.categoryIcon} key={item.id} onLongPress={() => void remove(item.id).catch(error => setFeedback(errorMessage(error)))} onPress={() => router.push({ pathname: '/transactions/new', params: { favoriteId: item.id } })} type={item.type} />)}<Card style={[styles.hint, { backgroundColor: theme.colors.primarySoft }]}><Text style={[styles.hintTitle, { color: theme.colors.primaryStrong }]}>Toque em um favorito</Text><Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>A nova movimentação será aberta com os dados preenchidos.</Text></Card></> : <EmptyState text="Marque movimentações usadas com frequência para criar novos rascunhos rapidamente." title="Nenhum favorito" />}
      {feedback ? <Text style={{ color: theme.colors.dangerStrong }}>{feedback}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ hint: { marginTop: 12 }, hintTitle: { fontSize: 13, fontWeight: '600' }, hintText: { fontSize: 11, marginTop: 6 } });
