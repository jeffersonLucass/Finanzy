import { ensure, normalizeName, text } from '../../domain/core';
import { Category, TransactionType } from '../../domain/models';
import { normalizeIcon } from '../../domain/icons';
import { FinanceContext, loadSnapshot } from '../../application/finance-context';

export class CategoryService {
  constructor(private readonly finance: FinanceContext) {}
  async list(type?: TransactionType, includeArchived = false) {
    if (type) ensure(type === 'income' || type === 'expense', 'Tipo inválido.');
    return this.finance.store.read(async repository => (await repository.list('categories')).filter(category => (!type || category.type === type) && (includeArchived || !category.isArchived)).sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')));
  }
  async findOrCreate(name: string, type: TransactionType) {
    const categories = await this.list(type, true);
    const current = categories.find(category => category.normalizedName === normalizeName(name));
    if (current && !current.isArchived) return current;
    ensure(!current, 'A categoria selecionada está arquivada.', 'CONFLICT');
    return this.save({ name, type, icon: 'package', color: '#10B981' });
  }
  async save(input: Pick<Category, 'name' | 'type' | 'icon' | 'color'>, id?: number) {
    const at = this.finance.clock().toISOString();
    const name = text(input.name);
    ensure(['income', 'expense'].includes(input.type), 'Tipo inválido.');
    ensure(/^#[0-9a-fA-F]{6}$/.test(input.color), 'Use uma cor hexadecimal válida.');
    const values = { name, normalizedName: normalizeName(name), type: input.type, icon: normalizeIcon(input.icon), color: input.color, updatedAt: at };
    return this.finance.store.write(async repository => {
      if (!id) return repository.insert('categories', { ...values, isArchived: false, createdAt: at });
      const current = await repository.get('categories', id);
      if (current.type !== values.type) {
        const snapshot = await loadSnapshot(repository);
        ensure(!snapshot.transactions.some(transaction => transaction.categoryId === id) && !snapshot.budgets.some(budget => budget.categoryId === id) && !snapshot.recurring.some(recurring => recurring.categoryId === id) && !snapshot.occurrences.some(occurrence => occurrence.categoryId === id), 'Categoria em uso não pode trocar de tipo.', 'CONFLICT');
      }
      return repository.update('categories', id, values);
    });
  }
  archive(id: number) { return this.finance.store.write(repository => repository.update('categories', id, { isArchived: true, updatedAt: this.finance.clock().toISOString() })); }
}
