import { sum } from '../../../domain/core';
import { Category, Transaction } from '../../../domain/models';

const protectedText = (value: string) => /^[=+\-@\u0000-\u001f]/.test(value) ? `'${value}` : value;
const csvCell = (value: string) => `"${protectedText(value).replace(/"/g, '""')}"`;
const brlValue = (cents: number) => `${cents < 0 ? '-' : ''}${Math.floor(Math.abs(cents) / 100)},${String(Math.abs(cents) % 100).padStart(2, '0')}`;

export function buildTransactionsCsv(rows: Transaction[], categories: Category[]) {
  const categoryNames = new Map(categories.map(category => [category.id, category.name]));
  const header = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Observação'];
  const lines = rows.map(row => [row.date, row.type === 'income' ? 'Receita' : 'Despesa', categoryNames.get(row.categoryId) ?? '', row.description, brlValue(row.amountCents), row.observation ?? ''].map(csvCell).join(';'));
  return { content: `\uFEFF${header.map(csvCell).join(';')}\r\n${lines.join('\r\n')}\r\n`, count: rows.length, incomeCents: sum(rows.filter(row => row.type === 'income').map(row => row.amountCents)), expenseCents: sum(rows.filter(row => row.type === 'expense').map(row => row.amountCents)) };
}
