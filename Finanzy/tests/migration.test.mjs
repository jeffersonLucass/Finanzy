import assert from 'node:assert/strict';
import test from 'node:test';
import { migrate } from '../src/infrastructure/storage/migrations/index.ts';
import { TestDatabase } from './helpers.mjs';

const at = '2025-03-15T12:00:00.000Z';

async function legacyDatabase() {
  const db = new TestDatabase();
  await db.exec("CREATE TABLE profile(id INTEGER PRIMARY KEY,name TEXT NOT NULL); CREATE TABLE transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,description TEXT NOT NULL,category TEXT NOT NULL,type TEXT NOT NULL,amount REAL NOT NULL,date TEXT NOT NULL,observation TEXT,favorite INTEGER NOT NULL DEFAULT 0); CREATE TABLE budgets(id INTEGER PRIMARY KEY AUTOINCREMENT,category TEXT NOT NULL UNIQUE,monthly_limit REAL NOT NULL); CREATE TABLE goals(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,target_amount REAL NOT NULL,saved_amount REAL NOT NULL DEFAULT 0,deadline TEXT,icon TEXT);");
  await db.run('INSERT INTO profile(id,name) VALUES(1,?)', ['Ana']);
  await db.run('INSERT INTO transactions(id,description,category,type,amount,date,observation,favorite) VALUES(?,?,?,?,?,?,?,?)', [7, 'Salário', 'Outros', 'income', 1000.1, '2025-03-01', 'legado', 1]);
  await db.run('INSERT INTO transactions(id,description,category,type,amount,date,observation,favorite) VALUES(?,?,?,?,?,?,?,?)', [8, 'Compra', 'Outros', 'expense', 25.55, '2025-03-02', null, 0]);
  await db.run('INSERT INTO budgets(id,category,monthly_limit) VALUES(?,?,?)', [4, 'Outros', 300]);
  await db.run('INSERT INTO goals(id,name,target_amount,saved_amount,deadline,icon) VALUES(?,?,?,?,?,?)', [3, 'Viagem', 2000, 200, null, '🎯']);
  return db;
}

test('migra banco legado preservando ids, totais e categorias por tipo', async () => {
  const db = await legacyDatabase();
  await migrate(db, at);
  assert.equal((await db.all('PRAGMA user_version'))[0].user_version, 1);
  const transactions = (await db.all('SELECT id,amountCents,isFavorite,observation FROM transactions ORDER BY id')).map(row => ({ ...row }));
  assert.deepEqual(transactions, [
    { id: 7, amountCents: 100010, isFavorite: 1, observation: 'legado' },
    { id: 8, amountCents: 2555, isFavorite: 0, observation: null },
  ]);
  assert.equal((await db.all("SELECT COUNT(*) AS total FROM categories WHERE normalizedName='outros'"))[0].total, 2);
  assert.equal((await db.all('SELECT amountCents FROM goal_movements WHERE goalId=3'))[0].amountCents, 20000);
  await migrate(db, at);
  assert.equal((await db.all('SELECT COUNT(*) AS total FROM transactions'))[0].total, 2);
  assert.equal((await db.all('SELECT COUNT(*) AS total FROM goal_movements'))[0].total, 1);
});

test('reverte a migração inteira quando um registro legado é inválido', async () => {
  const db = new TestDatabase();
  await db.exec("CREATE TABLE transactions(id INTEGER PRIMARY KEY,description TEXT,category TEXT,type TEXT,amount REAL,date TEXT,observation TEXT,favorite INTEGER); INSERT INTO transactions VALUES(1,'Inválida','Outros','expense',10,'data-inválida',NULL,0);");
  await assert.rejects(() => migrate(db, at));
  assert.equal((await db.all('PRAGMA user_version'))[0].user_version, 0);
  assert.equal((await db.all('SELECT COUNT(*) AS total FROM transactions'))[0].total, 1);
  assert.equal((await db.all("SELECT COUNT(*) AS total FROM sqlite_master WHERE type='table' AND name='categories'"))[0].total, 0);
});
