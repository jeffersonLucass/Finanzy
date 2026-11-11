import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SettingsRow } from '../../components/ui/SettingsRow';
import { shiftMonth } from '../../domain/core';
import { useAsyncQuery } from '../../hooks/use-async-query';
import { formatCurrency } from '../../presentation/format';
import { useTheme } from '../../theme/ThemeProvider';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const monthLabel = (value: string) => new Date(`${value}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export function MonthlyComparisonScreen({ initialPeriod = currentMonth() }: { initialPeriod?: string }) {
  const { theme } = useTheme();
  const [period, setPeriod] = useState(initialPeriod);
  const load = useCallback(() => getRuntime().then(runtime => runtime.reports.getMonthlyComparison(period)), [period]);
  const query = useAsyncQuery(load);
  return (
    <AppScreen>
      <AppHeader back title="Comparação mensal" />
      <MonthPicker month={period} onChange={setPeriod} />
      {query.loading && !query.data ? <LoadingState /> : query.error || !query.data ? <ErrorState error={query.error} onRetry={query.reload} /> : <>
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Despesas por mês</Text>
          {query.data.months.map((item, index) => {
            const max = Math.max(...query.data!.months.map(month => month.expenseCents), 1);
            return <View key={item.period} style={styles.barRow}><Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>{monthLabel(item.period).slice(0, 3)}</Text><View style={[styles.track, { backgroundColor: theme.colors.border }]}><View style={[styles.fill, { backgroundColor: index === 2 ? theme.colors.primary : theme.colors.disabled, width: `${item.expenseCents / max * 100}%` }]} /></View><Text style={[styles.barValue, { color: theme.colors.text }]}>{formatCurrency(item.expenseCents)}</Text></View>;
          })}
        </Card>
        <Card style={[styles.callout, { backgroundColor: theme.colors.primarySoft }]}>
          <Text style={[styles.calloutTitle, { color: query.data.changePercent !== null && query.data.changePercent > 0 ? theme.colors.dangerStrong : theme.colors.primaryStrong }]}>{query.data.changePercent === null ? 'Sem base de comparação' : `${query.data.changePercent > 0 ? '↑' : '↓'} Você gastou ${Math.abs(query.data.changePercent).toFixed(0)}% ${query.data.changePercent > 0 ? 'mais' : 'menos'}`}</Text>
          <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>em relação ao mês anterior.</Text>
        </Card>
        <SettingsRow icon={query.data.topCategory?.category.icon ?? 'package'} label="Maior categoria" hint={query.data.topCategory?.category.name ?? 'Nenhuma despesa no período'} value={formatCurrency(query.data.topCategory?.totalCents ?? 0)} />
      </>}
    </AppScreen>
  );
}

export function ForecastScreen() {
  const { theme } = useTheme();
  const [start, setStart] = useState(currentMonth());
  const [months, setMonths] = useState<'1' | '3' | '6' | '12'>('3');
  const [showPeriod, setShowPeriod] = useState(false);
  const load = useCallback(() => getRuntime().then(runtime => runtime.reports.getForecast(start, Number(months))), [months, start]);
  const query = useAsyncQuery(load);
  return (
    <AppScreen>
      <AppHeader back title="Previsão financeira" actionLabel="Período" onAction={() => setShowPeriod(value => !value)} />
      {showPeriod ? <><MonthPicker month={start} onChange={setStart} /><SegmentedControl onChange={setMonths} options={[{ value: '1', label: '1 mês' }, { value: '3', label: '3 meses' }, { value: '6', label: '6 meses' }, { value: '12', label: '12 meses' }]} value={months} /></> : null}
      {query.loading && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} onRetry={query.reload} /> : query.data?.length ? query.data.map(item => <Card key={item.month} style={styles.forecastCard}><Text style={[styles.forecastMonth, { color: theme.colors.text }]}>{new Date(`${item.month}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long' })}</Text><View style={styles.forecastTotals}><View style={styles.forecastTotal}><Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Mensalidades</Text><Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(item.subscriptionsCents)}</Text></View><View style={styles.forecastTotal}><Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Parcelamentos</Text><Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(item.installmentsCents)}</Text></View><View style={styles.forecastTotal}><Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total</Text><Text style={[styles.summaryValue, { color: theme.colors.primaryStrong }]}>{formatCurrency(item.totalCents)}</Text></View></View></Card>) : <EmptyState text="Cadastre assinaturas ou parcelamentos para visualizar os próximos meses." title="Sem previsão" />}
    </AppScreen>
  );
}

