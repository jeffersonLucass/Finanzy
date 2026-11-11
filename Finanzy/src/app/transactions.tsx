import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { TransactionRow } from '../components/TransactionRow';
import { AppScreen } from '../components/ui/AppScreen';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { TransactionFilters } from '../domain/models';
import { addDays } from '../domain/core';
import { todayLocal, toBrazilianDate } from '../presentation/date';
import { useTransactions } from '../features/transactions/use-transactions';
import { formatCurrency } from '../presentation/format';
import { useTheme } from '../theme/ThemeProvider';
import { inputLimits, sanitizeInput } from '../presentation/input';

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ type?: string; categories?: string; start?: string; end?: string; favorites?: string }>();
  const [search, setSearch] = useState('');
  const [quickType, setQuickType] = useState<'all' | 'income' | 'expense'>((params.type as 'income' | 'expense') || 'all');
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
  const transactions = query.data?.items;
  const sections = useMemo(() => {
    const today = todayLocal();
    const yesterday = addDays(today, -1);
    const groups = new Map<string, NonNullable<typeof transactions>>();
    for (const item of transactions ?? []) {
      if (!groups.has(item.date)) groups.set(item.date, []);
      groups.get(item.date)!.push(item);
    }
    return [...groups].map(([date, data]) => ({ title: date === today ? 'Hoje' : date === yesterday ? 'Ontem' : toBrazilianDate(date), data }));
  }, [transactions]);
  const activeFilters = Number(Boolean(params.categories)) + Number(Boolean(params.start || params.end)) + Number(params.favorites === '1');

  return (
    <AppScreen footer={<BottomNav active="transactions" />} scroll={false}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Transações</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Saldo atual · {formatCurrency(query.data?.balanceCents ?? 0)}</Text>
        </View>
        <Button compact label="+ Nova" onPress={() => router.push('/transactions/new')} />
      </View>
      <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.copy}><Text style={[styles.searchLabel, { color: theme.colors.textSecondary }]}>Pesquisar transação</Text><TextInput accessibilityLabel="Pesquisar transação" maxLength={inputLimits.text} onChangeText={value => setSearch(sanitizeInput(value))} placeholder="Restaurante, Uber..." placeholderTextColor={theme.colors.textMuted} style={[styles.search, { color: theme.colors.text }]} value={search} /></View>
      </View>
      <View style={styles.filters}>
        {(['all', 'income', 'expense'] as const).map(value => {
          const selected = quickType === value;
          return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={value} onPress={() => setQuickType(value)}><Text style={[styles.filter, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{value === 'all' ? 'Todas' : value === 'income' ? 'Receitas' : 'Despesas'}</Text></Pressable>;
        })}
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/transactions/filters', params: { ...params, type: quickType === 'all' ? '' : quickType } })}><Text style={[styles.filter, { backgroundColor: theme.colors.chip, color: theme.colors.text }]}>Mais filtros{activeFilters ? ` (${activeFilters})` : ''}</Text></Pressable>
      </View>
      {query.loading && !query.data ? <LoadingState /> : query.error && !query.data ? <ErrorState error={query.error} onRetry={query.reload} /> : (
        <SectionList
          contentContainerStyle={styles.list}
          sections={sections}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => <Text style={[styles.day, { color: theme.colors.text }]}>{section.title}</Text>}
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
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 4 },
  searchWrap: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', height: 60, marginTop: 24, paddingHorizontal: 12 },
  searchLabel: { fontSize: 11, marginBottom: 3 },
  search: { fontFamily: 'System', fontSize: 15, padding: 0 },
  filters: { flexDirection: 'row', gap: 6, marginTop: 10 },
  filter: { borderRadius: 18, fontSize: 11, fontWeight: '600', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 9 },
  day: { fontSize: 14, fontWeight: '600', marginTop: 10 },
  list: { flexGrow: 1, paddingBottom: 24, paddingTop: 12 },
});
