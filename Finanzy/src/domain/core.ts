export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INSUFFICIENT_FUNDS' | 'STORAGE_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'PERMISSION_DENIED' | 'UNSUPPORTED_PLATFORM';
export class AppError extends Error {
  constructor(public readonly code: ErrorCode, message: string) { super(message); this.name = 'AppError'; }
}
export function ensure(condition: unknown, message: string, code: ErrorCode = 'VALIDATION_ERROR'): asserts condition {
  if (!condition) throw new AppError(code, message);
}
export function money(value: number, allowZero = false) {
  ensure(Number.isSafeInteger(value) && value >= (allowZero ? 0 : 1), 'Informe um valor monetário válido.');
  return value;
}
export function sum(values: number[]) {
  return values.reduce((total, value) => {
    const result = total + value;
    ensure(Number.isSafeInteger(result), 'O total excede o limite suportado.');
    return result;
  }, 0);
}
export function parseMoney(input: string): number {
  const value = input.trim().replace(/^R\$\s*/, '');
  ensure(/^(?:\d+|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value), 'Use um valor como 1.234,56.');
  const [whole, decimal = ''] = value.replace(/\./g, '').split(',');
  return money(Number(whole) * 100 + Number(decimal.padEnd(2, '0')), true);
}
export function legacyCents(value: number, zero = false) {
  ensure(Number.isFinite(value), 'Valor legado inválido.');
  return money(Math.round((value + Number.EPSILON) * 100), zero);
}
export const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
export function text(value: string, label = 'Nome', max = 200) {
  ensure(typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max, `${label} inválido.`);
  return value.trim().replace(/\s+/g, ' ');
}
export function dateOnly(value: string) {
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(value), 'Data inválida.');
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  ensure(y >= 1900 && y <= 2199 && parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d, 'Data inválida.');
  return value;
}
export function monthOnly(value: string) { dateOnly(`${value}-01`); return value; }
export function addDays(value: string, days: number) {
  dateOnly(value);
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function shiftMonth(value: string, offset: number) {
  monthOnly(value);
  const [year, month] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}
export function dueDate(month: string, day: number) {
  monthOnly(month); ensure(Number.isInteger(day) && day >= 1 && day <= 31, 'Dia de vencimento inválido.');
  const end = Number(addDays(`${shiftMonth(month, 1)}-01`, -1).slice(-2));
  return `${month}-${String(Math.min(day, end)).padStart(2, '0')}`;
}
export function periodRange(month: string, startDay = 1) {
  ensure(Number.isInteger(startDay) && startDay >= 1 && startDay <= 28, 'Início do mês deve ser de 1 a 28.');
  monthOnly(month);
  const day = String(startDay).padStart(2, '0');
  return { start: `${month}-${day}`, end: `${shiftMonth(month, 1)}-${day}` };
}
export function periodAt(date: string, startDay = 1) {
  dateOnly(date); periodRange(date.slice(0, 7), startDay);
  return Number(date.slice(-2)) < startDay ? shiftMonth(date.slice(0, 7), -1) : date.slice(0, 7);
}
export type Clock = () => Date;
export function today(clock: Clock, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(clock());
  const part = (key: string) => parts.find(p => p.type === key)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function zonedInstant(date: string, hour: number, timezone: string) {
  dateOnly(date);
  let epoch = Date.parse(`${date}T${String(hour).padStart(2, '0')}:00:00Z`);
  const target = epoch;
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(epoch));
    const get = (key: string) => Number(parts.find(p => p.type === key)!.value);
    const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    const delta = target - wall;
    if (delta === 0) return new Date(epoch);
    epoch += delta;
  }
  throw new AppError('VALIDATION_ERROR', 'Horário não existe no fuso selecionado.');
}
export const operationKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export const errorMessage = (error: unknown) => error instanceof AppError ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
