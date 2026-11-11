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
import { errorMessage, operationKey, parseMoney } from '../../domain/core';
import { RecurringExpense, RecurringInput } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useAsyncQuery } from '../../hooks/use-async-query';
import { todayLocal } from '../../presentation/date';
import { formatCurrency } from '../../presentation/format';
import { useTheme } from '../../theme/ThemeProvider';
import { useCategories } from '../categories/use-categories';

const currentMonth = () => todayLocal().slice(0, 7);

export function RecurringListScreen() {
  const { theme } = useTheme();
  const load = useCallback(() => getRuntime().then(runtime => runtime.recurring.list()), []);
  const query = useAsyncQuery(load);
  return (
    <AppScreen>
      <AppHeader actionLabel="+ Novo" back onAction={() => router.push('/recurring/new')} title="Gastos mensais" subtitle="Assinaturas e parcelamentos" />
      {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} onRetry={query.reload} /> : query.data?.length ? query.data.map(item => <Pressable accessibilityRole="button" key={item.id} onPress={() => router.push(item.kind === 'subscription' ? `/recurring/subscriptions/${item.id}` : `/recurring/installments/${item.id}`)}><Card style={styles.listCard}><View style={[styles.kindIcon, { backgroundColor: item.kind === 'subscription' ? theme.colors.infoSoft : theme.colors.warningSoft }]}><Text>{item.kind === 'subscription' ? '↻' : '▤'}</Text></View><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Vence dia {item.dueDay}{item.installmentCount ? ` · ${item.installmentCount} parcelas` : ''}</Text></View><Text style={[styles.value, { color: theme.colors.danger }]}>{formatCurrency(item.amountCents)}</Text></Card></Pressable>) : <EmptyState actionLabel="Adicionar gasto" onAction={() => router.push('/recurring/new')} text="Cadastre assinaturas e parcelamentos para acompanhar vencimentos." title="Nenhum gasto mensal" />}
    </AppScreen>
  );
}

export function RecurringTypeScreen() {
  const { theme } = useTheme();
  return (
    <AppScreen>
      <AppHeader back title="Tipo de gasto" subtitle="Escolha como o compromisso se repete" />
      <Pressable accessibilityRole="button" onPress={() => router.push('/recurring/subscriptions/new')}><Card style={styles.typeCard}><Text style={styles.typeIcon}>↻</Text><View style={styles.copy}><Text style={[styles.typeTitle, { color: theme.colors.text }]}>Assinatura</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Cobrança contínua, como streaming ou academia.</Text></View><Text style={{ color: theme.colors.textMuted }}>›</Text></Card></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/recurring/installments/new')}><Card style={styles.typeCard}><Text style={styles.typeIcon}>▤</Text><View style={styles.copy}><Text style={[styles.typeTitle, { color: theme.colors.text }]}>Parcelamento</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Quantidade definida de parcelas mensais.</Text></View><Text style={{ color: theme.colors.textMuted }}>›</Text></Card></Pressable>
    </AppScreen>
  );
}

