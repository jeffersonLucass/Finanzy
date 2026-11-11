import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { TransactionRow } from '../components/TransactionRow';
import { AppScreen } from '../components/ui/AppScreen';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { TransactionFilters } from '../domain/models';
import { addDays } from '../domain/core';
import { useTransactions } from '../features/transactions/use-transactions';
import { formatCurrency } from '../presentation/format';
import { useTheme } from '../theme/ThemeProvider';

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ type?: string; categories?: string; start?: string; end?: string; favorites?: string }>();
  const [search, setSearch] = useState('');
  const [quickType, setQuickType] = useState<'all' | 'income' | 'expense'>((params.type as 'income' | 'expense') ?? 'all');
  const filters = useMemo<TransactionFilters>(() => ({
    search: search.trim() || undefined,
    type: quickType === 'all' ? undefined : quickType,
    categoryIds: params.categories?.split(',').map(Number).filter(Boolean),
    start: params.start,
    end: params.end ? addDays(params.end, 1) : undefined,
    favoritesOnly: params.favorites === '1' || undefined,
    limit: 100,
  }), [params.categories, params.end, params.favorites, params.start, quickType, search]);
  const query = useTransactions(filters);
  const activeFilters = Number(Boolean(params.categories)) + Number(Boolean(params.start || params.end)) + Number(params.favorites === '1');

  return (
    <AppScreen footer={<BottomNav active="transactions" />} scroll={false}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Transações</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Saldo atual · {formatCurrency(query.data?.balanceCents ?? 0)}</Text>
        </View>
        <Button label="+ Nova" onPress={() => router.push('/transactions/new')} />
      </View>
      <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.searchIcon, { color: theme.colors.textSecondary }]}>⌕</Text>
        <TextInput onChangeText={setSearch} placeholder="Pesquisar transação" placeholderTextColor={theme.colors.textMuted} style={[styles.search, { color: theme.colors.text }]} value={search} />
      </View>
      <View style={styles.filters}>
        {(['all', 'income', 'expense'] as const).map(value => {
          const selected = quickType === value;
          return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={value} onPress={() => setQuickType(value)}><Text style={[styles.filter, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{value === 'all' ? 'Todas' : value === 'income' ? 'Receitas' : 'Despesas'}</Text></Pressable>;
        })}
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/transactions/filters', params: { ...params, type: quickType === 'all' ? '' : quickType } })}><Text style={[styles.filter, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}>Filtros{activeFilters ? ` (${activeFilters})` : ''}</Text></Pressable>
      </View>
      {query.loading && !query.data ? <LoadingState /> : query.error && !query.data ? <ErrorState error={query.error} onRetry={query.reload} /> : (
        <FlatList
          contentContainerStyle={styles.list}
          data={query.data?.items ?? []}
          keyExtractor={item => String(item.id)}
          ListEmptyComponent={<EmptyState title="Nenhuma movimentação" text={search || activeFilters ? 'Ajuste a busca ou os filtros.' : 'Registre sua primeira receita ou despesa.'} actionLabel="Nova movimentação" onAction={() => router.push('/transactions/new')} />}
          renderItem={({ item }) => <TransactionRow amountCents={item.amountCents} category={item.categoryName} date={item.date} description={item.description} icon={item.categoryIcon} onPress={() => router.push(`/transactions/${item.id}`)} type={item.type} />}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginTop: 8 },
  copy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  searchWrap: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', height: 56, marginTop: 18, paddingHorizontal: 12 },
  searchIcon: { fontSize: 24, marginRight: 8 },
  search: { flex: 1, fontSize: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  filter: { borderRadius: 18, fontSize: 13, fontWeight: '600', overflow: 'hidden', paddingHorizontal: 13, paddingVertical: 9 },
  list: { flexGrow: 1, paddingBottom: 24, paddingTop: 12 },
});
