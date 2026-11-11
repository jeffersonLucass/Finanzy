import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../application/runtime';
import { BottomNav } from '../components/BottomNav';
import { TransactionRow } from '../components/TransactionRow';
import { AppScreen } from '../components/ui/AppScreen';
import { ErrorState, LoadingState } from '../components/ui/AsyncState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useDashboard } from '../features/dashboard/use-dashboard';
import { Notice } from '../features/notifications/notification-service';
import { useAsyncAction } from '../hooks/use-async-action';
import { formatCurrency } from '../presentation/format';
import { useTheme } from '../theme/ThemeProvider';

export default function HomeScreen() {
  const { theme } = useTheme();
  const query = useDashboard();
  const [notice, setNotice] = useState<Notice | null>(null);
  const signOut = useCallback(() => getRuntime().then(runtime => runtime.session.signOut()), []);
  const logout = useAsyncAction(signOut, () => router.replace('/onboarding'));
  useEffect(() => {
    let unsubscribe: () => void = () => undefined;
    void getRuntime().then(runtime => { unsubscribe = runtime.notifications.subscribeFeedback(setNotice); });
    return () => unsubscribe();
  }, []);
  const dashboard = query.data;
  const budgetLimit = dashboard?.budget.limitCents ?? 0;
  const budgetSpent = dashboard?.budget.spentCents ?? 0;
  const budgetProgress = budgetLimit ? Math.min(budgetSpent / budgetLimit * 100, 100) : 0;
  const goal = dashboard?.goal;
  const goalProgress = goal ? Math.min(goal.savedCents / goal.targetCents * 100, 100) : 0;
  if (query.loading && !dashboard) return <AppScreen footer={<BottomNav active="home" />}><LoadingState /></AppScreen>;
  if (query.error || !dashboard) return <AppScreen footer={<BottomNav active="home" />}><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  return (
    <AppScreen footer={<BottomNav active="home" />}>
      <View style={styles.top}><View style={styles.copy}><Text style={[styles.greeting, { color: theme.colors.text }]}>Olá, {dashboard.profile?.name || 'Usuário'}</Text><Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Veja como estão suas finanças</Text></View><Button label="Sair" loading={logout.loading} onPress={() => void logout.execute().catch(() => undefined)} variant="secondary" /></View>
      {notice ? <Pressable accessibilityRole="button" onPress={() => { if (notice.destination.screen === 'budgets') router.push('/budgets'); else router.push(`/occurrences/${notice.destination.id}`); setNotice(null); }}><Card style={[styles.notice, { backgroundColor: theme.colors.warningSoft }]}><Text style={[styles.noticeTitle, { color: theme.colors.warning }]}>{notice.title}</Text><Text style={[styles.noticeBody, { color: theme.colors.textSecondary }]}>{notice.body}</Text></Card></Pressable> : null}
      <Card style={[styles.balanceCard, { backgroundColor: dashboard.availableCents < 0 ? theme.colors.danger : theme.colors.primary }]}>
        <Text style={[styles.balanceLabel, { color: theme.colors.onPrimary }]}>Saldo disponível</Text><Text style={[styles.balance, { color: theme.colors.onPrimary }]}>{formatCurrency(dashboard.availableCents)}</Text><View style={styles.summary}><View><Text style={[styles.balanceLabel, { color: theme.colors.onPrimary }]}>↑ Receitas</Text><Text style={[styles.summaryValue, { color: theme.colors.onPrimary }]}>{formatCurrency(dashboard.monthly.incomeCents)}</Text></View><View><Text style={[styles.balanceLabel, { color: theme.colors.onPrimary }]}>↓ Despesas</Text><Text style={[styles.summaryValue, { color: theme.colors.onPrimary }]}>{formatCurrency(dashboard.monthly.expenseCents)}</Text></View></View>
      </Card>
      <Section title="Últimas transações" onPress={() => router.push('/transactions')} />
      {dashboard.latest.length ? dashboard.latest.map(item => <TransactionRow amountCents={item.amountCents} category={item.categoryName} date={item.date} description={item.description} icon={item.categoryIcon} key={item.id} onPress={() => router.push(`/transactions/${item.id}`)} type={item.type} />) : <Card><Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Nenhuma movimentação cadastrada.</Text><Button label="Adicionar movimentação" onPress={() => router.push('/transactions/new')} variant="ghost" /></Card>}
      <Section title="Orçamento do mês" onPress={() => router.push('/budgets')} />
      <Pressable accessibilityRole="button" onPress={() => router.push('/budgets')}><Card>{dashboard.budget.items.length ? <><View style={styles.between}><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{formatCurrency(budgetSpent)} de {formatCurrency(budgetLimit)}</Text><Text style={[styles.percent, { color: theme.colors.primaryStrong }]}>{budgetProgress.toFixed(0)}%</Text></View><Progress value={budgetProgress} /></> : <><Text style={[styles.cardTitle, { color: theme.colors.text }]}>Defina seus limites mensais</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Crie um orçamento por categoria.</Text></>}</Card></Pressable>
      <Section title="Meta financeira" onPress={() => router.push('/goals')} />
      <Pressable accessibilityRole="button" onPress={() => router.push(goal ? `/goals/${goal.id}` : '/goals/new')}><Card>{goal ? <><View style={styles.goal}><Text style={styles.goalIcon}>{goal.icon || '🎯'}</Text><View style={styles.copy}><Text style={[styles.cardTitle, { color: theme.colors.text }]}>{goal.name}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{formatCurrency(goal.savedCents)} de {formatCurrency(goal.targetCents)}</Text></View><Text style={[styles.percent, { color: theme.colors.primaryStrong }]}>{goalProgress.toFixed(0)}%</Text></View><Progress value={goalProgress} /></> : <><Text style={[styles.cardTitle, { color: theme.colors.text }]}>Comece uma nova meta</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Guarde dinheiro aos poucos para seus objetivos.</Text></>}</Card></Pressable>
    </AppScreen>
  );
}

function Section({ title, onPress }: { title: string; onPress: () => void }) {
  const { theme } = useTheme();
  return <View style={styles.section}><Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text><Text accessibilityRole="button" onPress={onPress} style={[styles.link, { color: theme.colors.primaryStrong }]}>Ver todos</Text></View>;
}

function Progress({ value }: { value: number }) {
  const { theme } = useTheme();
  return <View style={[styles.track, { backgroundColor: theme.colors.border }]}><View style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${Math.min(value, 100)}%` }]} /></View>;
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  copy: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  notice: { marginTop: 14 },
  noticeTitle: { fontSize: 14, fontWeight: '700' },
  noticeBody: { fontSize: 12, marginTop: 4 },
  balanceCard: { borderRadius: 20, marginTop: 18, padding: 18 },
  balanceLabel: { fontSize: 13, opacity: 0.85 },
  balance: { fontSize: 31, fontWeight: '700', marginTop: 8 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  summaryValue: { fontSize: 13, marginTop: 3 },
  section: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, marginTop: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  link: { fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 13, marginBottom: 8, textAlign: 'center' },
  between: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, marginTop: 4 },
  percent: { fontSize: 13, fontWeight: '700' },
  track: { borderRadius: 5, height: 7, marginTop: 11, overflow: 'hidden' },
  fill: { borderRadius: 5, height: 7 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  goal: { alignItems: 'center', flexDirection: 'row' },
  goalIcon: { fontSize: 23, marginRight: 12 },
});
