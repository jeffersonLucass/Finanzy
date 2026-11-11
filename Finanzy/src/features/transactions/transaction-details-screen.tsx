import { Icon } from '../../components/ui/Icon';
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
    <AppScreen action={<Button label="Excluir movimentação" loading={removeAction.loading} onPress={confirmRemove} variant="destructive" />}>
      <AppHeader back title={item.description} />
      <Card style={[styles.hero, { backgroundColor: item.type === 'income' ? theme.colors.primarySoft : theme.colors.dangerSoft }]}>
        <Icon name={item.categoryIcon} size={32} />
        <Text style={[styles.amount, { color: item.type === 'income' ? theme.colors.primaryStrong : theme.colors.danger }]}>{item.type === 'income' ? '+ ' : '- '}{formatCurrency(item.amountCents)}</Text>
      </Card>
      <View style={styles.details}>
        <Detail label="Tipo" value={item.type === 'income' ? 'Receita' : 'Despesa'} />
        <Detail label="Categoria" value={item.categoryName} />
        <Detail label="Data" value={toBrazilianDate(item.date)} />
        <Detail label="Observação" value={item.observation || 'Sem observação'} />
      </View>
      <View style={styles.actions}><Button compact disabled={Boolean(item.occurrenceId)} label="Editar" onPress={() => router.push(`/transactions/${id}/edit`)} /><Button compact label="Duplicar" onPress={() => router.push({ pathname: '/transactions/new', params: { duplicateId: id } })} variant="secondary" /><Button compact label={item.isFavorite ? 'Desfavoritar' : 'Favoritar'} loading={favoriteAction.loading} onPress={() => void favoriteAction.execute(!item.isFavorite).catch(error => setFeedback(errorMessage(error)))} variant="secondary" /></View>
      {feedback ? <Text style={[styles.feedback, { color: theme.colors.dangerStrong }]}>{feedback}</Text> : null}
    </AppScreen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  const icons: Record<string, string> = { Tipo: 'arrow-down', Categoria: 'tags', Data: 'calendar', Observação: 'file-text' };
  return <View style={styles.detailRow}><View style={[styles.detailIcon, { backgroundColor: theme.colors.primarySoft }]}><Icon name={icons[label]} size={18} /></View><View><Text style={[styles.detailLabel, { color: theme.colors.text }]}>{label}</Text><Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'flex-start', marginBottom: 10, padding: 18 },
  icon: { fontSize: 32 },
  amount: { fontSize: 28, fontWeight: '700', marginTop: 8 },
  details: { marginBottom: 14 },
  detailRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 10, minHeight: 62 },
  detailIcon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 11, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  feedback: { fontSize: 13, marginTop: 12, textAlign: 'center' },
});
