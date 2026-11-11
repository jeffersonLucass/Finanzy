import assert from 'node:assert/strict';
import test from 'node:test';
import { iconOptions, normalizeIcon } from '../src/domain/icons.ts';

test('mantém identificadores de ícones conhecidos', () => {
  for (const option of iconOptions) assert.equal(normalizeIcon(option.value), option.value);
});

test('converte ícones legados para vetores sem modificar registros salvos', () => {
  assert.equal(normalizeIcon(String.fromCodePoint(0x1f354)), 'utensils');
  assert.equal(normalizeIcon(String.fromCodePoint(0x2764, 0xfe0f)), 'heart');
  assert.equal(normalizeIcon(String.fromCodePoint(0x1f3af), 'target'), 'target');
});

test('usa fallback seguro para símbolos desconhecidos e valores ausentes', () => {
  for (const value of [null, undefined, '', 'invalid', '__proto__', 'constructor', String.fromCodePoint(0x1f600)]) {
    assert.equal(normalizeIcon(value), 'package');
    assert.equal(normalizeIcon(value, 'target'), 'target');
  }
});
