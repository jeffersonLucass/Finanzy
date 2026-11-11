import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMoney } from '../src/domain/core.ts';
import { formatMoneyInput, inputError, inputLimits, sanitizeInput, validInput } from '../src/presentation/input.ts';

test('aplica máscara monetária sem arredondar centavos e remove letras', () => {
  assert.equal(formatMoneyInput('1'), '0,01');
  assert.equal(formatMoneyInput('123456'), '1.234,56');
  assert.equal(sanitizeInput('R$ 1.234,56', { kind: 'money' }), '1.234,56');
  assert.equal(sanitizeInput('abc12xyz', { kind: 'money' }), '0,12');
  assert.equal(sanitizeInput('', { kind: 'money' }), '');
  assert.equal(sanitizeInput('-100', { kind: 'money' }, '12,34'), '12,34');
  assert.equal(parseMoney(formatMoneyInput('123456')), 123456);
});

test('preserva o limite monetário seguro e rejeita valores maiores sem truncar', () => {
  const maximum = String(Number.MAX_SAFE_INTEGER);
  assert.equal(parseMoney(sanitizeInput(maximum, { kind: 'money' })), Number.MAX_SAFE_INTEGER);
  assert.equal(sanitizeInput('9007199254740992', { kind: 'money' }, '1,00'), '1,00');
  assert.equal(sanitizeInput('9'.repeat(100), { kind: 'money' }, '1,00'), '1,00');
});

test('inteiros respeitam intervalos, tamanho e não aceitam frações ou sinais', () => {
  const rules = { kind: 'integer', min: 1, max: 31, maxLength: 2, required: true };
  assert.equal(sanitizeInput('abc12', rules), '12');
  assert.equal(sanitizeInput('99', rules, '9'), '9');
  assert.equal(sanitizeInput('1,5', rules, '1'), '1');
  assert.equal(sanitizeInput('-1', rules, '1'), '1');
  assert.equal(validInput('0', rules), false);
  assert.equal(validInput('', rules), false);
  assert.equal(validInput('31', rules), true);
  assert.equal(validInput('0', { kind: 'integer', min: 0, max: 23, required: true }), true);
  assert.equal(validInput('3601', { kind: 'integer', min: 1, max: 3600 }), false);
});

test('mascara datas e valida dias reais, anos bissextos e o intervalo do domínio', () => {
  assert.equal(sanitizeInput('abc29022024xyz9999', { kind: 'date' }), '29/02/2024');
  assert.equal(validInput('29/02/2024', { kind: 'date' }), true);
  for (const value of ['29/02/2025', '31/04/2026', '01/13/2026', '01/01/1899', '01/01/2200', '12/']) assert.equal(validInput(value, { kind: 'date' }), false, value);
  assert.equal(validInput('', { kind: 'date' }), true);
  assert.equal(validInput('', { kind: 'date', required: true }), false);
});

test('limita textos e preserva acentos e caracteres Unicode', () => {
  assert.equal(sanitizeInput('a'.repeat(300)).length, inputLimits.text);
  assert.equal(sanitizeInput('b'.repeat(3000), { maxLength: inputLimits.observation }).length, 2000);
  const unicodeText = `João, ação e ${String.fromCodePoint(0x1f3ae)}`;
  assert.equal(sanitizeInput(unicodeText), unicodeText);
  assert.equal(sanitizeInput('abc\u0000def'), 'abcdef');
  assert.ok(inputError('   ', { required: true }));
});

test('validação diferencia valor positivo, saldo inicial opcional e fuso inválido', () => {
  assert.equal(validInput('0,00', { kind: 'money', required: true }), false);
  assert.equal(validInput('0,00', { kind: 'money', allowZero: true }), true);
  assert.equal(validInput('', { kind: 'money', allowZero: true }), true);
  assert.equal(validInput('America/Sao_Paulo', { kind: 'timezone', required: true }), true);
  assert.equal(validInput('abc/invalid', { kind: 'timezone', required: true }), false);
});
