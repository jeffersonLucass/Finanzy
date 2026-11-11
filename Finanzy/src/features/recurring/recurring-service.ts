import { dateOnly, dueDate, ensure, money, monthOnly, shiftMonth, sum, text } from '../../domain/core';
import { ExpenseOccurrence, RecurringExpense, RecurringInput } from '../../domain/models';
import { FinanceRepository } from '../../infrastructure/storage/repositories/finance-repository';
import { FinanceContext, Snapshot, compatibleCategory } from '../../application/finance-context';

export type ProjectedOccurrence = Omit<ExpenseOccurrence, 'id' | 'createdAt' | 'updatedAt'> & { id: number | null };
export function projectOccurrences(snapshot: Snapshot, start: string, end: string): ProjectedOccurrence[] {
  const result: ProjectedOccurrence[] = [];
  for (const rule of snapshot.recurring) {
    for (let month = rule.startMonth, index = 1; month < end; month = shiftMonth(month, 1), index++) {
      if (rule.kind === 'installment' && index > rule.installmentCount!) break;
      if (month < start) continue;
      const existing = snapshot.occurrences.find(o => o.recurringExpenseId === rule.id && o.referenceMonth === month);
      if (existing) { result.push(existing); continue; }
      if (rule.cancelledFromMonth && month >= rule.cancelledFromMonth) continue;
      result.push({ id: null, recurringExpenseId: rule.id, referenceMonth: month, dueDate: dueDate(month, rule.dueDay), amountCents: rule.amountCents, name: rule.name, categoryId: rule.categoryId, installmentNumber: rule.kind === 'installment' ? index : null, status: 'pending' });
    }
  }
  for (const o of snapshot.occurrences) if (o.referenceMonth >= start && o.referenceMonth < end && !result.some(r => r.id === o.id)) result.push(o);
  return result.sort((a,b) => a.dueDate.localeCompare(b.dueDate) || a.recurringExpenseId - b.recurringExpenseId);
}
async function materializeRule(repo: FinanceRepository, rule: RecurringExpense, throughMonth: string, at: string) {
  const existing = await repo.list('expense_occurrences', { recurringExpenseId: rule.id });
  for (let month = rule.startMonth, index = 1; month <= throughMonth; month = shiftMonth(month, 1), index++) {
    if ((rule.kind === 'installment' && index > rule.installmentCount!) || (rule.cancelledFromMonth && month >= rule.cancelledFromMonth)) break;
    if (existing.some(o => o.referenceMonth === month)) continue;
    await repo.insert('expense_occurrences', { recurringExpenseId: rule.id, referenceMonth: month, dueDate: dueDate(month, rule.dueDay), amountCents: rule.amountCents, name: rule.name, categoryId: rule.categoryId, installmentNumber: rule.kind === 'installment' ? index : null, status: 'pending', createdAt: at, updatedAt: at });
  }
}
export class RecurringService {
  constructor(private readonly finance: FinanceContext) {}
  private validate(input: RecurringInput) {
    ensure(['subscription','installment'].includes(input.kind), 'Tipo de gasto inválido.'); money(input.amountCents); monthOnly(input.startMonth); dueDate(input.startMonth, input.dueDay);
    ensure(input.kind === 'subscription' ? input.installmentCount === null : Number.isSafeInteger(input.installmentCount) && input.installmentCount! > 0 && input.installmentCount! <= 3600, 'Quantidade de parcelas inválida.');
    if (input.installmentCount) money(input.amountCents * input.installmentCount);
    return { ...input, name: text(input.name) };
  }
  async create(input: RecurringInput, key: string) {
    const valid = this.validate(input); const ctx = await this.finance.context();
    return this.finance.store.write(repo => repo.command(key, JSON.stringify(['recurring:create', valid]), async () => {
      await compatibleCategory(repo, valid.categoryId, 'expense');
      const rule = await repo.insert('recurring_expenses', { ...valid, cancelledFromMonth: null, createdAt: ctx.at, updatedAt: ctx.at });
      await materializeRule(repo, rule, shiftMonth(ctx.date.slice(0,7), 1), ctx.at); return rule;
    }));
  }
  async list(kind?: RecurringExpense['kind']) { ensure(!kind || ['subscription','installment'].includes(kind), 'Tipo inválido.'); return this.finance.store.read(repo => repo.list('recurring_expenses', kind ? { kind } : {})); }
  async occurrence(id: number) {
    const snapshot = await this.finance.snapshot();
    const occurrence = snapshot.occurrences.find(item => item.id === id);
    ensure(occurrence, 'Vencimento não encontrado.', 'NOT_FOUND');
    const rule = snapshot.recurring.find(item => item.id === occurrence.recurringExpenseId);
    ensure(rule, 'Gasto mensal não encontrado.', 'NOT_FOUND');
    return { occurrence, rule };
  }
  async details(id: number) {
    const snapshot = await this.finance.snapshot(); const rule = snapshot.recurring.find(r => r.id === id); ensure(rule, 'Gasto não encontrado.', 'NOT_FOUND');
    const end = rule.kind === 'installment' ? shiftMonth(rule.startMonth, rule.installmentCount!) : shiftMonth((await this.finance.context()).date.slice(0,7), 2);
    const occurrences = projectOccurrences(snapshot, rule.startMonth, end).filter(o => o.recurringExpenseId === id);
    const paidCents = sum(occurrences.filter(o => o.status === 'paid').map(o => o.amountCents));
    const totalCents = rule.kind === 'installment' ? money(rule.amountCents * rule.installmentCount!) : null;
    return { ...rule, occurrences, paidCents, totalCents, remainingCents: totalCents === null ? null : sum([totalCents, -paidCents]), lastMonth: rule.kind === 'installment' ? shiftMonth(rule.startMonth, rule.installmentCount! - 1) : null };
  }
  async reconcile(throughMonth?: string) {
    const ctx = await this.finance.context(); const end = monthOnly(throughMonth ?? shiftMonth(ctx.date.slice(0,7), 1));
    await this.finance.store.write(async repo => { for (const rule of await repo.list('recurring_expenses')) await materializeRule(repo, rule, end, ctx.at); }, false);
  }
  async update(id: number, input: RecurringInput, effectiveMonth: string) {
    const valid = this.validate(input); monthOnly(effectiveMonth); const ctx = await this.finance.context();
    return this.finance.store.write(async repo => {
      const current = await repo.get('recurring_expenses', id); ensure(!current.cancelledFromMonth, 'Gasto cancelado.', 'CONFLICT');
      ensure(current.kind === valid.kind, 'Não é possível trocar o tipo.', 'CONFLICT');
      await compatibleCategory(repo, valid.categoryId, 'expense', current.categoryId);
      if (current.kind === 'installment') {
        const existing = await repo.list('expense_occurrences', { recurringExpenseId: id });
        ensure(!existing.some(o => o.status === 'paid'), 'Parcelamento já possui pagamentos. Cancele o restante e crie outro.', 'CONFLICT');
        for (const o of existing) await repo.remove('expense_occurrences', o.id);
      } else {
        ensure(valid.startMonth === current.startMonth && effectiveMonth >= current.startMonth, 'Informe a competência efetiva sem alterar o início.');
        await materializeRule(repo, current, shiftMonth(effectiveMonth, -1), ctx.at);
        for (const o of await repo.list('expense_occurrences', { recurringExpenseId: id })) if (o.referenceMonth >= effectiveMonth && o.status === 'pending') await repo.update('expense_occurrences', o.id, { amountCents: valid.amountCents, name: valid.name, categoryId: valid.categoryId, dueDate: dueDate(o.referenceMonth, valid.dueDay), updatedAt: ctx.at });
      }
      const rule = await repo.update('recurring_expenses', id, { ...valid, startMonth: current.kind === 'subscription' ? effectiveMonth : valid.startMonth, updatedAt: ctx.at });
      await materializeRule(repo, rule, shiftMonth(ctx.date.slice(0,7),1), ctx.at); return rule;
    });
  }
  async cancel(id: number, fromMonth: string) {
    monthOnly(fromMonth); const ctx = await this.finance.context();
    return this.finance.store.write(async repo => {
      const current = await repo.get('recurring_expenses', id); ensure(fromMonth >= current.startMonth, 'Competência anterior ao início.');
      const cancelledFromMonth = current.cancelledFromMonth && current.cancelledFromMonth < fromMonth ? current.cancelledFromMonth : fromMonth;
      await materializeRule(repo, current, shiftMonth(cancelledFromMonth, -1), ctx.at);
      const result = await repo.update('recurring_expenses', id, { cancelledFromMonth, updatedAt: ctx.at });
      for (const o of await repo.list('expense_occurrences', { recurringExpenseId: id })) if (o.referenceMonth >= cancelledFromMonth && o.status === 'pending') await repo.update('expense_occurrences', o.id, { status: 'cancelled', updatedAt: ctx.at });
      return result;
    });
  }
  async payOccurrence(id: number, paidAt: string, key: string) {
    dateOnly(paidAt); const ctx = await this.finance.context(); ensure(paidAt <= ctx.date, 'Pagamento não pode ter data futura.');
    return this.finance.store.write(repo => repo.command(key, JSON.stringify(['occurrence:pay', id, paidAt]), async () => {
      const o = await repo.get('expense_occurrences', id); ensure(o.status !== 'cancelled', 'Ocorrência cancelada.', 'CONFLICT');
      if (o.status === 'paid') { const row = (await repo.list('transactions', { occurrenceId: id }))[0]; ensure(row, 'Pagamento inconsistente.', 'STORAGE_ERROR'); return row; }
      const row = await repo.insert('transactions', { description: o.name, categoryId: o.categoryId, type: 'expense', amountCents: o.amountCents, date: paidAt, observation: null, isFavorite: false, occurrenceId: id, operationKey: key, createdAt: ctx.at, updatedAt: ctx.at });
      await repo.update('expense_occurrences', id, { status: 'paid', updatedAt: ctx.at });
      await this.finance.recordBudgetAlerts(repo, ctx.settings, ctx.date, periodAtPayment(paidAt, ctx.settings.monthStartDay)); return row;
    }));
  }
  async undoPayment(id: number, key: string) {
    const ctx = await this.finance.context();
    return this.finance.store.write(repo => repo.command(key, JSON.stringify(['occurrence:undo', id]), async () => {
      const o = await repo.get('expense_occurrences', id);
      const row = (await repo.list('transactions', { occurrenceId: id }))[0];
      if (row) await repo.remove('transactions', row.id);
      if (o.status === 'paid') await repo.update('expense_occurrences', id, { status: 'pending', updatedAt: ctx.at });
      return { occurrenceId: id, status: o.status === 'cancelled' ? 'cancelled' : 'pending' };
    }));
  }
}
function periodAtPayment(date: string, day: number) { return Number(date.slice(-2)) < day ? shiftMonth(date.slice(0,7), -1) : date.slice(0,7); }
