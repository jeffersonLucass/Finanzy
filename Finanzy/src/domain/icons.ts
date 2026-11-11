export const iconOptions = [
  { value: 'utensils', label: 'Alimentação' },
  { value: 'house', label: 'Moradia' },
  { value: 'car', label: 'Transporte' },
  { value: 'heart', label: 'Saúde' },
  { value: 'book-open', label: 'Educação' },
  { value: 'gamepad', label: 'Lazer' },
  { value: 'shopping-cart', label: 'Compras' },
  { value: 'receipt', label: 'Serviços' },
  { value: 'package', label: 'Outros' },
  { value: 'banknote', label: 'Salário' },
  { value: 'briefcase', label: 'Trabalho' },
  { value: 'trending-up', label: 'Investimentos' },
  { value: 'gift', label: 'Presente' },
  { value: 'undo', label: 'Reembolso' },
  { value: 'target', label: 'Objetivo' },
  { value: 'plane', label: 'Viagem' },
  { value: 'laptop', label: 'Tecnologia' },
  { value: 'coffee', label: 'Café' },
  { value: 'paw-print', label: 'Animais' },
] as const;

export type StoredIconName = typeof iconOptions[number]['value'];

const legacyIcons: Record<string, StoredIconName> = Object.fromEntries([
  [0x1f354, 'utensils'], [0x1f3e0, 'house'], [0x1f3e1, 'house'], [0x1f695, 'car'], [0x1f697, 'car'],
  [0x2764, 'heart'], [0x1f48a, 'heart'], [0x1f4da, 'book-open'], [0x1f3ae, 'gamepad'], [0x1f6d2, 'shopping-cart'],
  [0x1f9fe, 'receipt'], [0x1f4e6, 'package'], [0x1f4b0, 'banknote'], [0x1f4bc, 'briefcase'], [0x1f4c8, 'trending-up'],
  [0x1f381, 'gift'], [0x21a9, 'undo'], [0x1f3af, 'target'], [0x2708, 'plane'], [0x1f4bb, 'laptop'],
  [0x2615, 'coffee'], [0x1f436, 'paw-print'], [0x1f43e, 'paw-print'],
].map(([code, name]) => [String.fromCodePoint(Number(code)), name])) as Record<string, StoredIconName>;

export function normalizeIcon(value: string | null | undefined, fallback: StoredIconName = 'package'): StoredIconName {
  if (!value) return fallback;
  if (iconOptions.some(option => option.value === value)) return value as StoredIconName;
  const legacy = value.replace(/\uFE0F/g, '');
  return Object.hasOwn(legacyIcons, legacy) ? legacyIcons[legacy] : fallback;
}
