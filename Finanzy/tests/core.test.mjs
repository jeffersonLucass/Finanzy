import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, dueDate, parseMoney, periodAt, periodRange, shiftMonth, zonedInstant } from '../src/domain/core.ts';

test('interpreta dinheiro brasileiro em centavos', () => {
  assert.equal(parseMoney('1234,56'), 123456);
  assert.equal(parseMoney('1.234,56'), 123456);
  assert.equal(parseMoney('0,01'), 1);
  assert.throws(() => parseMoney('1,234'));
  assert.throws(() => parseMoney('1.23'));
});

test('calcula datas civis e mês financeiro sem intervalos de trinta dias', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(dueDate('2025-02', 31), '2025-02-28');
  assert.equal(dueDate('2024-02', 31), '2024-02-29');
  assert.equal(shiftMonth('2025-12', 1), '2026-01');
  assert.deepEqual(periodRange('2025-03', 10), { start: '2025-03-10', end: '2025-04-10' });
  assert.equal(periodAt('2025-03-09', 10), '2025-02');
});

test('resolve horário local no fuso configurado', () => {
  assert.equal(zonedInstant('2025-06-10', 9, 'America/Sao_Paulo').toISOString(), '2025-06-10T12:00:00.000Z');
});
