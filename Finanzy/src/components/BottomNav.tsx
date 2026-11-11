import { Icon } from './ui/Icon';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

type BottomNavProps = { active: 'home' | 'transactions' | 'reports' | 'more' | 'new' };

export function BottomNav({ active }: BottomNavProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const items = [
    { key: 'home' as const, label: 'Início', icon: 'house', route: '/home' },
    { key: 'transactions' as const, label: 'Transações', icon: 'menu', route: '/transactions' },
    { key: 'reports' as const, label: 'Relatórios', icon: 'chart-pie', route: '/reports' },
    { key: 'more' as const, label: 'Mais', icon: 'more', route: '/more' },
  ];
  return (
    <View accessibilityRole="tablist" style={[styles.nav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: insets.bottom, minHeight: 76 + insets.bottom }]}>
      {items.map(item => {
        const selected = item.key === active;
        return (
          <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={item.key} onPress={() => router.replace(item.route)} style={styles.item}>
            <Icon color={selected ? theme.colors.primary : theme.colors.textSecondary} name={item.icon} size={20} />
            <Text style={[styles.label, { color: selected ? theme.colors.primary : theme.colors.textSecondary }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20 },
  item: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 60 },
  icon: { fontSize: 20, lineHeight: 24 },
  label: { fontSize: 11, marginTop: 2 },
});
