import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { formatCurrency } from '../../presentation/format';
import { buildDonutSlices, DonutCategory } from '../../presentation/donut';
import { useTheme } from '../../theme/ThemeProvider';

const size = 150;
const strokeWidth = 26;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;

export function DonutChart({ totalCents, categories }: { totalCents: number; categories: DonutCategory[] }) {
  const { theme } = useTheme();
  const slices = buildDonutSlices(categories, totalCents);
  const description = slices.map(slice => `${slice.name}: ${formatCurrency(slice.amountCents)}, ${(slice.fraction * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`).join('; ');
  return (
    <View style={styles.row}>
      <View accessibilityLabel={`Total de despesas: ${formatCurrency(totalCents)}. ${description || 'Sem despesas neste mês.'}`} accessibilityRole="image" style={styles.ring}>
        <Svg aria-hidden height="100%" viewBox={`0 0 ${size} ${size}`} width="100%">
          <Circle cx={size / 2} cy={size / 2} fill="none" r={radius} stroke={theme.colors.border} strokeWidth={strokeWidth} />
          {slices.map(slice => <Circle cx={size / 2} cy={size / 2} fill="none" key={slice.id} r={radius} transform={`rotate(-90 ${size / 2} ${size / 2})`} stroke={slice.color} strokeDasharray={[slice.fraction * circumference, circumference]} strokeDashoffset={-slice.offset * circumference} strokeLinecap="butt" strokeWidth={strokeWidth} />)}
        </Svg>
        <View pointerEvents="none" style={styles.center}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1} style={[styles.value, { color: theme.colors.text }]}>{formatCurrency(totalCents)}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {slices.length ? slices.map(slice => (
          <View key={slice.id} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: slice.color }]} />
            <View style={styles.legendCopy}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{slice.name}</Text>
              <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>{formatCurrency(slice.amountCents)} · {(slice.fraction * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</Text>
            </View>
          </View>
        )) : <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>Sem despesas neste mês.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  ring: { aspectRatio: 1, flexShrink: 0, maxWidth: 150, width: '46%' },
  center: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25 },
  totalLabel: { fontSize: 10, marginBottom: 4 },
  value: { fontSize: 13, fontWeight: '700', textAlign: 'center', width: '100%' },
  legend: { flex: 1, gap: 12, minWidth: 0 },
  legendItem: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 },
  swatch: { borderRadius: 3, flexShrink: 0, height: 10, marginTop: 3, width: 10 },
  legendCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 12, fontWeight: '600', lineHeight: 17 },
  detail: { fontSize: 11, lineHeight: 16, marginTop: 2 },
});
