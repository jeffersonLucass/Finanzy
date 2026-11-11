import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type BottomNavProps = { active: 'home' | 'transactions' | 'reports' | 'more' | 'new' };

export function BottomNav({ active }: BottomNavProps) {
  const { theme } = useTheme();
  const items = [
    { key: 'home' as const, label: 'Início', icon: '⌂', route: '/home' },
    { key: 'transactions' as const, label: 'Transações', icon: '≡', route: '/transactions' },
    { key: 'reports' as const, label: 'Relatórios', icon: '◔', route: '/reports' },
    { key: 'more' as const, label: 'Mais', icon: '•••', route: '/more' },
  ];
  return (
    <View style={[styles.nav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      {items.slice(0, 2).map(item => {
        const selected = item.key === active;
        return (
          <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={item.key} onPress={() => router.replace(item.route)} style={styles.item}>
            <Text style={[styles.icon, { color: selected ? theme.colors.primary : theme.colors.textSecondary }]}>{item.icon}</Text>
            <Text style={[styles.label, { color: selected ? theme.colors.primary : theme.colors.textSecondary }]}>{item.label}</Text>
          </Pressable>
        );
      })}
      <Pressable accessibilityLabel="Nova movimentação" accessibilityRole="button" onPress={() => router.push('/transactions/new')} style={[styles.newButton, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.newIcon, { color: theme.colors.onPrimary }]}>+</Text>
      </Pressable>
      {items.slice(2).map(item => {
        const selected = item.key === active;
        return (
          <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={item.key} onPress={() => router.replace(item.route)} style={styles.item}>
            <Text style={[styles.icon, { color: selected ? theme.colors.primary : theme.colors.textSecondary }]}>{item.icon}</Text>
            <Text style={[styles.label, { color: selected ? theme.colors.primary : theme.colors.textSecondary }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', height: 82, justifyContent: 'space-around', paddingHorizontal: 8 },
  item: { alignItems: 'center', justifyContent: 'center', width: 64 },
  icon: { fontSize: 20, lineHeight: 24 },
  label: { fontSize: 11, marginTop: 2 },
  newButton: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', marginBottom: 30, width: 48 },
  newIcon: { fontSize: 30, lineHeight: 32 },
});
