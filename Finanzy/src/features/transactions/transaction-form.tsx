import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { errorMessage, operationKey, parseMoney } from '../../domain/core';
import { Transaction, TransactionInput, TransactionType } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { todayLocal } from '../../presentation/date';
import { useTheme } from '../../theme/ThemeProvider';
import { useCategories } from '../categories/use-categories';

export function TransactionForm({ transaction, favoriteId, duplicateId }: { transaction?: Transaction; favoriteId?: number; duplicateId?: number }) {
  const { theme } = useTheme();
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(transaction?.categoryId ?? null);
  const [amount, setAmount] = useState(transaction ? (transaction.amountCents / 100).toFixed(2).replace('.', ',') : '');
  const [date, setDate] = useState(transaction?.date ?? todayLocal());
  const [observation, setObservation] = useState(transaction?.observation ?? '');
  const [favorite, setFavorite] = useState(transaction?.isFavorite ?? false);
  const [feedback, setFeedback] = useState('');
  const categories = useCategories(type);

  useEffect(() => {
    if ((!favoriteId && !duplicateId) || transaction) return;
    void getRuntime().then(async runtime => {
      if (favoriteId) return runtime.transactions.buildDraftFromFavorite(favoriteId);
      const [source, context] = await Promise.all([runtime.transactions.get(duplicateId!), runtime.finance.context()]);
      return { ...source, date: context.date, isFavorite: false };
    }).then(draft => {
      setType(draft.type);
      setDescription(draft.description);
      setCategoryId(draft.categoryId);
      setAmount((draft.amountCents / 100).toFixed(2).replace('.', ','));
      setDate(draft.date);
      setObservation(draft.observation ?? '');
    }).catch(error => setFeedback(errorMessage(error)));
  }, [duplicateId, favoriteId, transaction]);

  const save = useCallback(async () => {
    const input: TransactionInput = { type, description, categoryId: categoryId ?? 0, amountCents: parseMoney(amount), date, observation, isFavorite: favorite };
    const runtime = await getRuntime();
    return transaction ? runtime.transactions.update(transaction.id, input) : runtime.transactions.create(input, operationKey());
  }, [amount, categoryId, date, description, favorite, observation, transaction, type]);
  const action = useAsyncAction(save, result => router.replace(`/transactions/${result.id}`));
  const submit = () => {
    setFeedback('');
    void action.execute().catch(error => setFeedback(errorMessage(error)));
  };

  return (
    <AppScreen>
      <AppHeader back title={transaction ? 'Editar movimentação' : 'Nova movimentação'} />
      <SegmentedControl onChange={value => { setType(value); setCategoryId(null); }} options={[{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }]} value={type} />
      <FormField keyboardType="decimal-pad" label="Valor" onChangeText={setAmount} placeholder="0,00" value={amount} />
      <FormField label="Descrição" onChangeText={setDescription} placeholder="Ex.: Supermercado" value={description} />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {(categories.data ?? []).map(category => {
          const selected = category.id === categoryId;
          return <Text accessibilityRole="button" accessibilityState={{ selected }} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.chip, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.border, color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }]}>{category.icon} {category.name}</Text>;
        })}
      </ScrollView>
      <FormField label="Data" onChangeText={setDate} placeholder="AAAA-MM-DD" value={date} />
      <FormField label="Observação" multiline onChangeText={setObservation} placeholder="Opcional" style={styles.multiline} value={observation} />
      <Button label={favorite ? '★ Remover favorito' : '☆ Marcar como favorito'} onPress={() => setFavorite(value => !value)} variant="secondary" />
      {feedback || action.error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
      <View style={styles.save}><Button label="Salvar movimentação" loading={action.loading} onPress={submit} /></View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, marginBottom: 6 },
  categories: { marginBottom: 14 },
  chip: { borderRadius: 18, borderWidth: 1, fontSize: 13, fontWeight: '600', marginRight: 8, overflow: 'hidden', paddingHorizontal: 13, paddingVertical: 10 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  error: { fontSize: 13, marginTop: 12 },
  save: { marginTop: 18 },
});
