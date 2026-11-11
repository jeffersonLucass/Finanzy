import { exportFileAdapter } from '../infrastructure/files/adapter';
import { HttpClient } from '../infrastructure/http/client';
import { notificationAdapter } from '../infrastructure/notifications/adapter';
import { migrate } from '../infrastructure/storage/migrations';
import { keyValueStore, openFinanzyDatabase } from '../infrastructure/storage/expo';
import { FinanceStore } from '../infrastructure/storage/repositories/finance-repository';
import { BudgetService } from '../features/budgets/budget-service';
import { HolidayService } from '../features/calendar/holiday-service';
import { CategoryService } from '../features/categories/category-service';
import { DataManagementService } from '../features/data-management/data-management-service';
import { ExportService } from '../features/exports/export-service';
import { GoalService } from '../features/goals/goal-service';
import { NotificationService } from '../features/notifications/notification-service';
import { RecurringService } from '../features/recurring/recurring-service';
import { ReportsService } from '../features/reports/report-service';
import { SessionService } from '../features/session/session-service';
import { SettingsService } from '../features/settings/settings-service';
import { TransactionService } from '../features/transactions/transaction-service';
import { FinanceContext } from './finance-context';

export type Runtime = Awaited<ReturnType<typeof createRuntime>>;

async function createRuntime() {
  const database = await openFinanzyDatabase();
  await migrate(database, new Date().toISOString());
  const store = new FinanceStore(database);
  const settings = new SettingsService(keyValueStore);
  const finance = new FinanceContext(store, settings);
  const session = new SessionService(finance);
  const categories = new CategoryService(finance);
  const transactions = new TransactionService(finance);
  const budgets = new BudgetService(finance);
  const goals = new GoalService(finance);
  const recurring = new RecurringService(finance);
  const reports = new ReportsService(finance);
  const holidays = new HolidayService(store, new HttpClient());
  const notifications = new NotificationService(finance, recurring, notificationAdapter);
  const exports = new ExportService(finance, reports, exportFileAdapter);
  const dataManagement = new DataManagementService(finance, notifications, settings, exportFileAdapter);
  await exportFileAdapter.cleanupAll().catch(() => undefined);
  await dataManagement.resume();
  return { store, finance, settings, session, categories, transactions, budgets, goals, recurring, reports, holidays, notifications, exports, dataManagement };
}

let runtimePromise: Promise<Runtime> | null = null;

export function getRuntime() {
  if (!runtimePromise) runtimePromise = createRuntime().catch(error => {
    runtimePromise = null;
    throw error;
  });
  return runtimePromise;
}

export async function initializeRuntime() {
  await getRuntime();
}
