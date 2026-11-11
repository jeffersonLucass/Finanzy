import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TransactionType } from '../domain/models';
import { toBrazilianDate } from '../presentation/date';
import { formatCurrency } from '../presentation/format';
import { useTheme } from '../theme/ThemeProvider';

type Props = { description: string; category: string; icon?: string; type: TransactionType; amountCents: number; date: string; onPress?: () => void };

export function TransactionRow({ description, category, icon = '💳', type, amountCents, date, onPress }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={styles.row}>
      <View style={[styles.icon, { backgroundColor: theme.colors.surface }]}><Text>{icon}</Text></View>
      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>{description}</Text>
        <Text style={[styles.category, { color: theme.colors.textSecondary }]}>{category} · {toBrazilianDate(date)}</Text>
      </View>
      <Text style={[styles.amount, { color: type === 'income' ? theme.colors.primaryStrong : theme.colors.danger }]}>{type === 'income' ? '+ ' : '- '}{formatCurrency(amountCents)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingVertical: 7 },
  icon: { alignItems: 'center', borderRadius: 16, height: 42, justifyContent: 'center', width: 42 },
  info: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 15, fontWeight: '700' },
  category: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700' },
});
