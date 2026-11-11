import { ReportsService } from '../../reports/report-service';

type MonthlyReport = Awaited<ReturnType<ReportsService['getMonthlyReport']>>;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
const brlValue = (cents: number) => `${cents < 0 ? '-' : ''}${Math.floor(Math.abs(cents) / 100)},${String(Math.abs(cents) % 100).padStart(2, '0')}`;

export function buildMonthlyReportHtml(report: MonthlyReport) {
  const categoryNames = new Map(report.allCategories.map(category => [category.id, category.name]));
  const categories = report.categories.map(item => `<tr><td>${escapeHtml(item.category.name)}</td><td>${escapeHtml(brlValue(item.totalCents))}</td><td>${item.percent.toFixed(1).replace('.', ',')}%</td></tr>`).join('');
  const transactions = report.transactions.map(row => `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.type === 'income' ? 'Receita' : 'Despesa')}</td><td>${escapeHtml(categoryNames.get(row.categoryId) ?? '')}</td><td>${escapeHtml(row.description)}</td><td>${escapeHtml(brlValue(row.amountCents))}</td><td>${escapeHtml(row.observation ?? '')}</td></tr>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#111827;padding:24px}h1{color:#059669}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:8px}.summary{display:flex;gap:24px}.value{font-size:18px;font-weight:700}</style></head><body><h1>Finanzy</h1><h2>Relatório mensal ${escapeHtml(report.period)}</h2><div class="summary"><div>Receitas<div class="value">R$ ${escapeHtml(brlValue(report.incomeCents))}</div></div><div>Despesas<div class="value">R$ ${escapeHtml(brlValue(report.expenseCents))}</div></div><div>Saldo<div class="value">R$ ${escapeHtml(brlValue(report.balanceCents))}</div></div></div><h3>Categorias</h3><table><thead><tr><th>Categoria</th><th>Total</th><th>Percentual</th></tr></thead><tbody>${categories}</tbody></table><h3>Transações</h3><table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Observação</th></tr></thead><tbody>${transactions}</tbody></table></body></html>`;
}
