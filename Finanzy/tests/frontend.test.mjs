import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { darkTheme, lightTheme } from '../src/theme/themes.ts';
import { formatCurrency } from '../src/presentation/format.ts';

test('mantém os mesmos tokens semânticos nos temas claro e escuro', () => {
  assert.deepEqual(Object.keys(darkTheme.colors).sort(), Object.keys(lightTheme.colors).sort());
  assert.equal(lightTheme.dark, false);
  assert.equal(darkTheme.dark, true);
});

test('formata valores financeiros da apresentação em BRL', () => {
  assert.match(formatCurrency(123456), /1\.234,56/);
  assert.match(formatCurrency(-50), /0,50/);
});

test('expõe todas as rotas previstas pelas trinta telas do Figma', () => {
  const routes = [
    'src/app/index.tsx',
    'src/app/home.tsx',
    'src/app/transactions/new.tsx',
    'src/app/transactions.tsx',
    'src/app/transactions/filters.tsx',
    'src/app/transactions/[id].tsx',
    'src/app/transactions/[id]/edit.tsx',
    'src/app/reports.tsx',
    'src/app/reports/comparison.tsx',
    'src/app/budgets.tsx',
    'src/app/budgets/new.tsx',
    'src/app/goals.tsx',
    'src/app/goals/new.tsx',
    'src/app/goals/[id].tsx',
    'src/app/goals/[id]/add.tsx',
    'src/app/recurring.tsx',
    'src/app/recurring/new.tsx',
    'src/app/recurring/subscriptions/new.tsx',
    'src/app/recurring/installments/new.tsx',
    'src/app/recurring/subscriptions/[id].tsx',
    'src/app/recurring/installments/[id].tsx',
    'src/app/forecast.tsx',
    'src/app/categories.tsx',
    'src/app/categories/new.tsx',
    'src/app/favorites.tsx',
    'src/app/calendar.tsx',
    'src/app/calendar/summary.tsx',
    'src/app/more.tsx',
    'src/app/settings.tsx',
    'src/app/settings/export.tsx',
  ];
  assert.equal(routes.length, 30);
  for (const route of routes) assert.equal(existsSync(route), true, route);
});
