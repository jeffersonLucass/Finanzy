import { money, periodAt } from '../../domain/core';
import { FinanceContext, budgetSummary, compatibleCategory, loadSnapshot } from '../../application/finance-context';

export class BudgetService {
  constructor(private readonly finance: FinanceContext) {}
  async save(categoryId: number, limitCents: number, id?: number) {
    money(limitCents);
    const at = this.finance.clock().toISOString();
    return this.finance.store.write(async repository => {
      const current = id ? await repository.get('budgets', id) : null;
      await compatibleCategory(repository, categoryId, 'expense', current?.categoryId);
      return current ? repository.update('budgets', current.id, { categoryId, limitCents, updatedAt: at }) : repository.insert('budgets', { categoryId, limitCents, createdAt: at, updatedAt: at });
    });
  }
  remove(id: number) { return this.finance.store.write(repository => repository.remove('budgets', id)); }
  async list(period?: string) {
    const context = await this.finance.context();
    return this.finance.store.read(async repository => budgetSummary(await loadSnapshot(repository), period ?? periodAt(context.date, context.settings.monthStartDay), context.settings, context.date));
  }
}
