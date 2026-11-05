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