export function RecurringFormScreen({ kind }: { kind: RecurringExpense['kind'] }) {
  const { theme } = useTheme();
  const categories = useCategories('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [dueDay, setDueDay] = useState('10');
  const [startMonth, setStartMonth] = useState(currentMonth());
  const [count, setCount] = useState('12');
  const [feedback, setFeedback] = useState('');
  const create = useCallback(() => {
    const input: RecurringInput = { kind, name, amountCents: parseMoney(amount), categoryId: categoryId ?? 0, dueDay: Number(dueDay), startMonth, installmentCount: kind === 'installment' ? Number(count) : null };
    return getRuntime().then(runtime => runtime.recurring.create(input, operationKey()));
  }, [amount, categoryId, count, dueDay, kind, name, startMonth]);
  const action = useAsyncAction(create, result => router.replace(kind === 'subscription' ? `/recurring/subscriptions/${result.id}` : `/recurring/installments/${result.id}`));
  const submit = () => void action.execute().catch(error => setFeedback(errorMessage(error)));
  const total = kind === 'installment' && amount && count ? (() => { try { return parseMoney(amount) * Number(count); } catch { return 0; } })() : 0;
  return (
    <AppScreen>
      <AppHeader back title={kind === 'subscription' ? 'Nova assinatura' : 'Novo parcelamento'} />
      <FormField label="Nome" onChangeText={setName} placeholder={kind === 'subscription' ? 'Ex.: Streaming' : 'Ex.: Notebook'} value={name} />
      <FormField keyboardType="decimal-pad" label={kind === 'subscription' ? 'Valor mensal' : 'Valor da parcela'} onChangeText={setAmount} placeholder="0,00" value={amount} />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Categoria</Text>
      <View style={styles.chips}>{(categories.data ?? []).map(category => { const selected = category.id === categoryId; return <Pressable key={category.id} onPress={() => setCategoryId(category.id)}><Text style={[styles.chip, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }]}>{category.icon} {category.name}</Text></Pressable>; })}</View>
      <View style={styles.fields}><View style={styles.half}><FormField keyboardType="number-pad" label="Dia do vencimento" onChangeText={setDueDay} value={dueDay} /></View><View style={styles.half}><FormField label="Mês inicial" onChangeText={setStartMonth} placeholder="AAAA-MM" value={startMonth} /></View></View>
      {kind === 'installment' ? <FormField keyboardType="number-pad" label="Quantidade de parcelas" onChangeText={setCount} value={count} /> : null}
      {kind === 'installment' && total ? <Card><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Total do parcelamento</Text><Text style={[styles.total, { color: theme.colors.text }]}>{formatCurrency(total)}</Text></Card> : null}
      {feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
      <View style={styles.save}><Button label="Salvar" loading={action.loading} onPress={submit} /></View>
    </AppScreen>
  );
}

export function RecurringDetailsScreen({ id }: { id: number }) {
  const { theme } = useTheme();
  const load = useCallback(() => getRuntime().then(runtime => runtime.recurring.details(id)), [id]);
  const query = useAsyncQuery(load);
  const [feedback, setFeedback] = useState('');
  const pay = useCallback((occurrenceId: number) => getRuntime().then(runtime => runtime.recurring.payOccurrence(occurrenceId, todayLocal(), operationKey())), []);
  const undo = useCallback((occurrenceId: number) => getRuntime().then(runtime => runtime.recurring.undoPayment(occurrenceId, operationKey())), []);
  const cancel = useCallback(() => getRuntime().then(runtime => runtime.recurring.cancel(id, currentMonth())), [id]);
  const payAction = useAsyncAction(pay, query.reload);
  const undoAction = useAsyncAction(undo, query.reload);
  const cancelAction = useAsyncAction(cancel, query.reload);
  if (query.loading && !query.data) return <AppScreen><LoadingState /></AppScreen>;
  if (query.error || !query.data) return <AppScreen><AppHeader back title="Gasto mensal" /><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  const item = query.data;
  const cancelRule = () => Alert.alert('Cancelar próximas cobranças?', 'Ocorrências futuras pendentes serão canceladas e o histórico será preservado.', [{ text: 'Voltar', style: 'cancel' }, { text: 'Cancelar cobranças', style: 'destructive', onPress: () => void cancelAction.execute().catch(error => setFeedback(errorMessage(error))) }]);
  return (
    <AppScreen>
      <AppHeader back title={item.kind === 'subscription' ? 'Detalhes da assinatura' : 'Detalhes do parcelamento'} />
      <Card style={styles.hero}><Text style={[styles.heroName, { color: theme.colors.text }]}>{item.name}</Text><Text style={[styles.heroValue, { color: theme.colors.danger }]}>{formatCurrency(item.amountCents)}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Vencimento dia {item.dueDay}</Text>{item.totalCents !== null ? <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Pago {formatCurrency(item.paidCents)} · Restante {formatCurrency(item.remainingCents ?? 0)}</Text> : null}</Card>
      <Text style={[styles.section, { color: theme.colors.text }]}>Ocorrências</Text>
      {item.occurrences.map(occurrence => <Card key={`${occurrence.referenceMonth}-${occurrence.id}`} style={styles.occurrence}><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{occurrence.referenceMonth}{occurrence.installmentNumber ? ` · ${occurrence.installmentNumber}/${item.installmentCount}` : ''}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Vence em {occurrence.dueDate} · {occurrence.status === 'paid' ? 'Pago' : occurrence.status === 'cancelled' ? 'Cancelado' : 'Pendente'}</Text></View>{occurrence.id && occurrence.status === 'pending' ? <Button label="Pagar" loading={payAction.loading} onPress={() => void payAction.execute(occurrence.id!).catch(error => setFeedback(errorMessage(error)))} /> : null}{occurrence.id && occurrence.status === 'paid' ? <Button label="Desfazer" loading={undoAction.loading} onPress={() => void undoAction.execute(occurrence.id!).catch(error => setFeedback(errorMessage(error)))} variant="secondary" /> : null}</Card>)}
      {!item.cancelledFromMonth ? <Button label="Cancelar próximas cobranças" loading={cancelAction.loading} onPress={cancelRule} variant="danger" /> : null}
      {feedback ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listCard: { alignItems: 'center', flexDirection: 'row', marginBottom: 10 },
  kindIcon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  copy: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  value: { fontSize: 13, fontWeight: '700' },
  typeCard: { alignItems: 'center', flexDirection: 'row', marginBottom: 12, minHeight: 92 },
  typeIcon: { fontSize: 28 },
  typeTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 12, marginBottom: 7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  chip: { borderRadius: 18, fontSize: 12, overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 9 },
  fields: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  total: { fontSize: 20, fontWeight: '700', marginTop: 5 },
  save: { marginTop: 18 },
  error: { fontSize: 13, marginTop: 12, textAlign: 'center' },
  hero: { marginBottom: 16 },
  heroName: { fontSize: 18, fontWeight: '700' },
  heroValue: { fontSize: 27, fontWeight: '700', marginTop: 8 },
  section: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  occurrence: { alignItems: 'center', flexDirection: 'row', marginBottom: 9 },
});
