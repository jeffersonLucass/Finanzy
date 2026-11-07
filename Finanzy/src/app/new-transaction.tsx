import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import { addTransaction, TransactionType } from '../database';
import {
  formatBrazilianDateInput,
  isValidBrazilianDate,
  toBrazilianDate,
  toDatabaseDate,
} from '../date';

const expenseCategories = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras',
  'Serviços',
  'Outros',
];

const incomeCategories = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Presente',
  'Reembolso',
  'Outros',
];

function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NewTransactionScreen() {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [amount, setAmount] = useState('');
  const [observation, setObservation] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [date, setDate] = useState(() => toBrazilianDate(todayLocal()));
  const [error, setError] = useState('');

  async function save() {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!description.trim()) {
      setError('Informe uma descrição.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (!isValidBrazilianDate(date)) {
      setError('Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    setError('');
    await addTransaction({
      description: description.trim(),
      category,
      type,
      amount: parsedAmount,
      date: toDatabaseDate(date),
      observation: observation.trim() || null,
      favorite: favorite ? 1 : 0,
    });
    router.replace('/transactions');
  }

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const parsedAmount = Number(amount.replace(',', '.'));
  const canSave =
    description.trim().length > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    isValidBrazilianDate(date);

  function changeType(nextType: TransactionType) {
    setType(nextType);
    setCategory(nextType === 'expense' ? expenseCategories[0] : incomeCategories[0]);
    setError('');
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Nova movimentação</Text>
          <View style={styles.segment}>
            <Pressable onPress={() => changeType('expense')} style={[styles.segmentItem, type === 'expense' && styles.expenseActive]}>
              <Text style={[styles.segmentText, type === 'expense' && styles.activeText]}>Despesa</Text>
            </Pressable>
            <Pressable onPress={() => changeType('income')} style={[styles.segmentItem, type === 'income' && styles.incomeActive]}>
              <Text style={[styles.segmentText, type === 'income' && styles.activeText]}>Receita</Text>
            </Pressable>
          </View>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="R$ 0,00"
            placeholderTextColor="#111827"
            style={styles.amount}
            value={amount}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              onChangeText={(value) => { setDescription(value); setError(''); }}
              placeholder="Ex: Mercado"
              placeholderTextColor="#94A3B8"
              style={styles.fieldInput}
              value={description}
            />
          </View>

          <View style={styles.categoryBlock}>
            <Text style={styles.fieldLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
              {categories.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Data</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="number-pad"
              maxLength={10}
              onChangeText={(value) => { setDate(formatBrazilianDateInput(value)); setError(''); }}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#94A3B8"
              style={styles.fieldInput}
              value={date}
            />
          </View>

          <View style={[styles.field, styles.observationField]}>
            <Text style={styles.fieldLabel}>Observação</Text>
            <TextInput
              onChangeText={setObservation}
              placeholder="Opcional"
              placeholderTextColor="#94A3B8"
              style={styles.fieldInput}
              value={observation}
            />
          </View>
          <View style={styles.favoriteRow}>
            <View style={styles.favoriteIcon}><Text>★</Text></View>
            <View style={styles.favoriteText}>
              <Text style={styles.favoriteTitle}>Favoritar movimentação</Text>
              <Text style={styles.favoriteSubtitle}>Use novamente com rapidez</Text>
            </View>
            <Switch
              onValueChange={setFavorite}
              trackColor={{ false: '#E2E8F0', true: '#99F6E4' }}
              thumbColor={favorite ? '#10B981' : '#FFFFFF'}
              value={favorite}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            disabled={!canSave}
            onPress={save}
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveText}>Salvar movimentação</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="new" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F9FC', flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700' },
  segment: { flexDirection: 'row', marginTop: 16 },
  segmentItem: { borderRadius: 18, marginRight: 8, paddingHorizontal: 16, paddingVertical: 9 },
  expenseActive: { backgroundColor: '#10B981' },
  incomeActive: { backgroundColor: '#10B981' },
  segmentText: { color: '#64748B', fontWeight: '700' },
  activeText: { color: '#FFFFFF' },
  amount: { color: '#111827', fontSize: 34, fontWeight: '700', height: 74, marginTop: 8 },
  field: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, borderWidth: 1, height: 64, justifyContent: 'center', marginTop: 10, paddingHorizontal: 12 },
  fieldLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 3 },
  fieldInput: { color: '#111827', fontSize: 16 },
  categoryBlock: { marginTop: 10 },
  categories: { gap: 8, paddingVertical: 8 },
  categoryChip: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  categoryChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  categoryText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#FFFFFF' },
  observationField: { marginTop: 10 },
  error: { color: '#DC2626', fontSize: 13, marginTop: 12 },
  favoriteRow: { alignItems: 'center', flexDirection: 'row', marginTop: 36 },
  favoriteIcon: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  favoriteText: { flex: 1, marginHorizontal: 10 },
  favoriteTitle: { color: '#111827', fontSize: 14, fontWeight: '700' },
  favoriteSubtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },
  saveButton: { alignItems: 'center', backgroundColor: '#10B981', borderRadius: 14, height: 58, justifyContent: 'center', marginTop: 28 },
  saveButtonDisabled: { backgroundColor: '#CBD5E1', opacity: 0.9 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
