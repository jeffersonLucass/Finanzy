import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { errorMessage } from '../../domain/core';
import { useAsyncAction } from '../../hooks/use-async-action';
import { toBrazilianDate } from '../../presentation/date';
import { formatCurrency } from '../../presentation/format';
import { useTheme } from '../../theme/ThemeProvider';
import { useTransaction } from './use-transactions';

export function TransactionDetailsScreen({ id }: { id: number }) {
  const { theme } = useTheme();
  const query = useTransaction(id);
  const [feedback, setFeedback] = useState('');
  const remove = useCallback(() => getRuntime().then(runtime => runtime.transactions.remove(id)), [id]);
  const removeAction = useAsyncAction(remove, () => router.replace('/transactions'));
  const toggle = useCallback((favorite: boolean) => getRuntime().then(runtime => runtime.transactions.favorite(id, favorite)), [id]);
  const favoriteAction = useAsyncAction(toggle, query.reload);
  if (query.loading && !query.data) return <AppScreen><LoadingState /></AppScreen>;
  if (query.error || !query.data) return <AppScreen><AppHeader back title="Movimentação" /><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  const item = query.data;
  const confirmRemove = () => Alert.alert('Excluir movimentação?', item.occurrenceId ? 'O pagamento vinculado voltará a ficar pendente.' : 'Esta ação não pode ser desfeita.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => void removeAction.execute().catch(error => setFeedback(errorMessage(error))) }]);
  return (
    <AppScreen>
      <AppHeader back title="Detalhes" />
      <Card style={styles.hero}>
        <Text style={styles.icon}>{item.categoryIcon}</Text>
        <Text style={[styles.kind, { color: theme.colors.textSecondary }]}>{item.type === 'income' ? 'Receita' : 'Despesa'}</Text>
        <Text style={[styles.amount, { color: item.type === 'income' ? theme.colors.primaryStrong : theme.colors.danger }]}>{item.type === 'income' ? '+ ' : '- '}{formatCurrency(item.amountCents)}</Text>
        <Text style={[styles.name, { color: theme.colors.text }]}>{item.description}</Text>
      </Card>
      <Card style={styles.details}>
        <Detail label="Categoria" value={item.categoryName} />
        <Detail label="Data" value={toBrazilianDate(item.date)} />
        <Detail label="Observação" value={item.observation || 'Sem observação'} />
        <Detail label="Favorito" value={item.isFavorite ? 'Sim' : 'Não'} />
      </Card>
      <View style={styles.actions}><Button disabled={Boolean(item.occurrenceId)} label="Editar" onPress={() => router.push(`/transactions/${id}/edit`)} variant="secondary" /><Button label={item.isFavorite ? 'Remover favorito' : 'Favoritar'} loading={favoriteAction.loading} onPress={() => void favoriteAction.execute(!item.isFavorite).catch(error => setFeedback(errorMessage(error)))} variant="secondary" /></View>
      <Button label="Duplicar como nova" onPress={() => router.push({ pathname: '/transactions/new', params: { duplicateId: id } })} variant="ghost" />
      <Button label="Excluir movimentação" loading={removeAction.loading} onPress={confirmRemove} variant="danger" />
      {feedback ? <Text style={[styles.feedback, { color: theme.colors.dangerStrong }]}>{feedback}</Text> : null}
    </AppScreen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text><Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 14 },
  icon: { fontSize: 32 },
  kind: { fontSize: 12, marginTop: 8 },
  amount: { fontSize: 30, fontWeight: '700', marginTop: 5 },
  name: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  details: { marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  detailLabel: { fontSize: 13 },
  detailValue: { flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 16, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  feedback: { fontSize: 13, marginTop: 12, textAlign: 'center' },
});
