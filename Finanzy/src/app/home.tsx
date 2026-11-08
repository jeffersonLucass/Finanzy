import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import {
  Budget,
  clearLocalData,
  getBudgets,
  getGoals,
  getProfileName,
  getTransactions,
  Goal,
  Transaction,
} from '../database';
import { toBrazilianDate } from '../date';

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useFocusEffect(useCallback(() => {
    Promise.all([
      getProfileName(),
      getTransactions(),
      getBudgets(),
      getGoals(),
    ]).then(([profileName, rows, savedBudgets, savedGoals]) => {
      setName(profileName ?? '');
      setTransactions(rows);
      setBudgets(savedBudgets);
      setGoals(savedGoals);
    });
  }, []));

  const income = transactions.filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0);
  const balance = income - expenses;
  const balanceIsNegative = balance < 0;

  const monthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();
  const currentMonthExpenses = transactions.filter((item) =>
    item.type === 'expense' && item.date.slice(0, 7) === monthKey
  );
  const budgetLimit = budgets.reduce((total, item) => total + item.monthlyLimit, 0);
  const budgetSpent = budgets.reduce((total, budget) => {
    const spent = currentMonthExpenses
      .filter((item) => item.category === budget.category)
      .reduce((sum, item) => sum + item.amount, 0);
    return total + spent;
  }, 0);
  const budgetProgress = budgetLimit > 0
    ? Math.min(Math.round((budgetSpent / budgetLimit) * 100), 100)
    : 0;
  const featuredGoal = goals[0] ?? null;
  const goalProgress = featuredGoal
    ? Math.min(Math.round((featuredGoal.savedAmount / featuredGoal.targetAmount) * 100), 100)
    : 0;
  
  async function logout() {
    await clearLocalData();
    router.replace('/onboarding');
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>Olá, {name || 'Usuário'}</Text>
              <Text style={styles.subtitle}>Veja como estão suas finanças</Text>
            </View>
            <Pressable onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
          </View>

          <View style={[styles.balanceCard,balanceIsNegative && { backgroundColor: '#EF4444' }]}>
            <Text style={styles.balanceLabel}>Saldo disponível</Text>
            <Text style={styles.balance}>{currency(balance)}</Text>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>↑ Receitas</Text>
                <Text style={styles.summaryValue}>{currency(income)}</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>↓ Despesas</Text>
                <Text style={styles.summaryValue}>{currency(expenses)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimas transações</Text>
            <Pressable onPress={() => router.push('/transactions')}>
              <Text style={styles.link}>Ver todas</Text>
            </Pressable>
          </View>

          {transactions.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhuma movimentação cadastrada</Text>
              <Pressable onPress={() => router.push('/new-transaction')}>
                <Text style={styles.link}>Adicionar primeira movimentação</Text>
              </Pressable>
            </View>
          )}

          {transactions.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.transaction}>
              <View style={styles.icon}><Text>{item.category === 'Salário' ? '💰' : item.category === 'Transporte' ? '🚕' : item.category === 'Alimentação' ? '🍔' : '🎮'}</Text></View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{item.description}</Text>
                <Text style={styles.transactionCategory}>
                  {item.category} · {toBrazilianDate(item.date)}
                </Text>
              </View>
              <Text style={[styles.amount, item.type === 'income' ? styles.income : styles.expense]}>
                {item.type === 'income' ? '+ ' : '- '}{currency(item.amount)}
              </Text>
            </View>
          ))}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Orçamento do mês</Text>
            <Pressable onPress={() => router.push('/budgets')}>
              <Text style={styles.link}>Ver todos</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/budgets')}
            style={styles.featureCard}
          >
            {budgets.length === 0 ? (
              <View style={styles.emptyFeature}>
                <Text style={styles.featureTitle}>Defina seus limites mensais</Text>
                <Text style={styles.featureEmptyText}>Crie um orçamento por categoria</Text>
              </View>
            ) : (
              <>
                <View style={styles.featureRow}>
                  <Text style={styles.featureLabel}>{currency(budgetSpent)} de {currency(budgetLimit)}</Text>
                  <Text style={styles.featurePercentage}>{budgetProgress}%</Text>
                </View>
                <View style={styles.progress}>
                  <View style={[styles.progressFill, { width: `${budgetProgress}%` }]} />
                </View>
              </>
            )}
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meta financeira</Text>
            <Pressable onPress={() => router.push('/goals')}>
              <Text style={styles.link}>Ver todas</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/goals')}
            style={styles.featureCard}
          >
            {featuredGoal ? (
              <>
                <View style={styles.goalRow}>
                  <View style={styles.goalIconWrap}>
                    <Text style={styles.goalIcon}>{featuredGoal.icon || '🎯'}</Text>
                  </View>
                  <View style={styles.goalText}>
                    <Text style={styles.featureTitle}>{featuredGoal.name}</Text>
                    <Text style={styles.featureEmptyText}>
                      {currency(featuredGoal.savedAmount)} de {currency(featuredGoal.targetAmount)}
                    </Text>
                  </View>
                  <Text style={styles.featurePercentage}>{goalProgress}%</Text>
                </View>
                <View style={styles.progress}>
                  <View style={[styles.progressFill, { width: `${goalProgress}%` }]} />
                </View>
              </>
            ) : (
              <View style={styles.emptyFeature}>
                <Text style={styles.featureTitle}>Comece uma nova meta</Text>
                <Text style={styles.featureEmptyText}>Guarde dinheiro aos poucos para seus objetivos</Text>
              </View>
            )}
          </Pressable>

        </ScrollView>
      </SafeAreaView>
      <BottomNav active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F9FC', flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  topRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  greeting: { color: '#111827', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 4 },
  logoutButton: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  balanceCard: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    marginTop: 18,
    padding: 18,
  },
  balanceLabel: { color: '#D1FAE5', fontSize: 13 },
  balance: { color: '#FFFFFF', fontSize: 31, fontWeight: '700', marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  summaryLabel: { color: '#D1FAE5', fontSize: 12 },
  summaryValue: { color: '#FFFFFF', fontSize: 13, marginTop: 2 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  sectionTitle: { color: '#111827', fontSize: 18, fontWeight: '700' },
  percentage: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  budget: { color: '#64748B', fontSize: 13, marginTop: 6 },
  progress: { backgroundColor: '#DBEAFE', borderRadius: 5, height: 7, marginTop: 9 },
  progressFill: { backgroundColor: '#10B981', borderRadius: 5, height: 7, width: '76%' },
  featureCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 12, padding: 16 },
  featureRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  featureLabel: { color: '#64748B', fontSize: 12 },
  featurePercentage: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  featureTitle: { color: '#111827', fontSize: 15, fontWeight: '700' },
  featureEmptyText: { color: '#64748B', fontSize: 12, marginTop: 4 },
  emptyFeature: { paddingVertical: 4 },
  goalRow: { alignItems: 'center', flexDirection: 'row' },
  goalIconWrap: { alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  goalIcon: { fontSize: 20 },
  goalText: { flex: 1, marginHorizontal: 12 },
  link: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  transaction: { alignItems: 'center', flexDirection: 'row', marginTop: 16 },
  icon: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, height: 42, justifyContent: 'center', width: 42 },
  transactionInfo: { flex: 1, marginHorizontal: 12 },
  transactionName: { color: '#111827', fontSize: 15, fontWeight: '700' },
  transactionCategory: { color: '#64748B', fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700' },
  income: { color: '#059669' },
  expense: { color: '#EF4444' },
  empty: { alignItems: 'center', borderColor: '#E2E8F0', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1, marginTop: 12, padding: 20 },
  emptyText: { color: '#64748B', marginBottom: 8 },
});
