import { Icon } from '../../components/ui/Icon';
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
import { MoneyInput } from '../../components/ui/MoneyInput';
import { SelectField } from '../../components/ui/SelectField';
import { iconOptions, normalizeIcon } from '../../domain/icons';
import { errorMessage, operationKey, parseMoney } from '../../domain/core';
import { GoalInput } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useAsyncQuery } from '../../hooks/use-async-query';
import { formatCurrency } from '../../presentation/format';
import { toBrazilianDate, toDatabaseDate } from '../../presentation/date';
import { useTheme } from '../../theme/ThemeProvider';
import { useGoals } from './use-goals';
import { validInput } from '../../presentation/input';

export function GoalsScreen() {
  const { theme } = useTheme();
  const query = useGoals();
  return (
    <AppScreen action={<Button label="+ Criar nova meta" onPress={() => router.push('/goals/new')} />}>
      <AppHeader back title="Minhas metas" />
      {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} onRetry={query.reload} /> : query.data?.length ? query.data.map(goal => { const percent = goal.savedCents / goal.targetCents * 100; return <Pressable accessibilityRole="button" key={goal.id} onPress={() => router.push(`/goals/${goal.id}`)}><Card style={styles.card}><View style={styles.row}><Icon name={goal.icon || 'target'} size={25} /><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{goal.name}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{formatCurrency(goal.savedCents)} de {formatCurrency(goal.targetCents)}</Text></View><Text style={[styles.percent, { color: theme.colors.primaryStrong }]}>{percent.toFixed(0)}%</Text></View><View style={[styles.track, { backgroundColor: theme.colors.border }]}><View style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${Math.min(percent, 100)}%` }]} /></View></Card></Pressable>; }) : <EmptyState actionLabel="Criar meta" onAction={() => router.push('/goals/new')} text="Reserve parte do saldo para seus objetivos." title="Nenhuma meta" />}
    </AppScreen>
  );
}

export function GoalFormScreen({ id }: { id?: number }) {
  const load = useCallback(() => id ? getRuntime().then(runtime => runtime.goals.get(id)) : Promise.resolve(null), [id]);
  const query = useAsyncQuery(load);
  if (id && query.loading && !query.data) return <AppScreen><LoadingState /></AppScreen>;
  if (id && (query.error || !query.data)) return <AppScreen><AppHeader back title="Meta" /><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  return <GoalFormContent id={id} initial={query.data ?? undefined} />;
}

function GoalFormContent({ id, initial }: { id?: number; initial?: { name: string; targetCents: number; deadline: string | null; icon: string | null } }) {
  const { theme } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [target, setTarget] = useState(initial ? (initial.targetCents / 100).toFixed(2).replace('.', ',') : '');
  const [initialAmount, setInitialAmount] = useState('0');
  const [deadline, setDeadline] = useState(initial?.deadline ? toBrazilianDate(initial.deadline) : '');
  const [icon, setIcon] = useState<string>(normalizeIcon(initial?.icon, 'target'));
  const [feedback, setFeedback] = useState('');
  const canSave = name.trim().length > 0 && validInput(target, { kind: 'money', required: true }) && (Boolean(id) || validInput(initialAmount, { kind: 'money', allowZero: true })) && validInput(deadline, { kind: 'date' });
  const save = useCallback(async () => {
    const runtime = await getRuntime();
    const input: GoalInput = { name, targetCents: parseMoney(target), deadline: deadline ? toDatabaseDate(deadline) : null, icon };
    return id ? runtime.goals.update(id, input) : runtime.goals.create(input, parseMoney(initialAmount || '0'), operationKey());
  }, [deadline, icon, id, initialAmount, name, target]);
  const action = useAsyncAction(save, result => router.replace(`/goals/${result.id}`));
  return (
    <AppScreen action={<Button disabled={!canSave} label={id ? 'Salvar alterações' : 'Criar meta'} loading={action.loading} onPress={() => void action.execute().catch(error => setFeedback(errorMessage(error)))} />}>
      <AppHeader back title={id ? 'Editar meta' : 'Criar meta'} />
      <FormField label="Nome" onChangeText={setName} placeholder="Ex.: Viagem" required value={name} />
      <FormField inputKind="money" label="Valor alvo" onChangeText={setTarget} placeholder="0,00" required value={target} />
      {!id ? <FormField allowZero inputKind="money" label="Valor inicial" onChangeText={setInitialAmount} placeholder="0,00" value={initialAmount} /> : null}
      <FormField inputKind="date" label="Prazo" onChangeText={setDeadline} placeholder="Opcional" value={deadline} />
      <SelectField label="Ícone" onChange={setIcon} options={iconOptions.map(option => ({ ...option, icon: option.value }))} value={icon} />
      {feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
    </AppScreen>
  );
}

export function GoalDetailsScreen({ id }: { id: number }) {
  const { theme } = useTheme();
  const load = useCallback(() => getRuntime().then(runtime => runtime.goals.get(id)), [id]);
  const query = useAsyncQuery(load);
  const archive = useCallback(() => getRuntime().then(runtime => runtime.goals.archive(id)), [id]);
  const action = useAsyncAction(archive, () => router.replace('/goals'));
  if (query.loading && !query.data) return <AppScreen><LoadingState /></AppScreen>;
  if (query.error || !query.data) return <AppScreen><AppHeader back title="Meta" /><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  const goal = query.data;
  const confirm = () => Alert.alert('Arquivar meta?', 'O histórico de movimentos será preservado.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Arquivar', style: 'destructive', onPress: () => void action.execute().catch(() => undefined) }]);
  return (
    <AppScreen action={<Button label="Adicionar dinheiro" onPress={() => router.push(`/goals/${id}/add`)} />}>
      <AppHeader back title={goal.name} />
      <Card style={[styles.hero, { backgroundColor: theme.colors.primarySoft }]}><Icon name={goal.icon || 'target'} size={35} /><Text style={[styles.heroPercent, { color: theme.colors.primaryStrong }]}>{goal.percent.toFixed(0)}% concluído</Text><View style={[styles.track, { backgroundColor: theme.colors.chip }]}><View style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${Math.min(goal.percent, 100)}%` }]} /></View></Card>
      <View style={styles.stats}><Stat label="Objetivo" value={formatCurrency(goal.targetCents)} /><Stat label="Guardado" value={formatCurrency(goal.savedCents)} /><Stat label="Restante" value={formatCurrency(goal.remainingCents)} /></View>
      {goal.deadline ? <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Prazo: {toBrazilianDate(goal.deadline)}</Text> : null}
      <View style={styles.detailActions}><Button compact label="Editar meta" onPress={() => router.push({ pathname: '/goals/new', params: { id } })} /><Button compact label="Arquivar meta" loading={action.loading} onPress={confirm} variant="secondary" /></View>
    </AppScreen>
  );
}

