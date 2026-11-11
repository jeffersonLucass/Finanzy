import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { errorMessage, operationKey } from '../../domain/core';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useAsyncQuery } from '../../hooks/use-async-query';
import { todayLocal } from '../../presentation/date';
import { formatCurrency } from '../../presentation/format';
import { useTheme } from '../../theme/ThemeProvider';

export default function OccurrenceRoute() {
  const { theme } = useTheme();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const [feedback, setFeedback] = useState('');
  const load = useCallback(() => getRuntime().then(runtime => runtime.recurring.occurrence(id)), [id]);
  const query = useAsyncQuery(load);
  const pay = useCallback(() => getRuntime().then(runtime => runtime.recurring.payOccurrence(id, todayLocal(), operationKey())), [id]);
  const undo = useCallback(() => getRuntime().then(runtime => runtime.recurring.undoPayment(id, operationKey())), [id]);
  const payAction = useAsyncAction(pay, query.reload);
  const undoAction = useAsyncAction(undo, query.reload);
  if (query.loading && !query.data) return <AppScreen><LoadingState /></AppScreen>;
  if (query.error || !query.data) return <AppScreen><AppHeader back title="Vencimento" /><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  const { occurrence, rule } = query.data;
  const details = rule.kind === 'subscription' ? `/recurring/subscriptions/${rule.id}` : `/recurring/installments/${rule.id}`;
  return <AppScreen><AppHeader back title="Vencimento" /><Card style={styles.card}><Text style={[styles.name, { color: theme.colors.text }]}>{occurrence.name}</Text><Text style={[styles.amount, { color: theme.colors.danger }]}>{formatCurrency(occurrence.amountCents)}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Vence em {occurrence.dueDate}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Status: {occurrence.status === 'paid' ? 'Pago' : occurrence.status === 'cancelled' ? 'Cancelado' : 'Pendente'}</Text></Card>{occurrence.status === 'pending' ? <Button label="Marcar como pago" loading={payAction.loading} onPress={() => void payAction.execute().catch(error => setFeedback(errorMessage(error)))} /> : null}{occurrence.status === 'paid' ? <Button label="Desfazer pagamento" loading={undoAction.loading} onPress={() => void undoAction.execute().catch(error => setFeedback(errorMessage(error)))} variant="secondary" /> : null}<Button label="Ver gasto mensal" onPress={() => router.push(details)} variant="ghost" />{feedback ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback}</Text> : null}</AppScreen>;
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  name: { fontSize: 18, fontWeight: '700' },
  amount: { fontSize: 28, fontWeight: '700', marginTop: 9 },
  meta: { fontSize: 13, marginTop: 6 },
  error: { fontSize: 13, marginTop: 12, textAlign: 'center' },
});
