import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpClient } from '../src/infrastructure/http/client.ts';
import { validateHolidays } from '../src/features/calendar/holiday-service.ts';

test('cliente HTTP valida HTTPS, status e JSON', async () => {
  const valid = new HttpClient(async () => new Response('{"ok":true}', { status: 200 }));
  assert.deepEqual(await valid.getJson('https://example.test'), { ok: true });
  await assert.rejects(() => valid.getJson('http://example.test'), error => error.code === 'VALIDATION_ERROR');
  const unavailable = new HttpClient(async () => new Response('{}', { status: 503 }));
  await assert.rejects(() => unavailable.getJson('https://example.test'), error => error.code === 'NETWORK_ERROR');
  const invalid = new HttpClient(async () => new Response('inválido', { status: 200 }));
  await assert.rejects(() => invalid.getJson('https://example.test'), error => error.code === 'NETWORK_ERROR');
});

test('cliente HTTP diferencia timeout e cancelamento', async () => {
  const pending = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('abort')), { once: true });
  });
  const timeout = new HttpClient(pending, 5);
  await assert.rejects(() => timeout.getJson('https://example.test'), error => error.code === 'TIMEOUT');
  const controller = new AbortController();
  const cancelled = new HttpClient(pending, 1000);
  const request = cancelled.getJson('https://example.test', controller.signal);
  controller.abort();
  await assert.rejects(() => request, error => error.code === 'NETWORK_ERROR');
});

test('contrato de feriados rejeita formato e ano incorretos', () => {
  assert.throws(() => validateHolidays({}, 2025));
  assert.throws(() => validateHolidays([{ date: '2024-01-01', name: 'Data', type: 'national' }], 2025));
  assert.throws(() => validateHolidays([{ date: 'inválida', name: 'Data', type: 'national' }], 2025));
});
