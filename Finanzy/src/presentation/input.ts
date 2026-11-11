import { parseMoney } from '../domain/core';
import { formatBrazilianDateInput, isValidBrazilianDate } from './date';

export const inputLimits = { text: 200, observation: 2000, icon: 40, timezone: 100, moneyDigits: 16, moneyLength: 21 } as const;
export type InputKind = 'text' | 'money' | 'integer' | 'date' | 'timezone';
export type InputRules = { kind?: InputKind; required?: boolean; allowZero?: boolean; min?: number; max?: number; maxLength?: number };

export function formatMoneyInput(value: string) {
  if (value.includes('-')) return '';
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  const padded = digits.padStart(3, '0');
  const whole = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${whole},${padded.slice(-2)}`;
}

export function sanitizeInput(value: string, rules: InputRules = {}, previous = '') {
  if (rules.kind === 'money') {
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (value.includes('-') || digits.length > inputLimits.moneyDigits || (digits && BigInt(digits) > BigInt(Number.MAX_SAFE_INTEGER))) return previous;
    return formatMoneyInput(value);
  }
  if (rules.kind === 'date') return formatBrazilianDateInput(value);
  if (rules.kind === 'integer') {
    if (/[.,+\-]/.test(value)) return previous;
    const digits = value.replace(/\D/g, '').slice(0, rules.maxLength ?? 4).replace(/^0+(?=\d)/, '');
    return digits && rules.max !== undefined && Number(digits) > rules.max ? previous : digits;
  }
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, rules.maxLength ?? inputLimits.text);
}

export function inputError(value: string, rules: InputRules = {}) {
  if (!value.trim()) return rules.required ? 'Preencha este campo.' : '';
  if (rules.maxLength !== undefined && value.length > rules.maxLength) return `Use no máximo ${rules.maxLength} caracteres.`;
  if (rules.kind === 'date' && !isValidBrazilianDate(value)) return 'Informe uma data válida no formato DD/MM/AAAA.';
  if (rules.kind === 'timezone') {
    try { new Intl.DateTimeFormat('pt-BR', { timeZone: value }).format(); }
    catch { return 'Informe um fuso válido, como America/Sao_Paulo.'; }
  }
  if (rules.kind === 'money') {
    try {
      const cents = parseMoney(value);
      if (!rules.allowZero && cents === 0) return 'Informe um valor maior que zero.';
    } catch { return 'Informe um valor monetário válido.'; }
  }
  if (rules.kind === 'integer') {
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) return 'Use somente números inteiros.';
    if (rules.min !== undefined && Number(value) < rules.min) return `O mínimo é ${rules.min}.`;
    if (rules.max !== undefined && Number(value) > rules.max) return `O máximo é ${rules.max}.`;
  }
  return '';
}

export const validInput = (value: string, rules: InputRules = {}) => inputError(value, rules) === '';