export function CalendarScreen() {
  const { theme } = useTheme();
  const [month, setMonth] = useState(currentMonth());
  const [selectedDay, setSelectedDay] = useState(`${currentMonth()}-01`);
  const load = useCallback(async (signal: AbortSignal) => {
    const runtime = await getRuntime();
    const [calendar, holidays] = await Promise.all([runtime.reports.getCalendar(month), runtime.holidays.get(Number(month.slice(0, 4)), signal).catch(() => null)]);
    return { calendar, holidays };
  }, [month]);
  const query = useAsyncQuery(load);
  const days = useMemo(() => {
    const [year, value] = month.split('-').map(Number);
    const count = new Date(year, value, 0).getDate();
    const offset = new Date(year, value - 1, 1).getDay();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)];
  }, [month]);
  const dayTransactions = query.data?.calendar.transactions.filter(item => item.date === selectedDay) ?? [];
  const dayOccurrences = query.data?.calendar.occurrences.filter(item => item.dueDate === selectedDay || item.payment?.date === selectedDay) ?? [];
  const holidays = query.data?.holidays?.items ?? [];
  const changeMonth = (value: string) => { setMonth(value); setSelectedDay(`${value}-01`); };
  return (
    <AppScreen>
      <AppHeader back title="Calendário" actionLabel="Resumo" onAction={() => router.push({ pathname: '/calendar/summary', params: { month } })} />
      <MonthPicker month={month} onChange={changeMonth} />
      {query.loading && !query.data ? <LoadingState /> : query.error || !query.data ? <ErrorState error={query.error} onRetry={query.reload} /> : <>
        <Card>
          <View style={styles.week}>{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={[styles.weekText, { color: theme.colors.textMuted }]}>{day}</Text>)}</View>
          <View style={styles.grid}>{days.map((date, index) => {
            if (!date) return <View key={`empty-${index}`} style={styles.day} />;
            const hasTransaction = query.data!.calendar.transactions.some(item => item.date === date);
            const hasOccurrence = query.data!.calendar.occurrences.some(item => item.dueDate === date);
            const holiday = holidays.some(item => item.date === date);
            const selected = selectedDay === date;
            return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={date} onPress={() => setSelectedDay(date)} style={[styles.day, selected && { backgroundColor: theme.colors.primary }]}><Text style={{ color: selected ? theme.colors.onPrimary : theme.colors.text }}>{Number(date.slice(-2))}</Text><View style={styles.dots}>{hasTransaction ? <View style={[styles.dot, { backgroundColor: theme.colors.primaryStrong }]} /> : null}{hasOccurrence ? <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} /> : null}{holiday ? <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} /> : null}</View></Pressable>;
          })}</View>
        </Card>
        {query.data.holidays?.stale ? <Text style={[styles.notice, { color: theme.colors.warning }]}>Feriados exibidos a partir do cache.</Text> : null}
        <Text style={[styles.sectionTitle, styles.dayTitle, { color: theme.colors.text }]}>Itens de {selectedDay.split('-').reverse().join('/')}</Text>
        {dayTransactions.map(item => <Card key={`t-${item.id}`} style={styles.compact}><Text style={[styles.itemName, { color: theme.colors.text }]}>{item.description}</Text><Text style={{ color: item.type === 'income' ? theme.colors.primaryStrong : theme.colors.danger }}>{formatCurrency(item.amountCents)}</Text></Card>)}
        {dayOccurrences.map(item => <Card key={`o-${item.id ?? `${item.recurringExpenseId}-${item.referenceMonth}`}`} style={styles.compact}><Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text><Text style={{ color: theme.colors.textSecondary }}>{item.status === 'paid' ? 'Pago' : item.status === 'cancelled' ? 'Cancelado' : 'Pendente'}</Text></Card>)}
        {!dayTransactions.length && !dayOccurrences.length ? <EmptyState text="Não há movimentações ou vencimentos nesta data." title="Dia livre" /> : null}
      </>}
    </AppScreen>
  );
}

