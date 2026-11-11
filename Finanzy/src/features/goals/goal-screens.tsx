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
import { GoalInput } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useAsyncQuery } from '../../hooks/use-async-query';
import { formatCurrency } from '../../presentation/format';
import { useTheme } from '../../theme/ThemeProvider';
import { useGoals } from './use-goals';

export function GoalsScreen() {
  const { theme } = useTheme();
  const query = useGoals();
  return (
    <AppScreen>
      <AppHeader actionLabel="+ Nova" back onAction={() => router.push('/goals/new')} title="Metas" subtitle="Transforme planos em progresso" />
      {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} onRetry={query.reload} /> : query.data?.length ? query.data.map(goal => { const percent = goal.savedCents / goal.targetCents * 100; return <Pressable accessibilityRole="button" key={goal.id} onPress={() => router.push(`/goals/${goal.id}`)}><Card style={styles.card}><View style={styles.row}><Text style={styles.icon}>{goal.icon || '🎯'}</Text><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{goal.name}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{formatCurrency(goal.savedCents)} de {formatCurrency(goal.targetCents)}</Text></View><Text style={[styles.percent, { color: theme.colors.primaryStrong }]}>{percent.toFixed(0)}%</Text></View><View style={[styles.track, { backgroundColor: theme.colors.border }]}><View style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${Math.min(percent, 100)}%` }]} /></View></Card></Pressable>; }) : <EmptyState actionLabel="Criar meta" onAction={() => router.push('/goals/new')} text="Reserve parte do saldo para seus objetivos." title="Nenhuma meta" />}
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
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🎯');
  const [feedback, setFeedback] = useState('');
  const save = useCallback(async () => {
    const runtime = await getRuntime();
    const input: GoalInput = { name, targetCents: parseMoney(target), deadline: deadline || null, icon };
    return id ? runtime.goals.update(id, input) : runtime.goals.create(input, parseMoney(initialAmount), operationKey());
  }, [deadline, icon, id, initialAmount, name, target]);
  const action = useAsyncAction(save, result => router.replace(`/goals/${result.id}`));
  return (
    <AppScreen>
      <AppHeader back title={id ? 'Editar meta' : 'Nova meta'} />
      <FormField label="Nome" onChangeText={setName} placeholder="Ex.: Viagem" value={name} />
      <FormField keyboardType="decimal-pad" label="Valor alvo" onChangeText={setTarget} placeholder="0,00" value={target} />
      {!id ? <FormField keyboardType="decimal-pad" label="Valor inicial" onChangeText={setInitialAmount} placeholder="0,00" value={initialAmount} /> : null}
      <FormField label="Prazo opcional" onChangeText={setDeadline} placeholder="AAAA-MM-DD" value={deadline} />
      <FormField label="Ícone" maxLength={4} onChangeText={setIcon} value={icon} />
      {feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
      <Button label="Salvar meta" loading={action.loading} onPress={() => void action.execute().catch(error => setFeedback(errorMessage(error)))} />
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
    <AppScreen>
      <AppHeader back title="Detalhes da meta" />
      <Card style={[styles.hero, { backgroundColor: theme.colors.primarySoft }]}><Text style={styles.heroIcon}>{goal.icon || '🎯'}</Text><Text style={[styles.heroName, { color: theme.colors.text }]}>{goal.name}</Text><Text style={[styles.heroPercent, { color: theme.colors.primaryStrong }]}>{goal.percent.toFixed(0)}%</Text><View style={[styles.track, { backgroundColor: theme.colors.border }]}><View style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${Math.min(goal.percent, 100)}%` }]} /></View><View style={styles.stats}><Stat label="Guardado" value={formatCurrency(goal.savedCents)} /><Stat label="Restante" value={formatCurrency(goal.remainingCents)} /><Stat label="Objetivo" value={formatCurrency(goal.targetCents)} /></View><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Prazo: {goal.deadline ?? 'Sem prazo'}</Text></Card>
      <Button label="Adicionar dinheiro" onPress={() => router.push(`/goals/${id}/add`)} />
      <View style={styles.gap}><Button label="Editar meta" onPress={() => router.push({ pathname: '/goals/new', params: { id } })} variant="secondary" /></View>
      <View style={styles.gap}><Button label="Arquivar meta" loading={action.loading} onPress={confirm} variant="danger" /></View>
    </AppScreen>
  );
}

export function AddMoneyScreen({ id }: { id: number }) {
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [feedback, setFeedback] = useState('');
  const move = useCallback(() => getRuntime().then(runtime => runtime.goals.move(id, 'deposit', parseMoney(amount), operationKey())), [amount, id]);
  const action = useAsyncAction(move, () => router.replace(`/goals/${id}`));
  return <AppScreen><AppHeader back title="Adicionar dinheiro" /><FormField autoFocus keyboardType="decimal-pad" label="Valor" onChangeText={setAmount} placeholder="0,00" value={amount} />{feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}<Button label="Confirmar depósito" loading={action.loading} onPress={() => void action.execute().catch(error => setFeedback(errorMessage(error)))} /></AppScreen>;
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
  hero: { alignItems: 'center', marginBottom: 16 },
  heroIcon: { fontSize: 35 },
  heroName: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  heroPercent: { fontSize: 26, fontWeight: '700', marginTop: 8 },
  stats: { flexDirection: 'row', gap: 6, marginTop: 14 },
  stat: { borderRadius: 12, flex: 1, padding: 9 },
  statLabel: { fontSize: 10 },
  statValue: { fontSize: 11, fontWeight: '700', marginTop: 5 },
  gap: { marginTop: 10 },
});
