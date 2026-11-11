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
import { SelectField } from '../../components/ui/SelectField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { MonthInput } from '../../components/ui/MonthInput';
import { Icon } from '../../components/ui/Icon';
import { errorMessage, operationKey, parseMoney } from '../../domain/core';
import { RecurringExpense, RecurringInput } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useAsyncQuery } from '../../hooks/use-async-query';
import { toBrazilianDate, todayLocal } from '../../presentation/date';
import { formatCurrency } from '../../presentation/format';
import { useTheme } from '../../theme/ThemeProvider';
import { useCategories } from '../categories/use-categories';
import { validInput } from '../../presentation/input';

const currentMonth = () => todayLocal().slice(0, 7);

export function RecurringListScreen() {
  const { theme } = useTheme();
  const [kind, setKind] = useState<RecurringExpense['kind']>('subscription');
  const load = useCallback(() => getRuntime().then(runtime => runtime.recurring.list()), []);
  const query = useAsyncQuery(load);
  return (
    <AppScreen action={<Button label="+ Novo gasto mensal" onPress={() => router.push('/recurring/new')} />}>
      <AppHeader back title="Gastos mensais" />
      <SegmentedControl onChange={setKind} options={[{ value: 'subscription', label: 'Mensalidades' }, { value: 'installment', label: 'Parcelamentos' }]} value={kind} />
      {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} onRetry={query.reload} /> : query.data?.some(item => item.kind === kind) ? query.data.filter(item => item.kind === kind).map(item => <Pressable accessibilityRole="button" key={item.id} onPress={() => router.push(item.kind === 'subscription' ? `/recurring/subscriptions/${item.id}` : `/recurring/installments/${item.id}`)}><View style={styles.listCard}><View style={[styles.kindIcon, { backgroundColor: theme.colors.primarySoft }]}><Text>{item.kind === 'subscription' ? '↻' : '▤'}</Text></View><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Dia {item.dueDay} · {item.cancelledFromMonth ? 'Cancelado' : 'Ativo'}{item.installmentCount ? ` · ${item.installmentCount} parcelas` : ''}</Text></View><Text style={[styles.value, { color: theme.colors.text }]}>{formatCurrency(item.amountCents)}{kind === 'subscription' ? '/mês' : ''}</Text></View></Pressable>) : <EmptyState text="Cadastre mensalidades e parcelamentos para acompanhar vencimentos." title="Nenhum gasto mensal" />}
    </AppScreen>
  );
}