export function MonthlySummaryScreen({ period }: { period: string }) {
  const [month, setMonth] = useState(period);
  const load = useCallback(() => getRuntime().then(runtime => runtime.reports.getMonthlySummary(month)), [month]);
  const query = useAsyncQuery(load);
  return (
    <AppScreen>
      <AppHeader back title="Resumo do mês" />
      <MonthPicker month={month} onChange={setMonth} />
      {query.loading && !query.data ? <LoadingState /> : query.error || !query.data ? <ErrorState error={query.error} onRetry={query.reload} /> : <>
        <View style={styles.summaryGrid}><Summary label="Receitas" value={formatCurrency(query.data.incomeCents)} /><Summary label="Despesas" value={formatCurrency(query.data.expenseCents)} /><Summary label="Economizado" value={formatCurrency(query.data.savedCents)} /></View>
        <SettingsRow icon="house" label="Maior gasto" hint={query.data.biggestExpense?.description ?? 'Nenhuma despesa'} value={formatCurrency(query.data.biggestExpense?.amountCents ?? 0)} />
        <SettingsRow icon={query.data.topCategory?.category.icon ?? 'package'} label="Maior categoria" hint={query.data.topCategory?.category.name ?? 'Nenhuma'} value={formatCurrency(query.data.topCategory?.totalCents ?? 0)} />
        <SettingsRow icon="menu" label="Transações realizadas" hint={monthLabel(month)} value={String(query.data.transactionCount)} />
        <SettingsRow icon="chart" label="Comprometido próximo mês" hint="Previsão" value={formatCurrency(query.data.nextMonth.totalCents)} />
      </>}
    </AppScreen>
  );
}

function MonthPicker({ month, onChange }: { month: string; onChange: (value: string) => void }) {
  const { theme } = useTheme();
  return <View style={styles.monthRow}><Button compact label="‹" onPress={() => onChange(shiftMonth(month, -1))} variant="ghost" /><Text style={[styles.month, { color: theme.colors.textSecondary }]}>{monthLabel(month)}</Text><Button compact label="›" onPress={() => onChange(shiftMonth(month, 1))} variant="ghost" /></View>;
}

function Summary({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return <Card style={styles.summary}><Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{label}</Text><Text style={[styles.summaryValue, { color: theme.colors.text }]}>{value}</Text></Card>;
}

const styles = StyleSheet.create({
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  month: { fontSize: 12, textTransform: 'capitalize' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  barRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginVertical: 8 },
  barLabel: { fontSize: 11, textTransform: 'capitalize', width: 30 },
  track: { borderRadius: 5, flex: 1, height: 9, overflow: 'hidden' },
  fill: { borderRadius: 5, height: 9 },
  barValue: { fontSize: 11, fontWeight: '600', textAlign: 'right', width: 88 },
  callout: { marginTop: 14 },
  calloutTitle: { fontSize: 15, fontWeight: '700' },
  copy: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  listCard: { marginBottom: 12 },
  between: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  total: { fontSize: 16, fontWeight: '700' },
  week: { flexDirection: 'row' },
  weekText: { fontSize: 11, textAlign: 'center', width: '14.285%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  day: { alignItems: 'center', borderRadius: 12, height: 46, justifyContent: 'center', width: '14.285%' },
  dots: { flexDirection: 'row', gap: 2, height: 5, marginTop: 3 },
  dot: { borderRadius: 2, height: 4, width: 4 },
  notice: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  dayTitle: { marginTop: 20 },
  compact: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { flex: 1, fontSize: 13, fontWeight: '600' },
  summaryGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summary: { minWidth: 0, minHeight: 72, flex: 1, padding: 10 },
  summaryLabel: { fontSize: 11 },
  summaryValue: { fontSize: 15, fontWeight: '700', marginTop: 6 },
  forecastCard: { marginBottom: 10, minHeight: 130, padding: 14 },
  forecastMonth: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  forecastTotals: { flexDirection: 'row', gap: 10, marginTop: 24, paddingHorizontal: 10 },
  forecastTotal: { flex: 1, minWidth: 0 },
});