export function AddMoneyScreen({ id }: { id: number }) {
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [feedback, setFeedback] = useState('');
  const move = useCallback(() => getRuntime().then(runtime => runtime.goals.move(id, 'deposit', parseMoney(amount), operationKey())), [amount, id]);
  const action = useAsyncAction(move, () => router.replace(`/goals/${id}`));
  return <AppScreen action={<Button disabled={!validInput(amount, { kind: 'money', required: true })} label="Adicionar à meta" loading={action.loading} onPress={() => void action.execute().catch(error => setFeedback(errorMessage(error)))} />}><AppHeader back title="Adicionar dinheiro" /><MoneyInput onChangeText={setAmount} value={amount} /><FormField editable={false} label="Conta de origem" value="Saldo disponível" />{feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}</AppScreen>;
}

function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return <View style={[styles.stat, { backgroundColor: theme.colors.surface }]}><Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text><Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { alignItems: 'center', flexDirection: 'row' },
  icon: { fontSize: 25 },
  copy: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 4 },
  percent: { fontSize: 12, fontWeight: '700' },
  track: { borderRadius: 5, height: 7, marginTop: 12, overflow: 'hidden' },
  fill: { borderRadius: 5, height: 7 },
  error: { fontSize: 13, marginBottom: 12 },
  hero: { marginBottom: 10, padding: 20 },
  heroIcon: { fontSize: 35 },
  heroName: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  heroPercent: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  stat: { borderRadius: 16, flex: 1, minHeight: 72, padding: 10 },
  statLabel: { fontSize: 10 },
  statValue: { fontSize: 11, fontWeight: '700', marginTop: 5 },
  gap: { marginTop: 10 },
  detailActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
