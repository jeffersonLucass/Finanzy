import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { errorMessage } from '../../domain/core';
import { TransactionType } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useTheme } from '../../theme/ThemeProvider';
import { useCategories } from './use-categories';

export function CategoriesScreen() {
  const { theme } = useTheme();
  const [type, setType] = useState<TransactionType>('expense');
  const query = useCategories(type);
  const archive = useCallback((id: number) => getRuntime().then(runtime => runtime.categories.archive(id)), []);
  const action = useAsyncAction(archive, query.reload);
  const confirm = (id: number, name: string) => Alert.alert('Arquivar categoria?', `O histórico de ${name} será preservado.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Arquivar', style: 'destructive', onPress: () => void action.execute(id).catch(() => undefined) }]);
  return (
    <AppScreen>
      <AppHeader actionLabel="+ Nova" back onAction={() => router.push({ pathname: '/categories/new', params: { type } })} title="Categorias" />
      <SegmentedControl onChange={setType} options={[{ value: 'expense', label: 'Despesas' }, { value: 'income', label: 'Receitas' }]} value={type} />
      {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} onRetry={query.reload} /> : query.data?.length ? query.data.map(category => (
        <Card key={category.id} style={styles.card}>
          <View style={[styles.icon, { backgroundColor: `${category.color}20` }]}><Text style={styles.iconText}>{category.icon}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/categories/new', params: { id: category.id, type } })} style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{category.name}</Text><Text style={[styles.type, { color: theme.colors.textSecondary }]}>{type === 'expense' ? 'Despesa' : 'Receita'}</Text></Pressable>
          <Button label="Arquivar" loading={action.loading} onPress={() => confirm(category.id, category.name)} variant="ghost" />
        </Card>
      )) : <EmptyState actionLabel="Criar categoria" onAction={() => router.push({ pathname: '/categories/new', params: { type } })} text="Crie categorias para organizar suas movimentações." title="Nenhuma categoria" />}
      {action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{errorMessage(action.error)}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', flexDirection: 'row', marginBottom: 10 },
  icon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  iconText: { fontSize: 20 },
  copy: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  type: { fontSize: 12, marginTop: 3 },
  error: { fontSize: 13, marginTop: 10 },
});
