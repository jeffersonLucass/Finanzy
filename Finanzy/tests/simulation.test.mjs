import assert from 'node:assert/strict';
import test from 'node:test';
import { FinanceContext } from '../src/application/finance-context.ts';
import { BudgetService } from '../src/features/budgets/budget-service.ts';
import { CategoryService } from '../src/features/categories/category-service.ts';
import { ReportsService } from '../src/features/reports/report-service.ts';
import { SettingsService } from '../src/features/settings/settings-service.ts';
import { TransactionService } from '../src/features/transactions/transaction-service.ts';
import { migrate } from '../src/infrastructure/storage/migrations/index.ts';
import { FinanceStore } from '../src/infrastructure/storage/repositories/finance-repository.ts';
import { MemoryKeyValue, TestDatabase } from './helpers.mjs';

test('simula inserção de lançamentos e confere o painel financeiro', async () => {
  const db = new TestDatabase();
  const now = new Date('2025-03-15T12:00:00.000Z');
  await migrate(db, now.toISOString());

  const finance = new FinanceContext(
    new FinanceStore(db),
    new SettingsService(new MemoryKeyValue()),
    () => new Date(now),
  );
  const categories = new CategoryService(finance);
  const transactions = new TransactionService(finance);
  const budgets = new BudgetService(finance);
  const reports = new ReportsService(finance);

  const salary = await categories.findOrCreate('Salário', 'income');
  const food = await categories.findOrCreate('Alimentação', 'expense');
  const transport = await categories.findOrCreate('Transporte', 'expense');

  await transactions.create({
    description: 'Salário de março',
    categoryId: salary.id,
    type: 'income',
    amountCents: 500000,
    date: '2025-03-05',
  }, 'simulation-salary');
  await transactions.create({
    description: 'Trabalho extra',
    categoryId: salary.id,
    type: 'income',
    amountCents: 75000,
    date: '2025-03-12',
  }, 'simulation-extra-income');
  await transactions.create({
    description: 'Compras do mês',
    categoryId: food.id,
    type: 'expense',
    amountCents: 82500,
    date: '2025-03-13',
  }, 'simulation-food');
  await transactions.create({
    description: 'Transporte',
    categoryId: transport.id,
    type: 'expense',
    amountCents: 12500,
    date: '2025-03-14',
  }, 'simulation-transport');

  await budgets.save(food.id, 100000);

  const list = await transactions.list({ start: '2025-03-01', end: '2025-04-01' });
  const budgetList = await budgets.list('2025-03');
  const dashboard = await reports.getDashboard();

  assert.equal(list.total, 4);
  assert.equal(list.incomeCents, 575000);
  assert.equal(list.expenseCents, 95000);
  assert.equal(dashboard.accountingCents, 480000);
  assert.equal(dashboard.monthly.balanceCents, 480000);

  const foodBudget = budgetList.items.find(item => item.categoryId === food.id);
  assert.equal(foodBudget.spentCents, 82500);
  assert.equal(foodBudget.status, 'warning');
  assert.equal(dashboard.budget.items.find(item => item.categoryId === food.id).spentCents, 82500);
});
