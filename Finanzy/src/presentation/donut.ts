export type DonutCategory = { id: number; name: string; amountCents: number; color: string };
export type DonutSlice = DonutCategory & { fraction: number; offset: number };

export function buildDonutSlices(categories: DonutCategory[], totalCents: number): DonutSlice[] {
  if (totalCents <= 0) return [];
  let offset = 0;
  return categories.filter(category => category.amountCents > 0).map(category => {
    const fraction = category.amountCents / totalCents;
    const slice = { ...category, fraction, offset };
    offset += fraction;
    return slice;
  });
}
