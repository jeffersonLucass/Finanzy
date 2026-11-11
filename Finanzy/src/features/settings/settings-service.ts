import { AppError, ensure } from '../../domain/core';
import { KeyValueStore } from '../../infrastructure/storage/port';

export type Settings = { version: 1; theme: 'light' | 'dark' | 'system'; currency: 'BRL'; monthStartDay: number; notificationsEnabled: boolean; reminderHour: number; timezone: string; isSessionActive: boolean };
export const defaultSettings: Settings = { version: 1, theme: 'system', currency: 'BRL', monthStartDay: 1, notificationsEnabled: false, reminderHour: 9, timezone: 'America/Sao_Paulo', isSessionActive: false };
const SETTINGS_KEY = 'finanzy:settings:v1';

function validateSettings(value: Settings) {
  ensure(value.version === 1 && ['light', 'dark', 'system'].includes(value.theme) && value.currency === 'BRL', 'Preferência inválida.');
  ensure(Number.isInteger(value.monthStartDay) && value.monthStartDay >= 1 && value.monthStartDay <= 28, 'Início do mês inválido.');
  ensure(Number.isInteger(value.reminderHour) && value.reminderHour >= 0 && value.reminderHour <= 23, 'Horário inválido.');
  ensure(typeof value.notificationsEnabled === 'boolean' && typeof value.isSessionActive === 'boolean', 'Preferência inválida.');
  try { new Intl.DateTimeFormat('en', { timeZone: value.timezone }).format(); } catch { throw new AppError('VALIDATION_ERROR', 'Fuso inválido.'); }
}

export class SettingsService {
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();
  constructor(private readonly storage: KeyValueStore) {}
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  async get(): Promise<Settings> {
    try {
      const raw = await this.storage.getItem(SETTINGS_KEY);
      if (!raw) return { ...defaultSettings };
      try { const value = JSON.parse(raw) as Settings; validateSettings(value); return { ...defaultSettings, ...value }; } catch { return { ...defaultSettings }; }
    } catch { throw new AppError('STORAGE_ERROR', 'Não foi possível carregar suas preferências.'); }
  }
  update(patch: Partial<Omit<Settings, 'version'>>) {
    const task = this.queue.then(async () => {
      const value = { ...await this.get(), ...patch }; validateSettings(value);
      try { await this.storage.setItem(SETTINGS_KEY, JSON.stringify(value)); } catch { throw new AppError('STORAGE_ERROR', 'Não foi possível salvar suas preferências.'); }
      for (const listener of this.listeners) listener();
      return value;
    });
    this.queue = task.catch(() => undefined);
    return task;
  }
  async reset() {
    await this.queue;
    try { await this.storage.removeItem(SETTINGS_KEY); } catch { throw new AppError('STORAGE_ERROR', 'Não foi possível redefinir as preferências.'); }
    for (const listener of this.listeners) listener();
  }
}
