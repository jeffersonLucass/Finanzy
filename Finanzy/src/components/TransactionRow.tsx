import { Icon } from './ui/Icon';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TransactionType } from '../domain/models';
import { formatCurrency } from '../presentation/format';
import { useTheme } from '../theme/ThemeProvider';

type Props = { description: string; category: string; icon?: string; type: TransactionType; amountCents: number; date: string; onPress?: () => void; onLongPress?: () => void };

export function TransactionRow({ description, category, icon = 'credit-card', type, amountCents, onPress, onLongPress }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable accessibilityHint={onLongPress ? 'Mantenha pressionado para remover dos favoritos' : undefined} accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onLongPress={onLongPress} onPress={onPress} style={styles.row}>
      <View style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}><Icon name={icon} size={18} /></View>
      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>{description}</Text>
        <Text style={[styles.category, { color: theme.colors.textSecondary }]}>{category}</Text>
      </View>
      <Text style={[styles.amount, { color: type === 'income' ? theme.colors.primaryStrong : theme.colors.danger }]}>{type === 'income' ? '+ ' : '- '}{formatCurrency(amountCents)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 62, paddingVertical: 10 },
  icon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  info: { flex: 1, marginHorizontal: 10 },
  name: { fontSize: 13, fontWeight: '600' },
  category: { fontSize: 11, marginTop: 4 },
  amount: { fontSize: 13, fontWeight: '600' },
});
