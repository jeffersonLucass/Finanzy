export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 12, md: 14, lg: 16, xl: 18, full: 999 } as const;

export const fontSize = { xs: 11, sm: 12, md: 13, base: 14, lg: 15, xl: 16, title: 18, heading: 24, display: 32 } as const;

export const categoryPalette = ['#10B981', '#60A5FA', '#F59E0B', '#A78BFA', '#EF4444', '#14B8A6'] as const;

export const chartPalette = [...categoryPalette, '#EC4899', '#6366F1', '#84CC16', '#F97316', '#0EA5E9', '#A16207'] as const;

export function categoryChartColor(categoryId: number, dark = false) {
  const index = Math.max(0, categoryId - 1);
  return index < chartPalette.length ? chartPalette[index] : `hsl(${(index * 137.508) % 360}, 65%, ${dark ? 65 : 42}%)`;
}

export type ThemeColors = {
  canvas: string;
  surface: string;
  chip: string;
  elevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerStrong: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  disabled: string;
  overlay: string;
};

export type AppTheme = {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
};
