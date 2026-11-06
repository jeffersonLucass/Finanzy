import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import { getTransactions, Transaction } from '../database';

type ReportMode = 'monthly' | 'comparison';

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

const categoryColors = ['#10B981', '#60A5FA', '#F59E0B', '#A78BFA', '#F87171', '#14B8A6'];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function monthName(date: Date) {
  const label = date.toLocaleDateString('pt-BR', { month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getExpenseTotal(transactions: Transaction[]) {
  return transactions.reduce(
    (total, transaction) =>
      total + (transaction.type === 'expense' ? transaction.amount : 0),
    0
  );
}

export default function ReportsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [mode, setMode] = useState<ReportMode>('monthly');

  useFocusEffect(useCallback(() => {
    getTransactions().then(setTransactions);
  }, []));

  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.slice(0, 7) === monthKey(selectedMonth)),
    [selectedMonth, transactions]
  );
  const income = monthTransactions.reduce(
    (total, transaction) => total + (transaction.type === 'income' ? transaction.amount : 0),
    0
  );
  const expenses = getExpenseTotal(monthTransactions);
  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    monthTransactions.forEach((transaction) => {
      if (transaction.type === 'expense') {
        totals.set(
          transaction.category,
          (totals.get(transaction.category) ?? 0) + transaction.amount
        );
      }
    });
    return [...totals.entries()].sort((first, second) => second[1] - first[1]);
  }, [monthTransactions]);

  const comparisonMonths = useMemo(
    () => [-2, -1, 0].map((offset) => {
      const date = shiftMonth(selectedMonth, offset);
      const monthTransactions = transactions.filter(
        (transaction) => transaction.date.slice(0, 7) === monthKey(date)
      );
      return {
        date,
        expenses: getExpenseTotal(monthTransactions),
      };
    }),
    [selectedMonth, transactions]
  );
  const previousMonthExpenses = comparisonMonths[1].expenses;
  const currentMonthExpenses = comparisonMonths[2].expenses;
  const changePercent = previousMonthExpenses > 0
    ? Math.round(((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100)
    : null;
  const highestComparisonExpense = Math.max(...comparisonMonths.map((month) => month.expenses));
  const topCategory = categories[0];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {mode === 'monthly' ? 'Relatórios' : 'Comparação mensal'}
              </Text>
              {mode === 'comparison' && (
                <Text style={styles.subtitle}>
                  {`${monthName(comparisonMonths[0].date)} — ${monthLabel(selectedMonth)}`}
                </Text>
              )}
            </View>
            {mode === 'monthly' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setMode('comparison')}
                style={styles.compareButton}
              >
                <Text style={styles.compareButtonText}>Comparação mensal</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setMode('monthly')}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Relatório</Text>
              </Pressable>
            )}
          </View>

          {mode === 'monthly' ? (
            <>
              <View style={styles.monthPicker}>
                <Pressable
                  accessibilityLabel="Mês anterior"
                  accessibilityRole="button"
                  onPress={() => setSelectedMonth((month) => shiftMonth(month, -1))}
                  style={styles.monthArrow}
                >
                  <Text style={styles.monthArrowText}>‹</Text>
                </Pressable>
                <Text style={styles.monthText}>{monthLabel(selectedMonth)}</Text>
                <Pressable
                  accessibilityLabel="Próximo mês"
                  accessibilityRole="button"
                  onPress={() => setSelectedMonth((month) => shiftMonth(month, 1))}
                  style={styles.monthArrow}
                >
                  <Text style={styles.monthArrowText}>›</Text>
                </Pressable>
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Receitas</Text>
                  <Text numberOfLines={1} style={[styles.summaryValue, styles.income]}>
                    {currency(income)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Despesas</Text>
                  <Text numberOfLines={1} style={[styles.summaryValue, styles.expense]}>
                    {currency(expenses)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Saldo</Text>
                  <Text numberOfLines={1} style={[styles.summaryValue, income < expenses && styles.expense]}>
                    {currency(income - expenses)}
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Gastos por categoria</Text>
                <View style={styles.chartArea}>
                  <View style={[styles.donut, expenses === 0 && styles.emptyDonut]}>
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutLabel}>Total</Text>
                      <Text numberOfLines={1} style={styles.donutValue}>{currency(expenses)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {categories.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Sem despesas neste mês</Text>
                  <Text style={styles.emptyText}>
                    Quando você registrar uma despesa, ela aparecerá neste relatório.
                  </Text>
                </View>
              ) : (
                <View style={styles.categoryList}>
                  {categories.map(([category, amount], index) => {
                    const percentage = (amount / expenses) * 100;
                    return (
                      <View key={category} style={styles.categoryRow}>
                        <View style={[styles.categoryIcon, { backgroundColor: `${categoryColors[index % categoryColors.length]}18` }]}>
                          <Text>{categoryIcons[category] ?? '📦'}</Text>
                        </View>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryName}>{category}</Text>
                          <Text style={styles.categoryPercent}>{Math.round(percentage)}%</Text>
                        </View>
                        <Text style={styles.categoryAmount}>{currency(amount)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Despesas por mês</Text>
                <View style={styles.monthBars}>
                  {comparisonMonths.map(({ date, expenses: monthExpenses }, index) => (
                    <View key={monthKey(date)} style={styles.monthBarRow}>
                      <Text style={styles.monthBarLabel}>
                        {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            index === 2 && styles.currentBarFill,
                            {
                              width: highestComparisonExpense > 0
                                ? `${(monthExpenses / highestComparisonExpense) * 100}%`
                                : '0%',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.monthBarAmount}>{currency(monthExpenses)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.comparisonCallout}>
                <Text style={styles.comparisonTitle}>
                  {changePercent === null
                    ? 'Sem dados para comparar'
                    : changePercent < 0
                      ? `↓ Você gastou ${Math.abs(changePercent)}% menos`
                      : changePercent > 0
                        ? `↑ Você gastou ${changePercent}% a mais`
                        : 'Seus gastos ficaram iguais'}
                </Text>
                <Text style={styles.comparisonSubtitle}>
                  em relação ao mês anterior.
                </Text>
              </View>

              {topCategory ? (
                <View style={styles.topCategoryRow}>
                  <View style={styles.categoryIcon}>
                    <Text>{categoryIcons[topCategory[0]] ?? '📦'}</Text>
                  </View>
                  <View style={styles.topCategoryInfo}>
                    <Text style={styles.categoryName}>Maior categoria</Text>
                    <Text style={styles.categoryPercent}>{topCategory[0]}</Text>
                  </View>
                  <Text style={styles.categoryAmount}>{currency(topCategory[1])}</Text>
                </View>
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Sem despesas neste mês</Text>
                  <Text style={styles.emptyText}>
                    Registre despesas para comparar seus gastos por mês.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="reports" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F9FC', flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 4 },
  compareButton: { backgroundColor: '#10B981', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10 },
  compareButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  backButton: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  backButtonText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  monthPicker: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, marginTop: 16 },
  monthArrow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, height: 36, justifyContent: 'center', width: 40 },
  monthArrowText: { color: '#334155', fontSize: 24, lineHeight: 28 },
  monthText: { color: '#334155', fontSize: 14, fontWeight: '600' },
  summary: { flexDirection: 'row', gap: 8 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 14, flex: 1, minWidth: 0, paddingHorizontal: 10, paddingVertical: 13 },
  summaryLabel: { color: '#94A3B8', fontSize: 11 },
  summaryValue: { color: '#111827', fontSize: 14, fontWeight: '700', marginTop: 5 },
  income: { color: '#059669' },
  expense: { color: '#EF4444' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, marginTop: 14, padding: 16 },
  sectionTitle: { color: '#111827', fontSize: 15, fontWeight: '700' },
  chartArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  donut: { alignItems: 'center', borderColor: '#10B981', borderRadius: 72, borderWidth: 18, height: 144, justifyContent: 'center', width: 144 },
  emptyDonut: { borderColor: '#E2E8F0' },
  donutCenter: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 50, height: 98, justifyContent: 'center', width: 98 },
  donutLabel: { color: '#64748B', fontSize: 11 },
  donutValue: { color: '#111827', fontSize: 13, fontWeight: '700', marginTop: 3 },
  categoryList: { gap: 14, paddingBottom: 8, paddingTop: 16 },
  categoryRow: { alignItems: 'center', flexDirection: 'row' },
  categoryIcon: { alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  categoryInfo: { flex: 1, marginLeft: 10 },
  categoryName: { color: '#111827', fontSize: 13, fontWeight: '600' },
  categoryPercent: { color: '#64748B', fontSize: 11, marginTop: 3 },
  categoryAmount: { color: '#111827', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, marginTop: 14, padding: 20 },
  emptyTitle: { color: '#111827', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  monthBars: { gap: 16, marginTop: 18 },
  monthBarRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  monthBarLabel: { color: '#64748B', fontSize: 11, textTransform: 'capitalize', width: 26 },
  barTrack: { backgroundColor: '#E2E8F0', borderRadius: 6, flex: 1, height: 9, overflow: 'hidden' },
  barFill: { backgroundColor: '#CBD5E1', borderRadius: 6, height: 9 },
  currentBarFill: { backgroundColor: '#10B981' },
  monthBarAmount: { color: '#111827', fontSize: 11, fontWeight: '600', textAlign: 'right', width: 88 },
  comparisonCallout: { backgroundColor: '#ECFDF5', borderRadius: 16, marginTop: 14, padding: 16 },
  comparisonTitle: { color: '#047857', fontSize: 15, fontWeight: '700' },
  comparisonSubtitle: { color: '#64748B', fontSize: 12, marginTop: 5 },
  topCategoryRow: { alignItems: 'center', flexDirection: 'row', marginTop: 18 },
  topCategoryInfo: { flex: 1, marginLeft: 10 },
});
