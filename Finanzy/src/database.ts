import * as SQLite from 'expo-sqlite';

export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: number;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  date: string;
  observation: string | null;
  favorite: number;
};

export type Budget = {
  id: number;
  category: string;
  monthlyLimit: number;
};

export type Goal = {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  icon: string | null;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('finanzy.db');
  }
  return databasePromise;
}

export async function initializeDatabase() {
  const database = await getDatabase();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      observation TEXT,
      favorite INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL UNIQUE,
      monthly_limit REAL NOT NULL CHECK (monthly_limit > 0)
    );
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL CHECK (target_amount > 0),
      saved_amount REAL NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
      deadline TEXT,
      icon TEXT
    );
  `);
}

export async function getProfileName() {
  const database = await getDatabase();
  const profile = await database.getFirstAsync<{ name: string }>(
    'SELECT name FROM profile WHERE id = 1'
  );
  return profile?.name ?? null;
}

export async function saveProfileName(name: string) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO profile (id, name) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name`,
    name.trim()
  );
}

export async function getTransactions() {
  const database = await getDatabase();
  return database.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC, id DESC'
  );
}

export async function clearLocalData() {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM profile;
    DELETE FROM transactions;
    DELETE FROM sqlite_sequence WHERE name = 'transactions';
  `);
}

export async function addTransaction(
  transaction: Omit<Transaction, 'id'>
) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO transactions
      (description, category, type, amount, date, observation, favorite)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    transaction.description,
    transaction.category,
    transaction.type,
    transaction.amount,
    transaction.date,
    transaction.observation,
    'favorite' in transaction && transaction.favorite ? 1 : 0
  );
}

export async function getBudgets() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    category: string;
    monthly_limit: number;
  }>('SELECT id, category, monthly_limit FROM budgets ORDER BY category');
  return rows.map(({ id, category, monthly_limit }) => ({
    id,
    category,
    monthlyLimit: monthly_limit,
  }));
}

export async function saveBudget(id: number | null, category: string, monthlyLimit: number) {
  const database = await getDatabase();
  if (id === null) {
    await database.runAsync(
      `INSERT INTO budgets (category, monthly_limit) VALUES (?, ?)
       ON CONFLICT(category) DO UPDATE SET monthly_limit = excluded.monthly_limit`,
      category,
      monthlyLimit
    );
    return;
  }
  await database.runAsync(
    'UPDATE budgets SET category = ?, monthly_limit = ? WHERE id = ?',
    category,
    monthlyLimit,
    id
  );
}

export async function deleteBudget(id: number) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM budgets WHERE id = ?', id);
}

export async function getGoals() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    name: string;
    target_amount: number;
    saved_amount: number;
    deadline: string | null;
    icon: string | null;
  }>(
    'SELECT id, name, target_amount, saved_amount, deadline, icon FROM goals ORDER BY id DESC'
  );
  return rows.map(({ id, name, target_amount, saved_amount, deadline, icon }) => ({
    id,
    name,
    targetAmount: target_amount,
    savedAmount: saved_amount,
    deadline,
    icon,
  }));
}

export async function saveGoal(goal: Omit<Goal, 'id'>, id: number | null) {
  const database = await getDatabase();
  if (id === null) {
    await database.runAsync(
      `INSERT INTO goals (name, target_amount, saved_amount, deadline, icon)
       VALUES (?, ?, ?, ?, ?)`,
      goal.name,
      goal.targetAmount,
      goal.savedAmount,
      goal.deadline,
      goal.icon
    );
    return;
  }
  await database.runAsync(
    `UPDATE goals
     SET name = ?, target_amount = ?, saved_amount = ?, deadline = ?, icon = ?
     WHERE id = ?`,
    goal.name,
    goal.targetAmount,
    goal.savedAmount,
    goal.deadline,
    goal.icon,
    id
  );
}

export async function addToGoal(id: number, amount: number) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE goals SET saved_amount = saved_amount + ? WHERE id = ?',
    amount,
    id
  );
}

export async function deleteGoal(id: number) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM goals WHERE id = ?', id);
}
