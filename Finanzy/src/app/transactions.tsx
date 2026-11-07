import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import { getTransactions, Transaction } from '../database';
import { toBrazilianDate } from '../date';

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useFocusEffect(useCallback(() => {
    getTransactions().then(setTransactions);
  }, []));

  const visible = transactions.filter((item) =>
    `${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase())
  ).filter((item) => filter === 'all' || item.type === filter);

  const balance = transactions.reduce(
    (total, item) => total + (item.type === 'income' ? item.amount : -item.amount),
    0
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Transações</Text>
            <Text style={styles.subtitle}>Saldo atual · {currency(balance)}</Text>
          </View>
          <Pressable style={styles.newButton} onPress={() => router.push('/new-transaction')}>
            <Text style={styles.newButtonText}>+ Nova</Text>
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            onChangeText={setSearch}
            placeholder="Pesquisar transação"
            placeholderTextColor="#94A3B8"
            style={styles.search}
            value={search}
          />
        </View>
        <View style={styles.filters}>
          <Pressable onPress={() => setFilter('all')}>
            <Text style={[styles.filter, filter === 'all' && styles.activeFilter]}>Todas</Text>
          </Pressable>
          <Pressable onPress={() => setFilter('income')}>
            <Text style={[styles.filter, filter === 'income' && styles.activeFilter]}>Receitas</Text>
          </Pressable>
          <Pressable onPress={() => setFilter('expense')}>
            <Text style={[styles.filter, filter === 'expense' && styles.activeFilter]}>Despesas</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.day}>Todas</Text>
          {visible.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhuma movimentação encontrada</Text>
            </View>
          )}
          {visible.map((item) => (
            <View key={item.id} style={styles.transaction}>
              <View style={styles.icon}>
                <Text>{item.category === 'Salário' ? '💰' : item.category === 'Transporte' ? '🚕' : item.category === 'Alimentação' ? '🍔' : '🎮'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.description}</Text>
                <Text style={styles.category}>
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
      <BottomNav active="transactions" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F9FC', flex: 1 },
  safe: { flex: 1, paddingHorizontal: 20 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 4 },
  newButton: { backgroundColor: '#10B981', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  newButtonText: { color: '#FFFFFF', fontWeight: '700' },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 58,
    marginTop: 18,
    paddingHorizontal: 12,
  },
  searchIcon: { color: '#64748B', fontSize: 24, marginRight: 8 },
  search: { color: '#111827', flex: 1, fontSize: 16 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 16 },
  filter: { backgroundColor: '#FFFFFF', borderRadius: 18, color: '#111827', fontSize: 13, fontWeight: '600', paddingHorizontal: 14, paddingVertical: 9 },
  activeFilter: { backgroundColor: '#10B981', color: '#FFFFFF' },
  list: { paddingBottom: 25 },
  day: { color: '#111827', fontSize: 17, fontWeight: '700', marginTop: 18 },
  transaction: { alignItems: 'center', flexDirection: 'row', marginTop: 14 },
  icon: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, height: 42, justifyContent: 'center', width: 42 },
  info: { flex: 1, marginHorizontal: 12 },
  name: { color: '#111827', fontSize: 15, fontWeight: '700' },
  category: { color: '#64748B', fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700' },
  income: { color: '#059669' },
  expense: { color: '#EF4444' },
  empty: { alignItems: 'center', borderColor: '#E2E8F0', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1, marginTop: 12, padding: 20 },
  emptyText: { color: '#64748B' },
});
