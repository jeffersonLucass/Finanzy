import { AppError, addDays, ensure, zonedInstant } from '../../domain/core';
import { NotificationRecord } from '../../domain/models';
import { FinanceContext } from '../../application/finance-context';
import { RecurringService } from '../recurring/recurring-service';
export type Destination = { screen: 'budgets' } | { screen: 'occurrence'; id: number };
export type Notice = { title: string; body: string; destination: Destination };
export type ScheduledNotice = { id: string; key: string };
export interface NotificationAdapter {
  supported: boolean;
  permission(request: boolean): Promise<boolean>;
  list(): Promise<ScheduledNotice[]>;
  schedule(key: string, at: Date, notice: Notice): Promise<string>;
  cancel(id: string): Promise<void>;
  listen(listener: (destination: Destination) => void): () => void;
}
export class NotificationService {
  private listeners = new Set<(notice: Notice) => void>();
  private pendingFeedback: Notice | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly finance: FinanceContext, private readonly recurring: RecurringService, public readonly adapter: NotificationAdapter) {}
  subscribeFeedback(listener: (notice: Notice) => void) {
    this.listeners.add(listener);
    if (this.pendingFeedback) { listener(this.pendingFeedback); this.pendingFeedback = null; }
    return () => { this.listeners.delete(listener); };
  }
  async enable(enabled: boolean) {
    ensure(typeof enabled === 'boolean', 'Preferência inválida.');
    if (enabled) {
      if (!this.adapter.supported) throw new AppError('UNSUPPORTED_PLATFORM', 'Lembretes nativos estão disponíveis em Android/iOS.');
      if (!await this.adapter.permission(true)) { await this.finance.settings.update({ notificationsEnabled: false }); throw new AppError('PERMISSION_DENIED', 'Permissão de notificações não concedida.'); }
    }
    await this.finance.settings.update({ notificationsEnabled: enabled }); await this.reconcile();
  }
  reconcile() {
    const task = this.queue.then(() => this.performReconcile()); this.queue = task.catch(() => undefined); return task;
  }
  private async performReconcile() {
    const ctx = await this.finance.context();
    await this.recurring.reconcile();
    const allowed = this.adapter.supported && ctx.settings.notificationsEnabled && await this.adapter.permission(false);
    const native = this.adapter.supported ? await this.adapter.list() : [];
    const records = await this.finance.store.read(repo => repo.notificationRecords());
    const pendingBudgets = records.filter(r => r.kind === 'budget' && r.state === 'pending');
    for (const record of pendingBudgets) {
      const notice = JSON.parse(record.payload) as Notice;
      await this.finance.store.write(repo => repo.putNotification({ ...record, state: 'handled' }), false);
      if (!this.listeners.size) this.pendingFeedback = notice;
      for (const listener of this.listeners) listener(notice);
      if (allowed) await this.finance.store.write(repo => repo.putNotification({ ...record, logicalKey: `${record.logicalKey}:delivery`, kind: 'budget', state: 'scheduled', scheduledAt: new Date(this.finance.clock().getTime() + 1000).toISOString() }), false);
    }
    const snapshot = await this.finance.snapshot();
    const candidates = snapshot.occurrences.filter(o => o.status === 'pending' && o.dueDate >= ctx.date && o.dueDate < addDays(ctx.date, 30)).map(o => {
      const at = zonedInstant(o.dueDate, ctx.settings.reminderHour, ctx.settings.timezone);
      return { o, at, key: `reminder:${o.id}:${at.toISOString()}:${ctx.settings.timezone}` };
    }).filter(c => c.at.getTime() > this.finance.clock().getTime()).sort((a,b) => a.at.getTime() - b.at.getTime() || a.o.id - b.o.id).slice(0,30);
    const desired: NotificationRecord[] = allowed ? candidates.map(({ o, at, key }) => ({ logicalKey: key, kind: 'reminder', occurrenceId: o.id, scheduledAt: at.toISOString(), nativeId: null, state: 'pending', payload: JSON.stringify({ title: 'Vencimento', body: `${o.name} vence hoje.`, destination: { screen: 'occurrence', id: o.id } }) })) : [];
    const latest = await this.finance.store.read(repo => repo.notificationRecords());
    if (allowed) desired.push(...latest.filter(r => r.kind === 'budget' && r.state === 'scheduled'));
    const keys = new Set(desired.map(r => r.logicalKey));
    for (const n of native) if (!keys.has(n.key)) await this.adapter.cancel(n.id);
    for (const record of latest) if ((record.kind === 'reminder' || record.state === 'scheduled') && !keys.has(record.logicalKey)) await this.finance.store.write(repo => repo.removeNotification(record.logicalKey), false);
    for (const record of desired) {
      const found = native.filter(n => n.key === record.logicalKey);
      for (const duplicate of found.slice(1)) await this.adapter.cancel(duplicate.id);
      let id = found[0]?.id;
      if (!id) {
        if (record.kind === 'budget' && record.nativeId) { await this.finance.store.write(repo => repo.putNotification({ ...record, state: 'handled' }), false); continue; }
        const at = new Date(record.scheduledAt!);
        if (record.kind === 'budget' && at.getTime() <= this.finance.clock().getTime()) at.setTime(this.finance.clock().getTime() + 1000);
        await this.finance.store.write(repo => repo.putNotification(record), false);
        id = await this.adapter.schedule(record.logicalKey, at, JSON.parse(record.payload) as Notice);
      }
      await this.finance.store.write(repo => repo.putNotification({ ...record, nativeId: id, state: 'scheduled' }), false);
    }
    await this.finance.store.write(repo => repo.setDirty(false), false);
  }
  async cancelAll() {
    await this.queue;
    if (this.adapter.supported) for (const item of await this.adapter.list()) await this.adapter.cancel(item.id);
  }
}
