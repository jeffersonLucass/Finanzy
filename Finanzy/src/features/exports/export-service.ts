import { dateOnly, ensure, monthOnly } from '../../domain/core';
import { TransactionFilters } from '../../domain/models';
import { FinanceContext } from '../../application/finance-context';
import { ReportsService } from '../reports/report-service';
import { buildMonthlyReportHtml } from './templates/monthly-report-html';
import { buildTransactionsCsv } from './templates/transactions-csv';

export type ExportFile = { uri: string; name: string; mimeType: 'text/csv' | 'application/pdf' };

export interface ExportFileAdapter {
  saveCsv(name: string, content: string): Promise<ExportFile>;
  savePdf(name: string, html: string): Promise<ExportFile | null>;
  share(file: ExportFile): Promise<void>;
  cleanupAll(): Promise<void>;
}

function matches(filters: TransactionFilters, row: { description: string; type: string; categoryId: number; date: string; isFavorite: boolean }, category: string) {
  if (filters.type && row.type !== filters.type) return false;
  if (filters.categoryIds?.length && !filters.categoryIds.includes(row.categoryId)) return false;
  if (filters.start && row.date < filters.start) return false;
  if (filters.end && row.date >= filters.end) return false;
  if (filters.favoritesOnly && !row.isFavorite) return false;
  if (filters.search) {
    const search = filters.search.toLocaleLowerCase('pt-BR');
    if (!row.description.toLocaleLowerCase('pt-BR').includes(search) && !category.toLocaleLowerCase('pt-BR').includes(search)) return false;
  }
  return true;
}

export class ExportService {
  constructor(private readonly finance: FinanceContext, private readonly reports: ReportsService, public readonly files: ExportFileAdapter) {}
  async exportTransactionsCsv(filters: TransactionFilters = {}) {
    if (filters.start) dateOnly(filters.start);
    if (filters.end) dateOnly(filters.end);
    ensure(!filters.start || !filters.end || filters.start < filters.end, 'Período inválido.');
    ensure(filters.search === undefined || filters.search.length <= 200, 'Busca inválida.');
    ensure(!filters.categoryIds || filters.categoryIds.every(id => Number.isSafeInteger(id) && id > 0), 'Categorias inválidas.');
    const snapshot = await this.finance.snapshot();
    const categoryNames = new Map(snapshot.categories.map(category => [category.id, category.name]));
    const rows = snapshot.transactions.filter(row => matches(filters, row, categoryNames.get(row.categoryId) ?? '')).sort((first, second) => second.date.localeCompare(first.date) || second.id - first.id);
    const result = buildTransactionsCsv(rows, snapshot.categories);
    const context = await this.finance.context();
    const name = `finanzy-transacoes-${context.date}.csv`;
    const file = await this.files.saveCsv(name, result.content);
    return { ...result, file };
  }
  async exportMonthlyPdf(period: string) {
    monthOnly(period);
    const report = await this.reports.getMonthlyReport(period);
    const html = buildMonthlyReportHtml(report);
    const name = `finanzy-relatorio-${period}.pdf`;
    const file = await this.files.savePdf(name, html);
    return { html, file, name, mimeType: 'application/pdf' as const, report };
  }
}
