import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDonutSlices } from '../src/presentation/donut.ts';
import { categoryChartColor } from '../src/theme/tokens.ts';

test('fatias representam as proporções e completam uma volta sem sobreposição', () => {
  const categories = [5000, 3000, 2000].map((amountCents, index) => ({ id: index + 1, name: `Categoria ${index}`, amountCents, color: categoryChartColor(index + 1) }));
  const slices = buildDonutSlices(categories, 10000);
  assert.deepEqual(slices.map(slice => slice.fraction), [0.5, 0.3, 0.2]);
  assert.deepEqual(slices.map(slice => slice.offset), [0, 0.5, 0.8]);
  assert.equal(slices.at(-1).offset + slices.at(-1).fraction, 1);
  assert.equal(new Set(slices.map(slice => slice.color)).size, 3);
});

test('sem despesas não gera fatias e uma categoria ocupa todo o círculo', () => {
  assert.deepEqual(buildDonutSlices([], 0), []);
  const slices = buildDonutSlices([{ id: 1, name: 'Alimentação', amountCents: 100, color: categoryChartColor(1) }, { id: 2, name: 'Sem gastos', amountCents: 0, color: categoryChartColor(2) }], 100);
  assert.equal(slices.length, 1);
  assert.equal(slices[0].fraction, 1);
  assert.equal(slices[0].offset, 0);
});

test('categorias mantêm cores ao mudar ordem, proporção ou mês', () => {
  const color = categoryChartColor(9);
  const first = buildDonutSlices([{ id: 9, name: 'Lazer', amountCents: 10, color }], 10);
  const second = buildDonutSlices([{ id: 1, name: 'Outros', amountCents: 90, color: categoryChartColor(1) }, { id: 9, name: 'Lazer', amountCents: 10, color: categoryChartColor(9) }], 100);
  assert.equal(first[0].color, second[1].color);
  assert.equal(first[0].amountCents, second[1].amountCents);
});
