import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import {
  Budget,
  deleteBudget,
  getBudgets,
  getTransactions,
  saveBudget,
  Transaction,
} from '../database';

const categories = [
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

const categoryIcons: Record<string, string> = {
  Alimentação: '🍔',
  Moradia: '🏠',
  Transporte: '🚕',
  Saúde: '❤️',
  Educação: '📚',
  Lazer: '🎮',
  Compras: '🛍️',
  Serviços: '🧾',
};

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState(categories[0]);
  const [limit, setLimit] = useState('');
  const [error, setError] = useState('');
  const [loadingError, setLoadingError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [savedBudgets, savedTransactions] = await Promise.all([
        getBudgets(),
        getTransactions(),
      ]);
      setBudgets(savedBudgets);
      setTransactions(savedTransactions);
      setLoadingError('');
    } catch {
      setLoadingError('Não foi possível carregar os orçamentos. Tente novamente.');
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const spendingByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    const month = currentMonthKey();
    transactions.forEach((transaction) => {
      if (transaction.type === 'expense' && transaction.date.slice(0, 7) === month) {
        totals.set(
          transaction.category,
          (totals.get(transaction.category) ?? 0) + transaction.amount
        );
      }
    });
    return totals;
  }, [transactions]);

  const totalLimit = budgets.reduce((total, budget) => total + budget.monthlyLimit, 0);
  const totalSpent = budgets.reduce(
    (total, budget) => total + (spendingByCategory.get(budget.category) ?? 0),
    0
  );
  const parsedLimit = Number(limit.replace(',', '.'));

  function startNewBudget() {
    setShowForm(true);
    setEditingBudget(null);
    setCategory(categories.find((item) => !budgets.some((budget) => budget.category === item)) ?? categories[0]);
    setLimit('');
    setError('');
  }

  function startEditingBudget(budget: Budget) {
    setShowForm(true);
    setEditingBudget(budget);
    setCategory(budget.category);
    setLimit(String(budget.monthlyLimit));
    setError('');
  }

  async function submitBudget() {
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      setError('Informe um limite mensal maior que zero.');
      return;
    }
    if (budgets.some((budget) =>
      budget.category === category && budget.id !== editingBudget?.id
    )) {
      setError('Já existe um orçamento para esta categoria.');
      return;
    }
    try {
      await saveBudget(editingBudget?.id ?? null, category, parsedLimit);
      setShowForm(false);
      setEditingBudget(null);
      setError('');
      await loadData();
    } catch {
      setError('Não foi possível salvar o orçamento. Tente novamente.');
    }
  }

  async function removeBudget(id: number) {
    try {
      await deleteBudget(id);
      await loadData();
    } catch {
      setError('Não foi possível excluir o orçamento. Tente novamente.');
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Voltar para o menu Mais"
            accessibilityRole="button"
            onPress={() => router.replace('/more')}
            style={styles.backToMore}
          >
            <Text style={styles.backToMoreText}>‹</Text>
          </Pressable>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {showForm ? (editingBudget ? 'Editar orçamento' : 'Novo orçamento') : 'Orçamentos'}
              </Text>
              <Text style={styles.subtitle}>Acompanhe seus limites mensais</Text>
            </View>
            {!showForm && (
              <Pressable accessibilityRole="button" onPress={startNewBudget} style={styles.actionButton}>
                <Text style={styles.actionText}>+ Novo</Text>
              </Pressable>
            )}
          </View>

          {loadingError ? <Text style={styles.error}>{loadingError}</Text> : null}

          {showForm ? (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Categoria</Text>
              <View style={styles.categoryList}>
                {categories.map((item) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === item }}
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
                      {categoryIcons[item] ?? '📦'} {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Limite mensal</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={(value) => { setLimit(value); setError(''); }}
                placeholder="R$ 0,00"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={limit}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.formActions}>
                <Pressable accessibilityRole="button" onPress={() => setShowForm(false)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Cancelar</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={submitBudget} style={styles.saveButton}>
                  <Text style={styles.saveText}>Salvar orçamento</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Limite total neste mês</Text>
                <Text style={styles.summaryAmount}>{currency(totalLimit)}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryDetail}>Gasto {currency(totalSpent)}</Text>
                  <Text style={styles.summaryDetail}>Disponível {currency(totalLimit - totalSpent)}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Por categoria</Text>
              {budgets.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>💰</Text>
                  <Text style={styles.emptyTitle}>Nenhum orçamento ainda</Text>
                  <Text style={styles.emptyText}>Defina limites mensais para acompanhar seus gastos.</Text>
                  <Pressable accessibilityRole="button" onPress={startNewBudget} style={styles.saveButton}>
                    <Text style={styles.saveText}>Criar orçamento</Text>
                  </Pressable>
                </View>
              ) : (
                budgets.map((budget) => {
                  const spent = spendingByCategory.get(budget.category) ?? 0;
                  const progress = budget.monthlyLimit > 0
                    ? Math.min((spent / budget.monthlyLimit) * 100, 100)
                    : 0;
                  const exceeded = spent > budget.monthlyLimit;
                  return (
                    <View key={budget.id} style={styles.budgetCard}>
                      <View style={styles.budgetHeader}>
                        <View style={styles.categoryIcon}>
                          <Text>{categoryIcons[budget.category] ?? '📦'}</Text>
                        </View>
                        <View style={styles.budgetInfo}>
                          <Text style={styles.categoryName}>{budget.category}</Text>
                          <Text style={styles.spendingText}>
                            {currency(spent)} / {currency(budget.monthlyLimit)}
                          </Text>
                        </View>
                        <Text style={[styles.percentage, exceeded && styles.overLimit]}>
                          {Math.round((spent / budget.monthlyLimit) * 100)}%
                        </Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[
                          styles.progressFill,
                          { width: `${progress}%` },
                          exceeded && styles.progressExceeded,
                        ]} />
                      </View>
                      {exceeded ? (
                        <Text style={styles.overLimitMessage}>
                          Você ultrapassou o limite em {currency(spent - budget.monthlyLimit)}.
                        </Text>
                      ) : null}
                      <View style={styles.cardActions}>
                        <Pressable accessibilityRole="button" onPress={() => startEditingBudget(budget)}>
                          <Text style={styles.link}>Editar</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={() => removeBudget(budget.id)}>
                          <Text style={styles.deleteLink}>Excluir</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F9FC', flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  backToMore: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#ECFDF5', borderRadius: 20, height: 40, justifyContent: 'center', marginBottom: 8, width: 40 },
  backToMoreText: { color: '#059669', fontSize: 27, fontWeight: '500', lineHeight: 30, marginTop: -2 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, marginTop: 8 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 4 },
  actionButton: { backgroundColor: '#10B981', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 10 },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 22, padding: 18 },
  summaryLabel: { color: '#64748B', fontSize: 13 },
  summaryAmount: { color: '#111827', fontSize: 27, fontWeight: '700', marginTop: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  summaryDetail: { color: '#64748B', fontSize: 12 },
  sectionTitle: { color: '#111827', fontSize: 17, fontWeight: '700', marginBottom: 12 },
  budgetCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, padding: 15 },
  budgetHeader: { alignItems: 'center', flexDirection: 'row' },
  categoryIcon: { alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  budgetInfo: { flex: 1, marginLeft: 11 },
  categoryName: { color: '#111827', fontSize: 14, fontWeight: '700' },
  spendingText: { color: '#64748B', fontSize: 12, marginTop: 3 },
  percentage: { color: '#059669', fontSize: 13, fontWeight: '700' },
  overLimit: { color: '#EF4444' },
  progressTrack: { backgroundColor: '#E2E8F0', borderRadius: 5, height: 7, marginTop: 13, overflow: 'hidden' },
  progressFill: { backgroundColor: '#10B981', borderRadius: 5, height: 7 },
  progressExceeded: { backgroundColor: '#EF4444' },
  overLimitMessage: { color: '#DC2626', fontSize: 12, marginTop: 8 },
  cardActions: { flexDirection: 'row', gap: 18, marginTop: 12 },
  link: { color: '#059669', fontSize: 12, fontWeight: '700' },
  deleteLink: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16 },
  categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  categoryChip: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 18, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
  categoryChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  categoryText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#FFFFFF' },
  fieldLabel: { color: '#64748B', fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 13, borderWidth: 1, color: '#111827', height: 52, paddingHorizontal: 13 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  secondaryButton: { alignItems: 'center', borderColor: '#E2E8F0', borderRadius: 13, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 50 },
  secondaryText: { color: '#64748B', fontWeight: '700' },
  saveButton: { alignItems: 'center', backgroundColor: '#10B981', borderRadius: 13, flex: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 12 },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, marginTop: 2, padding: 22 },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { color: '#111827', fontSize: 16, fontWeight: '700', marginTop: 9 },
  emptyText: { color: '#64748B', fontSize: 13, lineHeight: 19, marginBottom: 16, marginTop: 6, textAlign: 'center' },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 12, marginTop: 8 },
});
