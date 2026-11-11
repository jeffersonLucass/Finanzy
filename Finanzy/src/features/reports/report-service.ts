import { dateOnly, ensure, monthOnly, periodAt, periodRange, shiftMonth, sum } from '../../domain/core';
import { Transaction } from '../../domain/models';
import { FinanceContext, Snapshot, balances, budgetSummary } from '../../application/finance-context';
import { projectOccurrences } from '../recurring/recurring-service';
import { Settings } from '../settings/settings-service';

function monthly(snapshot: Snapshot, period: string, settings: Settings, asOfDate: string) {
  const { start, end } = periodRange(period, settings.monthStartDay);
  const periodRows = snapshot.transactions.filter(t => t.date >= start && t.date < end);
  const transactions = periodRows.filter(t => t.date <= asOfDate);
  const incomeCents = sum(transactions.filter(t => t.type === 'income').map(t => t.amountCents));
  const expenseCents = sum(transactions.filter(t => t.type === 'expense').map(t => t.amountCents));
  const categories = snapshot.categories.map(category => {
    const totalCents = sum(transactions.filter(t => t.type === 'expense' && t.categoryId === category.id).map(t => t.amountCents));
    return { category, totalCents, percent: expenseCents ? totalCents / expenseCents * 100 : 0 };
  }).filter(c => c.totalCents > 0).sort((a,b) => b.totalCents - a.totalCents || a.category.id - b.category.id);
  return { period, start, end, incomeCents, expenseCents, balanceCents: sum([incomeCents, -expenseCents]), transactions, scheduled: periodRows.filter(t => t.date > asOfDate), categories, allCategories: snapshot.categories };
}
function forecast(snapshot: Snapshot, startMonth: string, months: number) {
  monthOnly(startMonth); ensure(Number.isInteger(months) && months >= 1 && months <= 12, 'Informe de 1 a 12 meses.');
  const all = projectOccurrences(snapshot, startMonth, shiftMonth(startMonth, months));
  return Array.from({ length: months }, (_, offset) => {
    const month = shiftMonth(startMonth, offset);
    const items = all.filter(o => o.referenceMonth === month && o.status === 'pending');
    const subscriptionsCents = sum(items.filter(o => snapshot.recurring.find(r => r.id === o.recurringExpenseId)?.kind === 'subscription').map(o => o.amountCents));
    const installmentsCents = sum(items.filter(o => snapshot.recurring.find(r => r.id === o.recurringExpenseId)?.kind === 'installment').map(o => o.amountCents));
    return { month, items, subscriptionsCents, installmentsCents, totalCents: sum([subscriptionsCents, installmentsCents]) };
  });
}
export class ReportsService {
  constructor(private readonly finance: FinanceContext) {}
  async getMonthlyReport(period: string) { const ctx = await this.finance.context(); return monthly(await this.finance.snapshot(), period, ctx.settings, ctx.date); }
  async getMonthlyComparison(period: string) {
    const ctx = await this.finance.context(); const snapshot = await this.finance.snapshot();
    const months = [-2,-1,0].map(offset => monthly(snapshot, shiftMonth(period, offset), ctx.settings, ctx.date));
    const previous = months[1].expenseCents; const current = months[2].expenseCents;
    return { months, changePercent: previous > 0 ? (current - previous) / previous * 100 : null, topCategory: months[2].categories[0] ?? null };
  }
  async getDashboard(asOfDate?: string) {
    const ctx = await this.finance.context(); const date = dateOnly(asOfDate ?? ctx.date); ensure(date <= ctx.date, 'Data de consulta futura.');
    const snapshot = await this.finance.snapshot(); const period = periodAt(date, ctx.settings.monthStartDay);
    return { ...balances(snapshot, date), period, monthly: monthly(snapshot, period, ctx.settings, date), budget: budgetSummary(snapshot, period, ctx.settings, date), latest: snapshot.transactions.filter(t => t.date <= date).sort(sortTransactions).slice(0,4), goal: snapshot.goals.find(g => !g.isArchived) ?? null };
  }
  async getMonthlySummary(period: string) {
    const ctx = await this.finance.context(); const snapshot = await this.finance.snapshot(); const report = monthly(snapshot, period, ctx.settings, ctx.date);
    const biggest = report.transactions.filter(t => t.type === 'expense').sort((a,b) => b.amountCents - a.amountCents || a.id - b.id)[0] ?? null;
    return { ...report, savedCents: report.balanceCents, biggestExpense: biggest, topCategory: report.categories[0] ?? null, transactionCount: report.transactions.length, nextMonth: forecast(snapshot, shiftMonth(period,1), 1)[0] };
  }
  async getForecast(startMonth: string, months = 3) { return forecast(await this.finance.snapshot(), startMonth, months); }
  async getCalendar(month: string) {
    monthOnly(month); const snapshot = await this.finance.snapshot();
    const occurrences = projectOccurrences(snapshot, month, shiftMonth(month,1));
    const transactions = snapshot.transactions.filter(t => t.date.slice(0,7) === month);
    return { month, transactions: transactions.filter(t => t.occurrenceId === null || !occurrences.some(o => o.id === t.occurrenceId)).sort(sortTransactions), occurrences: occurrences.map(o => ({ ...o, payment: snapshot.transactions.find(t => t.occurrenceId === o.id) ?? null })), totalPaidCents: sum(transactions.filter(t => t.type === 'expense').map(t => t.amountCents)) };
  }
  async getDay(date: string) {
    dateOnly(date); const calendar = await this.getCalendar(date.slice(0,7));
    return { date, transactions: calendar.transactions.filter(t => t.date === date), occurrences: calendar.occurrences.filter(o => o.dueDate === date || o.payment?.date === date) };
  }
}
export const sortTransactions = (a: Transaction, b: Transaction) => b.date.localeCompare(a.date) || b.id - a.id;
