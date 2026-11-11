import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { AppScreen } from '../components/ui/AppScreen';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { shiftMonth } from '../domain/core';
import { useReport } from '../features/reports/use-report';
import { formatCurrency } from '../presentation/format';
import { useTheme } from '../theme/ThemeProvider';

const monthLabel = (value: string) => new Date(`${value}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export default function ReportsScreen() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const query = useReport(period);
  const report = query.data?.monthly;
  return (
    <AppScreen footer={<BottomNav active="reports" />}>
      <View style={styles.header}><View style={styles.copy}><Text style={[styles.title, { color: theme.colors.text }]}>Relatórios</Text><Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Entenda para onde seu dinheiro vai</Text></View><Button label="Comparar" onPress={() => router.push({ pathname: '/reports/comparison', params: { period } })} /></View>
      <View style={styles.month}><Button label="‹" onPress={() => setPeriod(value => shiftMonth(value, -1))} variant="secondary" /><Text style={[styles.monthText, { color: theme.colors.text }]}>{monthLabel(period)}</Text><Button label="›" onPress={() => setPeriod(value => shiftMonth(value, 1))} variant="secondary" /></View>
      {query.loading && !report ? <LoadingState /> : query.error || !report ? <ErrorState error={query.error} onRetry={query.reload} /> : <>
        <View style={styles.summary}><Summary label="Receitas" value={formatCurrency(report.incomeCents)} tone="income" /><Summary label="Despesas" value={formatCurrency(report.expenseCents)} tone="expense" /><Summary label="Saldo" value={formatCurrency(report.balanceCents)} tone="neutral" /></View>
        <Card style={styles.card}><Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Despesas por categoria</Text>{report.categories.length ? report.categories.map(item => <View key={item.category.id} style={styles.category}><View style={[styles.categoryIcon, { backgroundColor: theme.colors.primarySoft }]}><Text>{item.category.icon}</Text></View><View style={styles.copy}><Text style={[styles.categoryName, { color: theme.colors.text }]}>{item.category.name}</Text><View style={[styles.track, { backgroundColor: theme.colors.border }]}><View style={[styles.fill, { backgroundColor: item.category.color, width: `${item.percent}%` }]} /></View><Text style={[styles.percent, { color: theme.colors.textSecondary }]}>{item.percent.toFixed(1)}%</Text></View><Text style={[styles.categoryValue, { color: theme.colors.text }]}>{formatCurrency(item.totalCents)}</Text></View>) : <EmptyState text="Registre despesas neste mês para visualizar a distribuição." title="Sem despesas" />}</Card>
      </>}
    </AppScreen>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: 'income' | 'expense' | 'neutral' }) {
  const { theme } = useTheme();
  const color = tone === 'income' ? theme.colors.primaryStrong : tone === 'expense' ? theme.colors.danger : theme.colors.text;
  return <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{label}</Text><Text style={[styles.summaryValue, { color }]}>{value}</Text></Card>;
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 8 },
  copy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  month: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 18 },
  monthText: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  summary: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, minWidth: 0, paddingHorizontal: 9, paddingVertical: 13 },
  summaryLabel: { fontSize: 11 },
  summaryValue: { fontSize: 13, fontWeight: '700', marginTop: 5 },
  card: { marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  category: { alignItems: 'center', flexDirection: 'row', marginVertical: 8 },
  categoryIcon: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  categoryName: { fontSize: 13, fontWeight: '600' },
  track: { borderRadius: 4, height: 6, marginTop: 6, overflow: 'hidden' },
  fill: { borderRadius: 4, height: 6 },
  percent: { fontSize: 10, marginTop: 3 },
  categoryValue: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
});
