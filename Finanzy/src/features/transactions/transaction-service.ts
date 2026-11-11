import { dateOnly, ensure, money, periodAt, sum, text } from '../../domain/core';
import { TransactionFilters, TransactionInput } from '../../domain/models';
import { FinanceContext, compatibleCategory } from '../../application/finance-context';

export class TransactionService {
  constructor(private readonly finance: FinanceContext) {}
  private validate(input: TransactionInput) {
    const description = text(input.description, 'Descrição');
    money(input.amountCents);
    dateOnly(input.date);
    ensure(input.isFavorite === undefined || typeof input.isFavorite === 'boolean', 'Favorito inválido.');
    ensure(input.observation === undefined || input.observation === null || (typeof input.observation === 'string' && input.observation.length <= 2000), 'Observação inválida.');
    return { ...input, description, observation: input.observation?.trim() || null, isFavorite: input.isFavorite ?? false };
  }
  async create(input: TransactionInput, key?: string) {
    const valid = this.validate(input);
    const context = await this.finance.context();
    return this.finance.store.write(async repository => {
      const create = async () => {
        await compatibleCategory(repository, valid.categoryId, valid.type);
        const row = await repository.insert('transactions', { ...valid, occurrenceId: null, operationKey: key ?? null, createdAt: context.at, updatedAt: context.at });
        if (row.type === 'expense' && row.date <= context.date) await this.finance.recordBudgetAlerts(repository, context.settings, context.date, periodAt(row.date, context.settings.monthStartDay));
        return row;
      };
      return key ? repository.command(key, JSON.stringify(['transaction:create', valid]), create) : create();
    });
  }
  get(id: number) { return this.finance.store.read(repository => repository.get('transactions', id)); }
  async update(id: number, input: TransactionInput) {
    const valid = this.validate(input);
    const context = await this.finance.context();
    return this.finance.store.write(async repository => {
      const current = await repository.get('transactions', id);
      ensure(current.occurrenceId === null, 'Use o fluxo de pagamento para alterar esta movimentação.', 'CONFLICT');
      await compatibleCategory(repository, valid.categoryId, valid.type, current.categoryId);
      const row = await repository.update('transactions', id, { ...valid, updatedAt: context.at });
      if (row.type === 'expense' && row.date <= context.date) await this.finance.recordBudgetAlerts(repository, context.settings, context.date, periodAt(row.date, context.settings.monthStartDay));
      return row;
    });
  }
  async remove(id: number) {
    const at = this.finance.clock().toISOString();
    return this.finance.store.write(async repository => {
      const row = await repository.get('transactions', id);
      await repository.remove('transactions', id);
      if (row.occurrenceId) await repository.update('expense_occurrences', row.occurrenceId, { status: 'pending', updatedAt: at });
    });
  }
  favorite(id: number, isFavorite: boolean) {
    ensure(typeof isFavorite === 'boolean', 'Favorito inválido.');
    return this.finance.store.write(repository => repository.update('transactions', id, { isFavorite, updatedAt: this.finance.clock().toISOString() }));
  }
  async buildDraftFromFavorite(id: number) {
    const context = await this.finance.context();
    return this.finance.store.read(async repository => {
      const transaction = await repository.get('transactions', id);
      ensure(transaction.isFavorite, 'Movimentação não é favorita.', 'CONFLICT');
      const category = await repository.get('categories', transaction.categoryId);
      return { description: transaction.description, type: transaction.type, amountCents: transaction.amountCents, date: context.date, observation: transaction.observation, categoryId: category.isArchived ? null : category.id, requiresCategory: category.isArchived, isFavorite: false };
    });
  }
  async duplicate(id: number, key: string) {
    const row = await this.get(id);
    const context = await this.finance.context();
    return this.create({ description: row.description, type: row.type, categoryId: row.categoryId, amountCents: row.amountCents, date: context.date, observation: row.observation, isFavorite: false }, key);
  }
  async list(filters: TransactionFilters = {}) {
    ensure(!filters.type || ['income', 'expense'].includes(filters.type), 'Tipo inválido.');
    if (filters.start) dateOnly(filters.start);
    if (filters.end) dateOnly(filters.end);
    ensure(!filters.start || !filters.end || filters.start < filters.end, 'Período inválido.');
    ensure(Number.isInteger(filters.limit ?? 50) && (filters.limit ?? 50) >= 1 && (filters.limit ?? 50) <= 100 && Number.isSafeInteger(filters.offset ?? 0) && (filters.offset ?? 0) >= 0, 'Paginação inválida.');
    ensure(!filters.categoryIds || filters.categoryIds.every(id => Number.isSafeInteger(id) && id > 0), 'Categorias inválidas.');
    ensure(filters.search === undefined || (typeof filters.search === 'string' && filters.search.length <= 200), 'Busca inválida.');
    return this.finance.store.read(async repository => {
      const result = await repository.filteredTransactions(filters);
      return { items: result.items, total: result.all.length, limit: filters.limit ?? 50, offset: filters.offset ?? 0, incomeCents: sum(result.all.filter(row => row.type === 'income').map(row => row.amountCents)), expenseCents: sum(result.all.filter(row => row.type === 'expense').map(row => row.amountCents)) };
    });
  }
  filterPreset(preset: 'today' | 'week' | 'month' | 'previousMonth' | 'custom', custom?: { start: string; inclusiveEnd: string }) { return this.finance.filterPreset(preset, custom); }
}
