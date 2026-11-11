import { Clock, addDays, dateOnly, ensure, monthOnly, periodAt, periodRange, shiftMonth, sum, today } from '../domain/core';
import { TransactionType } from '../domain/models';
import { FinanceRepository, FinanceStore } from '../infrastructure/storage/repositories/finance-repository';
import { Settings, SettingsService } from '../features/settings/settings-service';

export async function loadSnapshot(repo: FinanceRepository) {
  const [transactions, categories, budgets, goals, movements, recurring, occurrences] = await Promise.all([
    repo.list('transactions'), repo.list('categories'), repo.list('budgets'), repo.list('goals'), repo.list('goal_movements'), repo.list('recurring_expenses'), repo.list('expense_occurrences'),
  ]);
  return { transactions, categories, budgets, goals: goals.map(goal => ({ ...goal, savedCents: sum(movements.filter(movement => movement.goalId === goal.id).map(movement => movement.kind === 'withdrawal' ? -movement.amountCents : movement.amountCents)) })), movements, recurring, occurrences };
}

export type Snapshot = Awaited<ReturnType<typeof loadSnapshot>>;

export function balances(snapshot: Snapshot, asOfDate: string) {
  const rows = snapshot.transactions.filter(transaction => transaction.date <= asOfDate);
  const incomeCents = sum(rows.filter(transaction => transaction.type === 'income').map(transaction => transaction.amountCents));
  const expenseCents = sum(rows.filter(transaction => transaction.type === 'expense').map(transaction => transaction.amountCents));
  const reservedCents = sum(snapshot.movements.filter(movement => movement.date <= asOfDate && snapshot.goals.some(goal => goal.id === movement.goalId && !goal.isArchived)).map(movement => movement.kind === 'withdrawal' ? -movement.amountCents : movement.amountCents));
  return { incomeCents, expenseCents, reservedCents, accountingCents: sum([incomeCents, -expenseCents]), availableCents: sum([incomeCents, -expenseCents, -reservedCents]) };
}

export function budgetSummary(snapshot: Snapshot, period: string, settings: Settings, asOf: string) {
  const { start, end } = periodRange(period, settings.monthStartDay);
  const expenses = snapshot.transactions.filter(transaction => transaction.type === 'expense' && transaction.date >= start && transaction.date < end && transaction.date <= asOf);
  const items = snapshot.budgets.map(budget => {
    const spentCents = sum(expenses.filter(transaction => transaction.categoryId === budget.categoryId).map(transaction => transaction.amountCents));
    const percent = spentCents / budget.limitCents * 100;
    const lastThree = [-3, -2, -1].map(offset => {
      const range = periodRange(shiftMonth(period, offset), settings.monthStartDay);
      return sum(snapshot.transactions.filter(transaction => transaction.type === 'expense' && transaction.categoryId === budget.categoryId && transaction.date >= range.start && transaction.date < range.end && transaction.date <= asOf).map(transaction => transaction.amountCents));
    });
    return { ...budget, category: snapshot.categories.find(category => category.id === budget.categoryId)!, spentCents, availableCents: sum([budget.limitCents, -spentCents]), percent, status: percent >= 100 ? 'exceeded' as const : percent >= 80 ? 'warning' as const : 'normal' as const, averageCents: Math.round(sum(lastThree) / 3) };
  });
  return { items, limitCents: sum(items.map(item => item.limitCents)), spentCents: sum(items.map(item => item.spentCents)), unbudgetedCents: sum(expenses.filter(transaction => !items.some(item => item.categoryId === transaction.categoryId)).map(transaction => transaction.amountCents)) };
}

export async function compatibleCategory(repo: FinanceRepository, id: number, type: TransactionType, unchangedId?: number) {
  ensure(type === 'income' || type === 'expense', 'Tipo inválido.');
  const category = await repo.get('categories', id);
  ensure(category.type === type && (!category.isArchived || id === unchangedId), 'Selecione uma categoria ativa do tipo correto.');
  return category;
}

export class FinanceContext {
  constructor(public readonly store: FinanceStore, public readonly settings: SettingsService, public readonly clock: Clock = () => new Date()) {}
  async context() { const settings = await this.settings.get(); return { settings, date: today(this.clock, settings.timezone), at: this.clock().toISOString() }; }
  snapshot() { return this.store.read(loadSnapshot); }
  filterPreset = async (preset: 'today' | 'week' | 'month' | 'previousMonth' | 'custom', custom?: { start: string; inclusiveEnd: string }) => {
    const { date, settings } = await this.context();
    if (preset === 'today') return { start: date, end: addDays(date, 1) };
    if (preset === 'week') { const weekday = new Date(`${date}T12:00:00Z`).getUTCDay(); const start = addDays(date, -(weekday + 6) % 7); return { start, end: addDays(start, 7) }; }
    if (preset === 'custom') { ensure(custom, 'Informe o período.'); const start = dateOnly(custom.start); const end = addDays(dateOnly(custom.inclusiveEnd), 1); ensure(start < end, 'Período inválido.'); return { start, end }; }
    ensure(preset === 'month' || preset === 'previousMonth', 'Filtro inválido.');
    return periodRange(shiftMonth(periodAt(date, settings.monthStartDay), preset === 'previousMonth' ? -1 : 0), settings.monthStartDay);
  };
  async recordBudgetAlerts(repo: FinanceRepository, settings: Settings, date: string, period = periodAt(date, settings.monthStartDay)) {
    monthOnly(period);
    const summary = budgetSummary(await loadSnapshot(repo), period, settings, date);
    const existing = await repo.notificationRecords();
    for (const budget of summary.items) {
      const thresholds = [80, 100].filter(threshold => budget.percent >= threshold && !existing.some(record => record.logicalKey === `budget:${budget.categoryId}:${period}:${threshold}`));
      for (const threshold of thresholds) {
        const suppressed = threshold === 80 && budget.percent >= 100;
        await repo.putNotification({ logicalKey: `budget:${budget.categoryId}:${period}:${threshold}`, kind: 'budget', occurrenceId: null, scheduledAt: null, nativeId: null, state: suppressed ? 'handled' : 'pending', payload: JSON.stringify({ title: 'Orçamento', body: `${budget.category.name}: ${threshold}% do limite atingido.`, destination: { screen: 'budgets' } }) });
      }
    }
  }
}
