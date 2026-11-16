import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DonutChart } from '../components/ui/DonutChart';
import { shiftMonth } from '../domain/core';
import { useReport } from '../features/reports/use-report';
import { formatCurrency } from '../presentation/format';
import { useTheme } from '../theme/ThemeProvider';
import { categoryChartColor } from '../theme/tokens';

const monthLabel = (value: string) => new Date(`${value}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export default function ReportsScreen() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const query = useReport(period);
  const report = query.data?.monthly;
  const chartCategories = report?.categories.map(item => ({ id: item.category.id, name: item.category.name, amountCents: item.totalCents, color: categoryChartColor(item.category.id, theme.dark) })) ?? [];
  return (
    <AppScreen>
      <View style={styles.header}><View style={styles.copy}><Text style={[styles.title, { color: theme.colors.text }]}>Relatórios</Text><View style={styles.month}><Pressable accessibilityLabel="Mês anterior" accessibilityRole="button" hitSlop={8} onPress={() => setPeriod(value => shiftMonth(value, -1))}><Text style={{ color: theme.colors.textSecondary }}>‹</Text></Pressable><Text style={[styles.monthText, { color: theme.colors.textSecondary }]}>{monthLabel(period)}</Text><Pressable accessibilityLabel="Próximo mês" accessibilityRole="button" hitSlop={8} onPress={() => setPeriod(value => shiftMonth(value, 1))}><Text style={{ color: theme.colors.textSecondary }}>›</Text></Pressable></View></View><Button compact label="Comparação mensal" onPress={() => router.push({ pathname: '/reports/comparison', params: { period } })} /></View>
      {query.loading && !report ? <LoadingState /> : query.error || !report ? <ErrorState error={query.error} onRetry={query.reload} /> : <>
        <View style={styles.summary}><Summary label="Receitas" value={formatCurrency(report.incomeCents)} tone="income" /><Summary label="Despesas" value={formatCurrency(report.expenseCents)} tone="expense" /><Summary label="Saldo" value={formatCurrency(report.balanceCents)} tone="neutral" /></View>
        <Card style={styles.card}><Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Gastos por categoria</Text><DonutChart categories={chartCategories} totalCents={report.expenseCents} /></Card>
        {!report.categories.length ? <EmptyState text="Registre despesas neste mês para visualizar a distribuição." title="Sem despesas" /> : null}
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
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, marginBottom: 24 },
  copy: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  month: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  monthText: { fontSize: 11, textTransform: 'capitalize' },
  summary: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, minWidth: 0, minHeight: 72, paddingHorizontal: 10, paddingVertical: 12 },
  summaryLabel: { fontSize: 11 },
  summaryValue: { fontSize: 14, fontWeight: '700', marginTop: 5 },
  card: { marginTop: 10, padding: 14, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
});
