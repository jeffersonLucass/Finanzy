import { AppError, Clock, dateOnly, ensure, text } from '../../domain/core';
import { Holiday } from '../../domain/models';
import { HttpClient } from '../../infrastructure/http/client';
import { FinanceStore } from '../../infrastructure/storage/repositories/finance-repository';
export type HolidayResult = { items: Holiday[]; source: 'network' | 'cache'; stale: boolean; fetchedAt: string };
export function validateHolidays(payload: unknown, year: number): Holiday[] {
  ensure(Array.isArray(payload), 'Resposta de feriados inválida.', 'NETWORK_ERROR');
  return payload.map((item: unknown) => {
    ensure(typeof item === 'object' && item !== null, 'Feriado inválido.', 'NETWORK_ERROR');
    const row = item as Record<string, unknown>;
    ensure(typeof row.date === 'string' && typeof row.name === 'string' && typeof row.type === 'string', 'Feriado inválido.', 'NETWORK_ERROR');
    const date = dateOnly(row.date); ensure(date.startsWith(`${year}-`), 'Ano do feriado inválido.', 'NETWORK_ERROR');
    return { date, name: text(row.name), type: text(row.type) };
  });
}
type InFlight = { promise: Promise<HolidayResult>; controller: AbortController; users: number };
export class HolidayService {
  private pending = new Map<number, InFlight>();
  constructor(private readonly store: FinanceStore, private readonly http: HttpClient, private readonly clock: Clock = () => new Date()) {}
  async get(year: number, signal?: AbortSignal): Promise<HolidayResult> {
    ensure(Number.isInteger(year) && year >= 1900 && year <= 2199, 'Ano deve estar entre 1900 e 2199.');
    if (signal?.aborted) throw new AppError('NETWORK_ERROR', 'Requisição cancelada.');
    const cache = await this.store.read(repo => repo.holidayCache(year));
    let cached: { items: Holiday[]; fetchedAt: string } | null = null;
    if (cache) {
      try { cached = { items: validateHolidays(JSON.parse(cache.payload), year), fetchedAt: cache.fetchedAt }; } catch { cached = null; }
    }
    if (cached && this.clock().getTime() - Date.parse(cached.fetchedAt) < 86_400_000) return { ...cached, source: 'cache', stale: false };
    let flight = this.pending.get(year);
    if (!flight) {
      const controller = new AbortController();
      const promise = this.fetchYear(year, controller.signal, cached).finally(() => { if (this.pending.get(year)?.controller === controller) this.pending.delete(year); });
      flight = { controller, promise, users: 0 }; this.pending.set(year, flight);
    }
    const current = flight; current.users++;
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = () => { settled = true; signal?.removeEventListener('abort', cancel); current.users--; };
      const cancel = () => { if (settled) return; finish(); if (!current.users) current.controller.abort(); reject(new AppError('NETWORK_ERROR', 'Requisição cancelada.')); };
      signal?.addEventListener('abort', cancel, { once: true });
      if (signal?.aborted) { cancel(); return; }
      current.promise.then(value => { if (!settled) { finish(); resolve(value); } }, error => { if (!settled) { finish(); reject(error); } });
    });
  }
  private async fetchYear(year: number, signal: AbortSignal, cached: { items: Holiday[]; fetchedAt: string } | null): Promise<HolidayResult> {
    try {
      const items = validateHolidays(await this.http.getJson(`https://brasilapi.com.br/api/feriados/v1/${year}`, signal), year);
      if (signal.aborted) throw new AppError('NETWORK_ERROR', 'Requisição cancelada.');
      const fetchedAt = this.clock().toISOString();
      await this.store.write(repo => repo.putHolidays(year, JSON.stringify(items), fetchedAt), false);
      return { items, source: 'network', stale: false, fetchedAt };
    } catch (error) {
      if (signal.aborted) throw error;
      if (cached) return { ...cached, source: 'cache', stale: true };
      throw error instanceof AppError ? error : new AppError('NETWORK_ERROR', 'Não foi possível consultar os feriados.');
    }
  }
}
