import { AppError, ensure } from '../../../domain/core';
import { Budget, Category, ExpenseOccurrence, GoalMovement, NotificationRecord, Profile, RecurringExpense, Transaction, TransactionFilters } from '../../../domain/models';
import { SqlConnection, SqlDatabase, SqlValue } from '../port';
import { seedCategories } from '../seeds';

type GoalRow = Omit<import('../../../domain/models').Goal, 'savedCents'>;
export type Tables = { profile: Profile; categories: Category; transactions: Transaction; budgets: Budget; goals: GoalRow; goal_movements: GoalMovement; recurring_expenses: RecurringExpense; expense_occurrences: ExpenseOccurrence };
export type Table = keyof Tables;
const columns: Record<Table, string> = {
  profile: 'id,name,createdAt,updatedAt', categories: 'id,name,normalizedName,type,icon,color,isArchived,createdAt,updatedAt',
  transactions: 'id,description,categoryId,type,amountCents,date,observation,isFavorite,occurrenceId,operationKey,createdAt,updatedAt',
  budgets: 'id,categoryId,limitCents,createdAt,updatedAt', goals: 'id,name,targetCents,deadline,icon,isArchived,createdAt,updatedAt',
  goal_movements: 'id,goalId,kind,amountCents,date,operationKey,createdAt,updatedAt',
  recurring_expenses: 'id,kind,name,categoryId,amountCents,dueDay,startMonth,installmentCount,cancelledFromMonth,createdAt,updatedAt',
  expense_occurrences: 'id,recurringExpenseId,referenceMonth,dueDate,amountCents,name,categoryId,installmentNumber,status,createdAt,updatedAt',
};
const bind = (value: unknown): SqlValue => { ensure(value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean', 'Valor de persistência inválido.'); return typeof value === 'boolean' ? Number(value) : value; };
function decode<T>(row: T): T {
  const copy = { ...row } as Record<string, unknown>;
  for (const key of ['isArchived', 'isFavorite']) if (key in copy) copy[key] = copy[key] === 1;
  return copy as T;
}
export class FinanceRepository {
  constructor(private readonly db: SqlConnection) {}
  async list<K extends Table>(table: K, where: Partial<Tables[K]> = {}): Promise<Tables[K][]> {
    const keys = Object.keys(where);
    this.validateKeys(table, keys);
    const rows = await this.db.all<Tables[K]>(`SELECT ${columns[table]} FROM ${table}${keys.length ? ` WHERE ${keys.map(k => `${k} IS ?`).join(' AND ')}` : ''} ORDER BY id DESC`, Object.values(where).map(bind));
    return rows.map(decode);
  }
  async get<K extends Table>(table: K, id: number): Promise<Tables[K]> {
    ensure(Number.isSafeInteger(id) && id > 0, 'Identificador inválido.');
    const row = (await this.list(table, { id } as Partial<Tables[K]>))[0];
    ensure(row, 'Registro não encontrado.', 'NOT_FOUND'); return row;
  }
  async insert<K extends Table>(table: K, values: Partial<Tables[K]>): Promise<Tables[K]> {
    const keys = Object.keys(values); this.validateKeys(table, keys);
    const result = await this.db.run(`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`, Object.values(values).map(bind));
    return this.get(table, result.lastInsertRowId);
  }
  async update<K extends Table>(table: K, id: number, values: Partial<Tables[K]>): Promise<Tables[K]> {
    await this.get(table, id);
    const keys = Object.keys(values); this.validateKeys(table, keys);
    ensure(!keys.includes('id') && !keys.includes('createdAt'), 'Não é possível alterar a identidade do registro.');
    if (keys.length) await this.db.run(`UPDATE ${table} SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`, [...Object.values(values).map(bind), id]);
    return this.get(table, id);
  }
  async remove(table: Table, id: number) { await this.get(table, id); await this.db.run(`DELETE FROM ${table} WHERE id=?`, [id]); }
  private validateKeys(table: Table, keys: string[]) { ensure(keys.every(k => columns[table].split(',').includes(k)), 'Campo de persistência inválido.'); }
  async filteredTransactions(filters: TransactionFilters) {
    const clauses: string[] = []; const values: SqlValue[] = [];
    const condition = (sql: string, ...params: SqlValue[]) => { clauses.push(sql); values.push(...params); };
    if (filters.type) condition('t.type=?', filters.type);
    if (filters.start) condition('t.date>=?', filters.start);
    if (filters.end) condition('t.date<?', filters.end);
    if (filters.favoritesOnly) condition('t.isFavorite=1');
    if (filters.categoryIds?.length) condition(`t.categoryId IN(${filters.categoryIds.map(() => '?').join(',')})`, ...filters.categoryIds);
    if (filters.search) {
      const search = `%${filters.search.replace(/[\\%_]/g, c => `\\${c}`)}%`;
      condition("(t.description LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\')", search, search);
    }
    const query = ` FROM transactions t JOIN categories c ON c.id=t.categoryId${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''}`;
    const all = await this.db.all<{ amountCents: number; type: 'income' | 'expense' }>(`SELECT t.amountCents,t.type${query}`, values);
    const items = await this.db.all<Transaction>(`SELECT ${columns.transactions.split(',').map(c => `t.${c}`).join(',')}${query} ORDER BY t.date DESC,t.id DESC LIMIT ? OFFSET ?`, [...values, filters.limit ?? 50, filters.offset ?? 0]);
    return { items: items.map(decode), all };
  }
  async command<T>(key: string, fingerprint: string, work: () => Promise<T>): Promise<T> {
    ensure(typeof key === 'string' && key.trim().length > 0 && key.length <= 200, 'Chave da operação inválida.');
    const existing = (await this.db.all<{ fingerprint: string; result: string }>('SELECT fingerprint,result FROM commands WHERE operationKey=?', [key]))[0];
    if (existing) { ensure(existing.fingerprint === fingerprint, 'Chave já usada em outra operação.', 'CONFLICT'); return JSON.parse(existing.result) as T; }
    const result = await work();
    await this.db.run('INSERT INTO commands(operationKey,fingerprint,result) VALUES(?,?,?)', [key, fingerprint, JSON.stringify(result)]);
    return result;
  }
  async notificationRecords() { return this.db.all<NotificationRecord>('SELECT logicalKey,kind,occurrenceId,scheduledAt,nativeId,state,payload FROM notification_records'); }
  async putNotification(record: NotificationRecord) {
    await this.db.run('INSERT INTO notification_records(logicalKey,kind,occurrenceId,scheduledAt,nativeId,state,payload) VALUES(?,?,?,?,?,?,?) ON CONFLICT(logicalKey) DO UPDATE SET nativeId=excluded.nativeId,state=excluded.state,payload=excluded.payload', [record.logicalKey, record.kind, record.occurrenceId, record.scheduledAt, record.nativeId, record.state, record.payload]);
  }
  async removeNotification(key: string) { await this.db.run('DELETE FROM notification_records WHERE logicalKey=?', [key]); }
  async holidayCache(year: number) { return (await this.db.all<{ payload: string; fetchedAt: string }>('SELECT payload,fetchedAt FROM holiday_cache WHERE year=?', [year]))[0] ?? null; }
  async putHolidays(year: number, payload: string, fetchedAt: string) { await this.db.run('INSERT INTO holiday_cache(year,payload,fetchedAt) VALUES(?,?,?) ON CONFLICT(year) DO UPDATE SET payload=excluded.payload,fetchedAt=excluded.fetchedAt', [year, payload, fetchedAt]); }
  async maintenance() { return (await this.db.all<{ action: 'clear' | 'reset' }>('SELECT action FROM maintenance WHERE id=1'))[0]?.action ?? null; }
  async markMaintenance(action: 'clear' | 'reset') { await this.db.run('INSERT INTO maintenance(id,action) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET action=excluded.action', [action]); }
  async finishMaintenance() { await this.db.run('DELETE FROM maintenance'); }
  async setDirty(dirty: boolean) { await this.db.run('UPDATE sync_state SET dirty=? WHERE id=1', [Number(dirty)]); }
  async clearFinancial() {
    for (const table of ['notification_records','commands','goal_movements','goals','budgets','transactions','expense_occurrences','recurring_expenses']) await this.db.exec(`DELETE FROM ${table}`);
  }
  async resetProfile(at: string) { await this.db.exec('DELETE FROM categories; DELETE FROM profile; DELETE FROM holiday_cache;'); await seedCategories(this.db, at); }
}
export class FinanceStore {
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();
  constructor(private readonly db: SqlDatabase) {}
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  read<T>(work: (repo: FinanceRepository) => Promise<T>) { return this.execute(work, false); }
  write<T>(work: (repo: FinanceRepository) => Promise<T>, notify = true) { return this.execute(work, notify); }
  private execute<T>(work: (repo: FinanceRepository) => Promise<T>, notify: boolean): Promise<T> {
    const task = this.queue.then(() => this.db.transaction(async tx => {
      const repo = new FinanceRepository(tx);
      const result = await work(repo);
      if (notify) await repo.setDirty(true);
      return result;
    })).catch((error: unknown) => {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && /UNIQUE constraint/.test(error.message)) throw new AppError('CONFLICT', 'Já existe um registro com esses dados.');
      throw new AppError('STORAGE_ERROR', 'Não foi possível acessar os dados. Tente novamente.');
    });
    this.queue = task.catch(() => undefined);
    return task.then(value => { if (notify) for (const listener of this.listeners) listener(); return value; });
  }
}
