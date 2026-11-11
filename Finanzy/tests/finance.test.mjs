import assert from 'node:assert/strict';
import test from 'node:test';
import { migrate } from '../src/infrastructure/storage/migrations/index.ts';
import { FinanceStore } from '../src/infrastructure/storage/repositories/finance-repository.ts';
import { FinanceContext } from '../src/application/finance-context.ts';
import { CategoryService } from '../src/features/categories/category-service.ts';
import { GoalService } from '../src/features/goals/goal-service.ts';
import { RecurringService } from '../src/features/recurring/recurring-service.ts';
import { ReportsService } from '../src/features/reports/report-service.ts';
import { SettingsService } from '../src/features/settings/settings-service.ts';
import { TransactionService } from '../src/features/transactions/transaction-service.ts';
import { MemoryKeyValue, TestDatabase } from './helpers.mjs';

async function services() {
  const db = new TestDatabase();
  const now = new Date('2025-03-15T12:00:00.000Z');
  await migrate(db, now.toISOString());
  const settings = new SettingsService(new MemoryKeyValue());
  const finance = new FinanceContext(new FinanceStore(db), settings, () => new Date(now));
  const categoriesService = new CategoryService(finance);
  const transactions = new TransactionService(finance);
  const goals = new GoalService(finance);
  const recurring = new RecurringService(finance);
  const reports = new ReportsService(finance);
  const categories = await categoriesService.list();
  return { db, finance, transactions, goals, recurring, reports, income: categories.find(item => item.type === 'income'), expense: categories.find(item => item.type === 'expense') };
}

test('reserva de meta reduz disponível sem criar despesa e é idempotente', async () => {
  const { transactions, goals, reports, income } = await services();
  await transactions.create({ description: 'Receita', categoryId: income.id, type: 'income', amountCents: 100000, date: '2025-03-01' }, 'income-1');
  const goal = await goals.create({ name: 'Reserva', targetCents: 50000 }, 20000, 'goal-1');
  const repeated = await goals.create({ name: 'Reserva', targetCents: 50000 }, 20000, 'goal-1');
  assert.equal(repeated.id, goal.id);
  let dashboard = await reports.getDashboard();
  assert.equal(dashboard.accountingCents, 100000);
  assert.equal(dashboard.reservedCents, 20000);
  assert.equal(dashboard.availableCents, 80000);
  assert.equal(dashboard.monthly.expenseCents, 0);
  await assert.rejects(() => goals.move(goal.id, 'deposit', 90000, 'deposit-too-high'));
  await goals.move(goal.id, 'withdrawal', 5000, 'withdraw-1');
  dashboard = await reports.getDashboard();
  assert.equal(dashboard.availableCents, 85000);
});

test('paga e desfaz parcela atomicamente sem duplicar despesa', async () => {
  const { finance, recurring, reports, expense } = await services();
  const rule = await recurring.create({ kind: 'installment', name: 'Curso', categoryId: expense.id, amountCents: 35000, dueDay: 10, startMonth: '2025-03', installmentCount: 10 }, 'installment-1');
  const details = await recurring.details(rule.id);
  assert.equal(details.totalCents, 350000);
  const occurrence = details.occurrences[0];
  const payment = await recurring.payOccurrence(occurrence.id, '2025-03-10', 'pay-1');
  const repeated = await recurring.payOccurrence(occurrence.id, '2025-03-10', 'pay-1');
  assert.equal(repeated.id, payment.id);
  assert.equal((await reports.getDashboard()).accountingCents, -35000);
  await recurring.undoPayment(occurrence.id, 'undo-1');
  assert.equal((await reports.getDashboard()).accountingCents, 0);
  const forecast = await reports.getForecast('2025-03', 3);
  assert.equal(forecast[0].totalCents, 35000);
  assert.equal(forecast[1].totalCents, 35000);
});

test('filtros calculam total completo independentemente da página', async () => {
  const { transactions, expense } = await services();
  for (let index = 0; index < 3; index++) await transactions.create({ description: `Mercado ${index}`, categoryId: expense.id, type: 'expense', amountCents: 1000 + index, date: `2025-03-0${index + 1}` }, `expense-${index}`);
  const result = await transactions.list({ search: 'Mercado', limit: 1 });
  assert.equal(result.items.length, 1);
  assert.equal(result.total, 3);
  assert.equal(result.expenseCents, 3003);
  assert.equal((await transactions.list({ search: '%' })).total, 0);
});
