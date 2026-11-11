import { Icon } from '../../components/ui/Icon';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { SelectField } from '../../components/ui/SelectField';
import { errorMessage, operationKey, parseMoney } from '../../domain/core';
import { Transaction, TransactionInput, TransactionType } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { toBrazilianDate, toDatabaseDate, todayLocal } from '../../presentation/date';
import { useTheme } from '../../theme/ThemeProvider';
import { useCategories } from '../categories/use-categories';
import { validInput } from '../../presentation/input';

export function TransactionForm({ transaction, favoriteId, duplicateId }: { transaction?: Transaction; favoriteId?: number; duplicateId?: number }) {
  const { theme } = useTheme();
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(transaction?.categoryId ?? null);
  const [amount, setAmount] = useState(transaction ? (transaction.amountCents / 100).toFixed(2).replace('.', ',') : '');
  const [date, setDate] = useState(toBrazilianDate(transaction?.date ?? todayLocal()));
  const [observation, setObservation] = useState(transaction?.observation ?? '');
  const [favorite, setFavorite] = useState(transaction?.isFavorite ?? false);
  const [feedback, setFeedback] = useState('');
  const categories = useCategories(type);
  const canSave = description.trim().length > 0 && categoryId !== null && validInput(amount, { kind: 'money', required: true }) && validInput(date, { kind: 'date', required: true });

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
      setDate(toBrazilianDate(draft.date));
      setObservation(draft.observation ?? '');
    }).catch(error => setFeedback(errorMessage(error)));
  }, [duplicateId, favoriteId, transaction]);

  const save = useCallback(async () => {
    const input: TransactionInput = { type, description, categoryId: categoryId ?? 0, amountCents: parseMoney(amount), date: toDatabaseDate(date), observation, isFavorite: favorite };
    const runtime = await getRuntime();
    return transaction ? runtime.transactions.update(transaction.id, input) : runtime.transactions.create(input, operationKey());
  }, [amount, categoryId, date, description, favorite, observation, transaction, type]);
  const action = useAsyncAction(save, result => router.replace(`/transactions/${result.id}`));
  const submit = () => {
    setFeedback('');
    void action.execute().catch(error => setFeedback(errorMessage(error)));
  };

  return (
    <AppScreen action={<><Pressable accessibilityRole="switch" accessibilityState={{ checked: favorite }} onPress={() => setFavorite(value => !value)} style={styles.favorite}><View style={[styles.favoriteIcon, { backgroundColor: theme.colors.primarySoft }]}><Icon name="star" size={18} /></View><View style={styles.favoriteCopy}><Text style={[styles.favoriteTitle, { color: theme.colors.text }]}>Favoritar movimentação</Text><Text style={[styles.favoriteHint, { color: theme.colors.textSecondary }]}>Use novamente com rapidez</Text></View><Text style={[styles.favoriteStatus, { color: theme.colors.primaryStrong }]}>{favorite ? 'Ativado' : 'Desativado'}</Text></Pressable><Button disabled={!canSave} label={transaction ? 'Salvar alterações' : 'Salvar movimentação'} loading={action.loading} onPress={submit} /></>}>
      <AppHeader back title={transaction ? 'Editar movimentação' : 'Nova movimentação'} />
      <SegmentedControl onChange={value => { setType(value); setCategoryId(null); }} options={[{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }]} value={type} />
      <MoneyInput onChangeText={setAmount} value={amount} />
      <FormField label="Descrição" onChangeText={setDescription} placeholder="Ex.: Supermercado" required value={description} />
      <SelectField label="Categoria" onChange={value => setCategoryId(Number(value))} options={(categories.data ?? []).map(category => ({ value: String(category.id), label: category.name, icon: category.icon }))} value={categoryId ? String(categoryId) : undefined} />
      <FormField inputKind="date" label="Data" onChangeText={setDate} placeholder="DD/MM/AAAA" required value={date} />
      <FormField label="Observação" multiline onChangeText={setObservation} placeholder="Opcional" style={styles.multiline} value={observation} />
      {feedback || action.error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  multiline: { minHeight: 24, textAlignVertical: 'top' },
  error: { fontSize: 13, marginTop: 12 },
  favorite: { alignItems: 'center', flexDirection: 'row', minHeight: 54, paddingBottom: 8 },
  favoriteIcon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  favoriteCopy: { flex: 1, marginHorizontal: 10 },
  favoriteTitle: { fontSize: 13, fontWeight: '600' },
  favoriteHint: { fontSize: 11, marginTop: 4 },
  favoriteStatus: { fontSize: 12, fontWeight: '600' },
});
