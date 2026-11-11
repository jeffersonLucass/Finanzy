import { normalizeName } from '../../domain/core';
import { SqlConnection } from './port';

const expenseSeeds: [string, string][] = [['Alimentação', '🍔'], ['Moradia', '🏠'], ['Transporte', '🚕'], ['Saúde', '❤️'], ['Educação', '📚'], ['Lazer', '🎮'], ['Compras', '🛒️'], ['Serviços', '🧾'], ['Outros', '📦']];
const incomeSeeds: [string, string][] = [['Salário', '💰'], ['Freelance', '💼'], ['Investimentos', '📈'], ['Presente', '🎁'], ['Reembolso', '↩️'], ['Outros', '📦']];

export async function seedCategories(database: SqlConnection, at: string) {
  for (const [type, entries] of [['expense', expenseSeeds], ['income', incomeSeeds]] as const) {
    for (const [name, icon] of entries) await database.run('INSERT OR IGNORE INTO categories(name,normalizedName,type,icon,color,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)', [name, normalizeName(name), type, icon, '#10B981', at, at]);
  }
}
