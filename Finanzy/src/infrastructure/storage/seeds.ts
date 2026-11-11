import { normalizeName } from '../../domain/core';
import { SqlConnection } from './port';

const expenseSeeds: [string, string][] = [['Alimentação', 'utensils'], ['Moradia', 'house'], ['Transporte', 'car'], ['Saúde', 'heart'], ['Educação', 'book-open'], ['Lazer', 'gamepad'], ['Compras', 'shopping-cart'], ['Serviços', 'receipt'], ['Outros', 'package']];
const incomeSeeds: [string, string][] = [['Salário', 'banknote'], ['Freelance', 'briefcase'], ['Investimentos', 'trending-up'], ['Presente', 'gift'], ['Reembolso', 'undo'], ['Outros', 'package']];

export async function seedCategories(database: SqlConnection, at: string) {
  for (const [type, entries] of [['expense', expenseSeeds], ['income', incomeSeeds]] as const) {
    for (const [name, icon] of entries) await database.run('INSERT OR IGNORE INTO categories(name,normalizedName,type,icon,color,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)', [name, normalizeName(name), type, icon, '#10B981', at, at]);
  }
}
