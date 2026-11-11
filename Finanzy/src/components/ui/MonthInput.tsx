import { shiftMonth } from '../../domain/core';
import { todayLocal } from '../../presentation/date';
import { SelectField } from './SelectField';

export function MonthInput({ label, value, onChange }: { label: string; value: string; onChange: (month: string) => void }) {
  const current = todayLocal().slice(0, 7);
  const months = Array.from(new Set([value, ...Array.from({ length: 61 }, (_, index) => shiftMonth(current, index - 24))])).sort();
  const options = months.map(month => ({ value: month, label: new Date(`${month}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }));
  return <SelectField label={label} onChange={onChange} options={options} value={value} />;
}
