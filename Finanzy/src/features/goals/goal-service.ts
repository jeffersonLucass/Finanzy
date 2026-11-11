import { dateOnly, ensure, money, sum, text } from '../../domain/core';
import { GoalInput } from '../../domain/models';
import { normalizeIcon } from '../../domain/icons';
import { FinanceContext, balances, loadSnapshot } from '../../application/finance-context';

export class GoalService {
  constructor(private readonly finance: FinanceContext) {}
  private validate(input: GoalInput) {
    money(input.targetCents);
    if (input.deadline) dateOnly(input.deadline);
    return { name: text(input.name), targetCents: input.targetCents, deadline: input.deadline || null, icon: normalizeIcon(input.icon, 'target') };
  }
  async create(input: GoalInput, savedCents: number, key: string) {
    const valid = this.validate(input);
    money(savedCents, true);
    const context = await this.finance.context();
    return this.finance.store.write(repository => repository.command(key, JSON.stringify(['goal:create', valid, savedCents]), async () => {
      if (savedCents) ensure(balances(await loadSnapshot(repository), context.date).availableCents >= savedCents, 'Saldo disponível insuficiente.', 'INSUFFICIENT_FUNDS');
      const goal = await repository.insert('goals', { ...valid, isArchived: false, createdAt: context.at, updatedAt: context.at });
      if (savedCents) await repository.insert('goal_movements', { goalId: goal.id, kind: 'opening', amountCents: savedCents, date: context.date, operationKey: key, createdAt: context.at, updatedAt: context.at });
      return { ...goal, savedCents };
    }));
  }
  async update(id: number, input: GoalInput) {
    const valid = this.validate(input);
    return this.finance.store.write(async repository => {
      const current = await repository.get('goals', id);
      ensure(!current.isArchived, 'Meta arquivada.', 'CONFLICT');
      return repository.update('goals', id, { ...valid, updatedAt: this.finance.clock().toISOString() });
    });
  }
  async updateWithSaved(id: number, input: GoalInput, savedCents: number, key: string) {
    const valid = this.validate(input);
    money(savedCents, true);
    const context = await this.finance.context();
    return this.finance.store.write(repository => repository.command(key, JSON.stringify(['goal:update', id, valid, savedCents]), async () => {
      const snapshot = await loadSnapshot(repository);
      const current = snapshot.goals.find(goal => goal.id === id);
      ensure(current, 'Meta não encontrada.', 'NOT_FOUND');
      ensure(!current.isArchived, 'Meta arquivada.', 'CONFLICT');
      const difference = savedCents - current.savedCents;
      if (difference > 0) ensure(balances(snapshot, context.date).availableCents >= difference, 'Saldo disponível insuficiente.', 'INSUFFICIENT_FUNDS');
      if (difference !== 0) await repository.insert('goal_movements', { goalId: id, kind: difference > 0 ? 'deposit' : 'withdrawal', amountCents: Math.abs(difference), date: context.date, operationKey: key, createdAt: context.at, updatedAt: context.at });
      const goal = await repository.update('goals', id, { ...valid, updatedAt: context.at });
      return { ...goal, savedCents };
    }));
  }
  async list() { return (await this.finance.snapshot()).goals.filter(goal => !goal.isArchived); }
  async get(id: number) {
    const goal = (await this.finance.snapshot()).goals.find(item => item.id === id);
    ensure(goal, 'Meta não encontrada.', 'NOT_FOUND');
    return { ...goal, remainingCents: Math.max(0, sum([goal.targetCents, -goal.savedCents])), percent: goal.savedCents / goal.targetCents * 100 };
  }
  async move(id: number, kind: 'deposit' | 'withdrawal', amountCents: number, key: string, date?: string) {
    money(amountCents);
    ensure(kind === 'deposit' || kind === 'withdrawal', 'Movimento inválido.');
    const context = await this.finance.context();
    const movementDate = dateOnly(date ?? context.date);
    ensure(movementDate <= context.date, 'Não é possível reservar em uma data futura.');
    return this.finance.store.write(repository => repository.command(key, JSON.stringify(['goal:move', id, kind, amountCents, movementDate]), async () => {
      const snapshot = await loadSnapshot(repository);
      const goal = snapshot.goals.find(item => item.id === id);
      ensure(goal, 'Meta não encontrada.', 'NOT_FOUND');
      ensure(!goal.isArchived, 'Meta arquivada.', 'CONFLICT');
      ensure(kind === 'deposit' ? balances(snapshot, context.date).availableCents >= amountCents : goal.savedCents >= amountCents, kind === 'deposit' ? 'Saldo disponível insuficiente.' : 'Valor guardado insuficiente.', 'INSUFFICIENT_FUNDS');
      const movement = await repository.insert('goal_movements', { goalId: id, kind, amountCents, date: movementDate, operationKey: key, createdAt: context.at, updatedAt: context.at });
      await repository.update('goals', id, { updatedAt: context.at });
      return movement;
    }));
  }
  archive(id: number) { return this.finance.store.write(repository => repository.update('goals', id, { isArchived: true, updatedAt: this.finance.clock().toISOString() })); }
}
