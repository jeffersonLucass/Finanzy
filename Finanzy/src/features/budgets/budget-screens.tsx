import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { errorMessage, parseMoney } from '../../domain/core';
import { useAsyncAction } from '../../hooks/use-async-action';
import { formatCurrency } from '../../presentation/format';
import { useTheme } from '../../theme/ThemeProvider';
import { useCategories } from '../categories/use-categories';
import { useBudgets } from './use-budgets';

export function BudgetsScreen() {
  const { theme } = useTheme();
  const query = useBudgets();
  const remove = useCallback((id: number) => getRuntime().then(runtime => runtime.budgets.remove(id)), []);
  const action = useAsyncAction(remove, query.reload);
  const confirm = (id: number) => Alert.alert('Excluir orçamento?', 'O limite será removido, mas as movimentações serão preservadas.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => void action.execute(id).catch(() => undefined) }]);
  return (
    <AppScreen>
      <AppHeader actionLabel="+ Novo" back onAction={() => router.push('/budgets/new')} title="Orçamentos" subtitle="Limites mensais por categoria" />
      {query.loading && !query.data ? <LoadingState /> : query.error || !query.data ? <ErrorState error={query.error} onRetry={query.reload} /> : <>
        <Card style={styles.summary}><Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Limite total</Text><Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(query.data.limitCents)}</Text><Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Gasto {formatCurrency(query.data.spentCents)} · Sem orçamento {formatCurrency(query.data.unbudgetedCents)}</Text></Card>
        {query.data.items.length ? query.data.items.map(item => <Card key={item.id} style={styles.card}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/budgets/new', params: { id: item.id } })}><View style={styles.row}><Text style={styles.icon}>{item.category.icon}</Text><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{item.category.name}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{formatCurrency(item.spentCents)} de {formatCurrency(item.limitCents)}</Text></View><Text style={[styles.percent, { color: item.status === 'exceeded' ? theme.colors.danger : item.status === 'warning' ? theme.colors.warning : theme.colors.primaryStrong }]}>{item.percent.toFixed(0)}%</Text></View><View style={[styles.track, { backgroundColor: theme.colors.border }]}><View style={[styles.fill, { backgroundColor: item.status === 'exceeded' ? theme.colors.danger : item.status === 'warning' ? theme.colors.warning : theme.colors.primary, width: `${Math.min(item.percent, 100)}%` }]} /></View></Pressable><Button label="Excluir" loading={action.loading} onPress={() => confirm(item.id)} variant="ghost" /></Card>) : <EmptyState actionLabel="Criar orçamento" onAction={() => router.push('/budgets/new')} text="Defina limites para acompanhar seus gastos." title="Nenhum orçamento" />}
      </>}
    </AppScreen>
  );
}

export function BudgetFormScreen({ id }: { id?: number }) {
  const budgets = useBudgets();
  const categories = useCategories('expense');
  if ((budgets.loading || categories.loading) && (!budgets.data || !categories.data)) return <AppScreen><LoadingState /></AppScreen>;
  if (budgets.error || categories.error) return <AppScreen><AppHeader back title="Orçamento" /><ErrorState error={budgets.error || categories.error} onRetry={() => { budgets.reload(); categories.reload(); }} /></AppScreen>;
  const item = budgets.data?.items.find(value => value.id === id);
  return <BudgetFormContent categories={categories.data ?? []} id={id} initialCategoryId={item?.categoryId} initialLimitCents={item?.limitCents} usedCategoryIds={budgets.data?.items.map(value => value.categoryId) ?? []} />;
}

function BudgetFormContent({ id, initialCategoryId, initialLimitCents, categories, usedCategoryIds }: { id?: number; initialCategoryId?: number; initialLimitCents?: number; categories: { id: number; icon: string; name: string }[]; usedCategoryIds: number[] }) {
  const { theme } = useTheme();
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId ?? null);
  const [limit, setLimit] = useState(initialLimitCents ? (initialLimitCents / 100).toFixed(2).replace('.', ',') : '');
  const [feedback, setFeedback] = useState('');
  const save = useCallback(() => getRuntime().then(runtime => runtime.budgets.save(categoryId ?? 0, parseMoney(limit), id)), [categoryId, id, limit]);
  const action = useAsyncAction(save, () => router.replace('/budgets'));
  return (
    <AppScreen>
      <AppHeader back title={id ? 'Editar orçamento' : 'Novo orçamento'} />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Categoria de despesa</Text>
      <View style={styles.chips}>{categories.map(category => { const selected = category.id === categoryId; const used = !id && usedCategoryIds.includes(category.id); return <Pressable disabled={used} key={category.id} onPress={() => setCategoryId(category.id)}><Text style={[styles.chip, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, color: selected ? theme.colors.onPrimary : theme.colors.textSecondary, opacity: used ? 0.4 : 1 }]}>{category.icon} {category.name}</Text></Pressable>; })}</View>
      <FormField keyboardType="decimal-pad" label="Limite mensal" onChangeText={setLimit} placeholder="0,00" value={limit} />
      {feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
      <Button label="Salvar orçamento" loading={action.loading} onPress={() => void action.execute().catch(error => setFeedback(errorMessage(error)))} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summary: { marginBottom: 16 },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  summaryValue: { fontSize: 27, fontWeight: '700', marginVertical: 5 },
  card: { marginBottom: 10 },
  row: { alignItems: 'center', flexDirection: 'row' },
  icon: { fontSize: 22 },
  copy: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 4 },
  percent: { fontSize: 13, fontWeight: '700' },
  track: { borderRadius: 5, height: 7, marginVertical: 12, overflow: 'hidden' },
  fill: { borderRadius: 5, height: 7 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: { borderRadius: 18, fontSize: 13, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 9 },
  error: { fontSize: 13, marginBottom: 12 },
});
