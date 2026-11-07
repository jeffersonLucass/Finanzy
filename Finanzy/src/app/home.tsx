import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import { clearLocalData, getProfileName, getTransactions, Transaction } from '../database';
import { toBrazilianDate } from '../date';

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useFocusEffect(useCallback(() => {
    Promise.all([getProfileName(), getTransactions()]).then(([profileName, rows]) => {
      setName(profileName ?? '');
      setTransactions(rows);
    });
  }, []));

  const income = transactions.filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0);
  const balance = income - expenses;
  const balanceIsNegative = balance < 0;
  
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
