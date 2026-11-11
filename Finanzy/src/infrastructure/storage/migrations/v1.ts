import { dateOnly, ensure, legacyCents, normalizeName, text } from '../../../domain/core';
import { TransactionType } from '../../../domain/models';
import { SqlDatabase } from '../port';
import { SCHEMA_VERSION, schema } from '../schema';
import { seedCategories } from '../seeds';

export async function migrate(database: SqlDatabase, at: string) {
  await database.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  await database.transaction(async connection => {
    const version = (await connection.all<{ user_version: number }>('PRAGMA user_version'))[0].user_version;
    ensure(version <= SCHEMA_VERSION, 'Banco de versão mais recente. Atualize o aplicativo.', 'STORAGE_ERROR');
    if (version === SCHEMA_VERSION) return;
    const tables = await connection.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");
    const legacy = ['profile', 'transactions', 'budgets', 'goals'].filter(name => tables.some(table => table.name === name));
    for (const name of legacy) await connection.exec(`ALTER TABLE ${name} RENAME TO legacy_${name}`);
    await connection.exec(schema);
    await seedCategories(connection, at);
    const categoryId = async (name: string, type: TransactionType) => {
      ensure(type === 'income' || type === 'expense', 'Tipo legado inválido.', 'STORAGE_ERROR');
      const normalized = normalizeName(text(name));
      await connection.run('INSERT OR IGNORE INTO categories(name,normalizedName,type,icon,color,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)', [text(name), normalized, type, '📦', '#10B981', at, at]);
      return (await connection.all<{ id: number }>('SELECT id FROM categories WHERE normalizedName=? AND type=?', [normalized, type]))[0].id;
    };
    if (legacy.includes('profile')) {
      for (const profile of await connection.all<{ id: number; name: string }>('SELECT id,name FROM legacy_profile')) await connection.run('INSERT INTO profile VALUES(?,?,?,?)', [profile.id, text(profile.name), at, at]);
    }
    if (legacy.includes('transactions')) {
      const rows = await connection.all<{ id: number; description: string; category: string; type: TransactionType; amount: number; date: string; observation: string | null; favorite: number }>('SELECT id,description,category,type,amount,date,observation,favorite FROM legacy_transactions');
      for (const transaction of rows) {
        ensure(transaction.favorite === 0 || transaction.favorite === 1, 'Favorito legado inválido.', 'STORAGE_ERROR');
        await connection.run('INSERT INTO transactions(id,description,categoryId,type,amountCents,date,observation,isFavorite,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?)', [transaction.id, text(transaction.description), await categoryId(transaction.category, transaction.type), transaction.type, legacyCents(transaction.amount), dateOnly(transaction.date), transaction.observation, transaction.favorite, at, at]);
      }
    }
    if (legacy.includes('budgets')) {
      for (const budget of await connection.all<{ id: number; category: string; monthly_limit: number }>('SELECT id,category,monthly_limit FROM legacy_budgets')) await connection.run('INSERT INTO budgets VALUES(?,?,?,?,?)', [budget.id, await categoryId(budget.category, 'expense'), legacyCents(budget.monthly_limit), at, at]);
    }
    if (legacy.includes('goals')) {
      for (const goal of await connection.all<{ id: number; name: string; target_amount: number; saved_amount: number; deadline: string | null; icon: string | null }>('SELECT id,name,target_amount,saved_amount,deadline,icon FROM legacy_goals')) {
        await connection.run('INSERT INTO goals(id,name,targetCents,deadline,icon,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)', [goal.id, text(goal.name), legacyCents(goal.target_amount), goal.deadline ? dateOnly(goal.deadline) : null, goal.icon, at, at]);
        const saved = legacyCents(goal.saved_amount, true);
        if (saved) await connection.run('INSERT INTO goal_movements(goalId,kind,amountCents,date,operationKey,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)', [goal.id, 'opening', saved, at.slice(0, 10), `migration:goal:${goal.id}`, at, at]);
      }
    }
    for (const name of legacy) await connection.exec(`DROP TABLE legacy_${name}`);
    await connection.exec(`PRAGMA user_version=${SCHEMA_VERSION}`);
  });
}
