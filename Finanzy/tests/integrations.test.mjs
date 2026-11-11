import assert from 'node:assert/strict';
import test from 'node:test';
import { migrate } from '../src/infrastructure/storage/migrations/index.ts';
import { FinanceStore } from '../src/infrastructure/storage/repositories/finance-repository.ts';
import { FinanceContext } from '../src/application/finance-context.ts';
import { BudgetService } from '../src/features/budgets/budget-service.ts';
import { HolidayService } from '../src/features/calendar/holiday-service.ts';
import { CategoryService } from '../src/features/categories/category-service.ts';
import { DataManagementService } from '../src/features/data-management/data-management-service.ts';
import { ExportService } from '../src/features/exports/export-service.ts';
import { NotificationService } from '../src/features/notifications/notification-service.ts';
import { RecurringService } from '../src/features/recurring/recurring-service.ts';
import { ReportsService } from '../src/features/reports/report-service.ts';
import { SessionService } from '../src/features/session/session-service.ts';
import { SettingsService, defaultSettings } from '../src/features/settings/settings-service.ts';
import { TransactionService } from '../src/features/transactions/transaction-service.ts';
import { MemoryKeyValue, TestDatabase } from './helpers.mjs';

async function setup() {
  const db = new TestDatabase();
  let now = new Date('2025-03-15T12:00:00.000Z');
  await migrate(db, now.toISOString());
  const settings = new SettingsService(new MemoryKeyValue());
  const store = new FinanceStore(db);
  const finance = new FinanceContext(store, settings, () => new Date(now));
  const session = new SessionService(finance);
  const categories = new CategoryService(finance);
  const transactions = new TransactionService(finance);
  const budgets = new BudgetService(finance);
  const recurring = new RecurringService(finance);
  const reports = new ReportsService(finance);
  return { db, store, settings, finance, session, categories, transactions, budgets, recurring, reports, setNow: value => { now = new Date(value); } };
}

test('usa cache de feriados e preserva cache válido em falha externa', async () => {
  const { store } = await setup();
  let calls = 0;
  let fail = false;
  let now = new Date('2025-03-15T12:00:00.000Z');
  const client = { getJson: async () => {
    calls++;
    if (fail) throw new Error('offline');
    return [{ date: '2025-01-01', name: 'Confraternização', type: 'national' }];
  } };
  const service = new HolidayService(store, client, () => new Date(now));
  const network = await service.get(2025);
  assert.equal(network.source, 'network');
  const cache = await service.get(2025);
  assert.equal(cache.source, 'cache');
  assert.equal(calls, 1);
  now = new Date('2025-03-17T12:00:00.000Z');
  fail = true;
  const stale = await service.get(2025);
  assert.equal(stale.source, 'cache');
  assert.equal(stale.stale, true);
  assert.equal(calls, 2);
});

test('exporta CSV e HTML escapados usando os totais do relatório', async () => {
  const { finance, categories, transactions, reports } = await setup();
  const expense = (await categories.list()).find(category => category.type === 'expense');
  await transactions.create({ description: '=2+2', categoryId: expense.id, type: 'expense', amountCents: 12345, date: '2025-03-10', observation: '<script>' }, 'export-row');
  const adapter = {
    saveCsv: async (name, content) => ({ uri: `memory:${content.length}`, name, mimeType: 'text/csv' }),
    savePdf: async (name, html) => ({ uri: `memory:${html.length}`, name, mimeType: 'application/pdf' }),
    share: async () => {},
    cleanupAll: async () => {},
  };
  const service = new ExportService(finance, reports, adapter);
  const csv = await service.exportTransactionsCsv();
  assert.equal(csv.expenseCents, 12345);
  assert.match(csv.content, /'=2\+2/);
  assert.match(csv.content, /<script>/);
  const pdf = await service.exportMonthlyPdf('2025-03');
  assert.equal(pdf.report.expenseCents, csv.expenseCents);
  assert.doesNotMatch(pdf.html, /<script>/);
  assert.match(pdf.html, /&lt;script&gt;/);
});

test('reconcilia alerta de orçamento uma vez sem duplicar agendamento', async () => {
  const { finance, categories, transactions, budgets, recurring } = await setup();
  const expense = (await categories.list('expense'))[0];
  await budgets.save(expense.id, 10000);
  await transactions.create({ description: 'Compra', categoryId: expense.id, type: 'expense', amountCents: 10000, date: '2025-03-10' }, 'budget-expense');
  const scheduled = [];
  const adapter = {
    supported: true,
    permission: async () => true,
    list: async () => scheduled.map(item => ({ id: item.id, key: item.key })),
    schedule: async (key) => { const id = `native-${scheduled.length + 1}`; scheduled.push({ id, key }); return id; },
    cancel: async id => { const index = scheduled.findIndex(item => item.id === id); if (index >= 0) scheduled.splice(index, 1); },
    listen: () => () => {},
  };
  await finance.settings.update({ notificationsEnabled: true });
  const service = new NotificationService(finance, recurring, adapter);
  const feedback = [];
  service.subscribeFeedback(notice => feedback.push(notice));
  await service.reconcile();
  await service.reconcile();
  assert.equal(feedback.length, 1);
  assert.equal(feedback[0].destination.screen, 'budgets');
  assert.equal(scheduled.length, 1);
});

test('limpeza preserva perfil e reset remove somente chaves do Finanzy', async () => {
  const { db, finance, session, categories, transactions, recurring, settings } = await setup();
  await session.signIn('Ana');
  const expense = (await categories.list('expense'))[0];
  await transactions.create({ description: 'Compra', categoryId: expense.id, type: 'expense', amountCents: 1000, date: '2025-03-10' }, 'clear-row');
  await recurring.create({ kind: 'subscription', name: 'Internet', categoryId: expense.id, amountCents: 10000, dueDay: 10, startMonth: '2025-03', installmentCount: null }, 'clear-recurring');
  let cancellations = 0;
  let cleanups = 0;
  const manager = new DataManagementService(finance, { cancelAll: async () => { cancellations++; } }, settings, { cleanupAll: async () => { cleanups++; } });
  await manager.clearFinancialData();
  assert.equal((await session.getProfile()).name, 'Ana');
  assert.equal((await finance.snapshot()).transactions.length, 0);
  assert.equal((await finance.snapshot()).recurring.length, 0);
  assert.equal((await settings.get()).isSessionActive, true);
  await manager.resetApplication();
  assert.equal(await session.getProfile(), null);
  assert.ok((await categories.list()).length > 0);
  assert.deepEqual(await settings.get(), defaultSettings);
  assert.equal(cancellations, 2);
  assert.equal(cleanups, 1);
  assert.equal((await db.all('SELECT COUNT(*) AS total FROM maintenance'))[0].total, 0);
});
