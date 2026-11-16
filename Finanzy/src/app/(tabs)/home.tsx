import { Icon } from '../../components/ui/Icon';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { TransactionRow } from '../../components/TransactionRow';
import { AppScreen } from '../../components/ui/AppScreen';
import { ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useDashboard } from '../../features/dashboard/use-dashboard';
import { Notice } from '../../features/notifications/notification-service';
import { formatCurrency } from '../../presentation/format';
import { useTheme } from '../../theme/ThemeProvider';

export default function HomeScreen() {
  const { theme } = useTheme();
  const query = useDashboard();
  const [notice, setNotice] = useState<Notice | null>(null);
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
  if (query.loading && !dashboard) return <AppScreen><LoadingState /></AppScreen>;
  if (query.error || !dashboard) return <AppScreen><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  return (
    <AppScreen>
      <View style={styles.top}><View style={styles.copy}><Text style={[styles.greeting, { color: theme.colors.text }]}>Olá, {dashboard.profile?.name || 'Usuário'}</Text><Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Veja como estão suas finanças</Text></View></View>
      {notice ? <Pressable accessibilityRole="button" onPress={() => { if (notice.destination.screen === 'budgets') router.push('/budgets'); else router.push(`/occurrences/${notice.destination.id}`); setNotice(null); }}><Card style={[styles.notice, { backgroundColor: theme.colors.warningSoft }]}><Text style={[styles.noticeTitle, { color: theme.colors.warning }]}>{notice.title}</Text><Text style={[styles.noticeBody, { color: theme.colors.textSecondary }]}>{notice.body}</Text></Card></Pressable> : null}
      <Card style={[styles.balanceCard, { backgroundColor: dashboard.availableCents < 0 ? theme.colors.danger : theme.colors.primary }]}>
        <Text style={[styles.balanceLabel, { color: theme.colors.onPrimary }]}>Saldo disponível</Text><Text style={[styles.balance, { color: theme.colors.onPrimary }]}>{formatCurrency(dashboard.availableCents)}</Text><View style={styles.summary}><View><Text style={[styles.balanceLabel, { color: theme.colors.onPrimary }]}>↑ Receitas</Text><Text style={[styles.summaryValue, { color: theme.colors.onPrimary }]}>{formatCurrency(dashboard.monthly.incomeCents)}</Text></View><View><Text style={[styles.balanceLabel, { color: theme.colors.onPrimary }]}>↓ Despesas</Text><Text style={[styles.summaryValue, { color: theme.colors.onPrimary }]}>{formatCurrency(dashboard.monthly.expenseCents)}</Text></View></View>
      </Card>
      <Pressable accessibilityRole="button" onPress={() => router.push('/budgets')} style={styles.budgetCard}>
        <Card style={styles.budgetInner}>
          <View style={styles.between}><Text style={[styles.cardTitle, { color: theme.colors.text }]}>Orçamento de {new Date(`${dashboard.period}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long' })}</Text><Text style={[styles.percent, { color: theme.colors.primaryStrong }]}>{budgetProgress.toFixed(0)}%</Text></View>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{dashboard.budget.items.length ? `${formatCurrency(budgetSpent)} de ${formatCurrency(budgetLimit)}` : 'Defina seus limites mensais'}</Text><Progress value={budgetProgress} />
        </Card>
      </Pressable>
      <Section title="Últimas transações" onPress={() => router.push('/transactions')} />
      {dashboard.latest.length ? dashboard.latest.map(item => <TransactionRow amountCents={item.amountCents} category={item.categoryName} date={item.date} description={item.description} icon={item.categoryIcon} key={item.id} onPress={() => router.push(`/transactions/${item.id}`)} type={item.type} />) : <Card><Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Nenhuma movimentação cadastrada.</Text><Button label="Adicionar movimentação" onPress={() => router.push('/transactions/new')} variant="ghost" /></Card>}
      <Section title="Meta financeira" onPress={() => router.push('/goals')} />
      {goal ? (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/goals/${goal.id}`)}>
          <Card>
            <View style={styles.goal}><View style={styles.goalIcon}><Icon name={goal.icon || 'target'} size={23} /></View><View style={styles.copy}><Text style={[styles.cardTitle, { color: theme.colors.text }]}>{goal.name}</Text><Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{formatCurrency(goal.savedCents)} de {formatCurrency(goal.targetCents)}</Text></View><Text style={[styles.percent, { color: theme.colors.primaryStrong }]}>{goalProgress.toFixed(0)}%</Text></View>
            <Progress value={goalProgress} />
            <Text style={[styles.goalHint, { color: theme.colors.textSecondary }]}>Toque para ver os detalhes ou adicionar dinheiro.</Text>
          </Card>
        </Pressable>
      ) : (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Ainda não há uma meta ativa</Text>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Defina um objetivo e um valor para acompanhar seu progresso.</Text>
          <Button label="+ Criar minha primeira meta" onPress={() => router.push('/goals/new')} variant="ghost" />
        </Card>
      )}
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
  greeting: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  subtitle: { fontSize: 12, marginTop: 4 },
  notice: { marginTop: 14 },
  noticeTitle: { fontSize: 14, fontWeight: '700' },
  noticeBody: { fontSize: 12, marginTop: 4 },
  balanceCard: { borderRadius: 20, marginTop: 24, padding: 18 },
  balanceLabel: { fontSize: 12, opacity: 0.95 },
  balance: { fontSize: 28, fontWeight: '700', marginTop: 8 },
  summary: { flexDirection: 'row', gap: 32, marginTop: 12 },
  summaryValue: { fontSize: 12, marginTop: 3 },
  budgetCard: { marginTop: 12 },
  budgetInner: { padding: 14 },
  section: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  link: { fontSize: 12, fontWeight: '600' },
  emptyText: { fontSize: 13, marginBottom: 8, textAlign: 'center' },
  between: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, marginTop: 10 },
  percent: { fontSize: 13, fontWeight: '700' },
  track: { borderRadius: 5, height: 7, marginTop: 11, overflow: 'hidden' },
  fill: { borderRadius: 5, height: 7 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  goal: { alignItems: 'center', flexDirection: 'row' },
  goalIcon: { fontSize: 23, marginRight: 12 },
  goalHint: { fontSize: 12, marginTop: 10 },
});