export function RecurringTypeScreen() {
  const { theme } = useTheme();
  return (
    <AppScreen>
      <AppHeader back title="Qual tipo de gasto?" />
      <Pressable accessibilityRole="button" onPress={() => router.push('/recurring/subscriptions/new')}><Card style={styles.typeCard}><Text style={[styles.typeIcon, { color: theme.colors.primary }]}>↻</Text><View><Text style={[styles.typeTitle, { color: theme.colors.text }]}>Mensalidade</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Pagamento recorrente sem data definida para terminar.</Text></View></Card></Pressable>
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
  const canSave = name.trim().length > 0 && categoryId !== null && validInput(amount, { kind: 'money', required: true }) && validInput(dueDay, { kind: 'integer', required: true, min: 1, max: 31 }) && (kind !== 'installment' || validInput(count, { kind: 'integer', required: true, min: 1, max: 3600 }));
  const create = useCallback(() => {
    const input: RecurringInput = { kind, name, amountCents: parseMoney(amount), categoryId: categoryId ?? 0, dueDay: Number(dueDay), startMonth, installmentCount: kind === 'installment' ? Number(count) : null };
    return getRuntime().then(runtime => runtime.recurring.create(input, operationKey()));
  }, [amount, categoryId, count, dueDay, kind, name, startMonth]);
  const action = useAsyncAction(create, result => router.replace(kind === 'subscription' ? `/recurring/subscriptions/${result.id}` : `/recurring/installments/${result.id}`));
  const submit = () => void action.execute().catch(error => setFeedback(errorMessage(error)));
  const total = kind === 'installment' && amount && count ? (() => { try { return parseMoney(amount) * Number(count); } catch { return 0; } })() : 0;
  return (
    <AppScreen action={<Button disabled={!canSave} label={kind === 'subscription' ? 'Cadastrar mensalidade' : 'Cadastrar parcelamento'} loading={action.loading} onPress={submit} />}>
      <AppHeader back title={kind === 'subscription' ? 'Nova mensalidade' : 'Novo parcelamento'} />
      <FormField label="Nome" onChangeText={setName} placeholder={kind === 'subscription' ? 'Ex.: Streaming' : 'Ex.: Notebook'} required value={name} />
      <FormField inputKind="money" label={kind === 'subscription' ? 'Valor mensal' : 'Valor da parcela'} onChangeText={setAmount} placeholder="0,00" required value={amount} />
      <SelectField label="Categoria" onChange={value => setCategoryId(Number(value))} options={(categories.data ?? []).map(category => ({ value: String(category.id), label: category.name, icon: category.icon }))} value={categoryId ? String(categoryId) : undefined} />
      <FormField inputKind="integer" label="Dia do vencimento" max={31} maxLength={2} min={1} onChangeText={setDueDay} required value={dueDay} /><MonthInput label={kind === 'subscription' ? 'Data de início' : 'Primeira parcela'} onChange={setStartMonth} value={startMonth} />
      {kind === 'installment' ? <FormField inputKind="integer" label="Quantidade de parcelas" max={3600} maxLength={4} min={1} onChangeText={setCount} required value={count} /> : null}
      {kind === 'installment' && total ? <Card><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Total do parcelamento</Text><Text style={[styles.total, { color: theme.colors.text }]}>{formatCurrency(total)}</Text></Card> : null}
      {feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
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
      <AppHeader back title={item.name} />
      {item.totalCents !== null ? <><View style={styles.totals}><RecurringStat label="Total" value={item.totalCents} /><RecurringStat label="Pago" value={item.paidCents} tone="positive" /><RecurringStat label="Restante" value={item.remainingCents ?? 0} tone="negative" /></View><Card style={styles.progressCard}><Text style={[styles.progressLabel, { color: theme.colors.text }]}>{item.occurrences.filter(occurrence => occurrence.status === 'paid').length} de {item.installmentCount} parcelas · {Math.round(item.paidCents / item.totalCents * 100)}%</Text><View style={[styles.progressTrack, { backgroundColor: theme.colors.chip }]}><View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${Math.min(item.paidCents / item.totalCents * 100, 100)}%` }]} /></View></Card></> : <Card style={styles.hero}><Text style={[styles.subscriptionAmount, { color: theme.colors.text }]}>{formatCurrency(item.amountCents)} / mês</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{item.cancelledFromMonth ? 'Cancelada' : 'Ativa'} · Todo dia {item.dueDay}</Text></Card>}
      <Text style={[styles.section, { color: theme.colors.text }]}>{item.kind === 'installment' ? 'Parcelas' : 'Histórico'}</Text>
      {item.occurrences.map(occurrence => <View key={`${occurrence.referenceMonth}-${occurrence.id}`} style={styles.occurrence}><View style={[styles.statusIcon, { backgroundColor: theme.colors.primarySoft }]}><Icon color={occurrence.status === 'paid' ? theme.colors.primaryStrong : theme.colors.textSecondary} name={occurrence.status === 'paid' ? 'check' : 'calendar'} size={16} /></View><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{occurrence.installmentNumber ? `${occurrence.installmentNumber}/${item.installmentCount}` : new Date(`${occurrence.referenceMonth}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long' })}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{occurrence.status === 'paid' ? 'Pago' : occurrence.status === 'cancelled' ? 'Cancelado' : 'Pendente'} · {toBrazilianDate(occurrence.dueDate)}</Text></View><View style={styles.paymentAction}><Text style={[styles.value, { color: occurrence.status === 'paid' ? theme.colors.primaryStrong : theme.colors.textSecondary }]}>{formatCurrency(occurrence.amountCents)}</Text>{occurrence.id && occurrence.status === 'pending' ? <Button compact label="Pagar" loading={payAction.loading} onPress={() => void payAction.execute(occurrence.id!).catch(error => setFeedback(errorMessage(error)))} variant="ghost" /> : null}{occurrence.id && occurrence.status === 'paid' ? <Button compact label="Desfazer" loading={undoAction.loading} onPress={() => void undoAction.execute(occurrence.id!).catch(error => setFeedback(errorMessage(error)))} variant="ghost" /> : null}</View></View>)}
      {!item.cancelledFromMonth ? <View style={styles.cancel}><Button compact label={item.kind === 'subscription' ? 'Cancelar mensalidade' : 'Cancelar parcelas futuras'} loading={cancelAction.loading} onPress={cancelRule} variant="secondary" /></View> : null}
      {feedback ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback}</Text> : null}
    </AppScreen>
  );
}

function RecurringStat({ label, value, tone }: { label: string; value: number; tone?: 'positive' | 'negative' }) {
  const { theme } = useTheme();
  return <Card style={styles.stat}><Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text><Text style={[styles.statValue, { color: tone === 'positive' ? theme.colors.primaryStrong : tone === 'negative' ? theme.colors.danger : theme.colors.text }]}>{formatCurrency(value)}</Text></Card>;
}

const styles = StyleSheet.create({
  listCard: { alignItems: 'center', flexDirection: 'row', minHeight: 58 },
  kindIcon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  copy: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  value: { fontSize: 13, fontWeight: '700' },
  typeCard: { gap: 12, marginBottom: 12, minHeight: 156, padding: 24 },
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
  occurrence: { alignItems: 'center', flexDirection: 'row', minHeight: 68 },
  statusIcon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  paymentAction: { alignItems: 'flex-end' },
  totals: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, minWidth: 0, padding: 10, minHeight: 72 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  subscriptionAmount: { fontSize: 18, fontWeight: '700' },
  progressCard: { marginBottom: 18, padding: 14 },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressTrack: { borderRadius: 5, height: 7, marginTop: 10, overflow: 'hidden' },
  progressFill: { borderRadius: 5, height: 7 },
  cancel: { alignSelf: 'flex-start', marginTop: 12 },
});
