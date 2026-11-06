
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BottomNavProps = {
  active: 'home' | 'transactions' | 'reports' | 'new';
};

export function BottomNav({ active }: BottomNavProps) {
  const items = [
    { key: 'home' as const, label: 'Início', icon: '⌂', route: '/home' },
    { key: 'transactions' as const, label: 'Transações', icon: '≡', route: '/transactions' },
    { key: 'reports' as const, label: 'Relatórios', icon: '◔', route: '/reports' },
    { key: 'more' as const, label: 'Mais', icon: '•••', route: '/home' },
  ];

  return (
    <View style={styles.nav}>
      {items.slice(0, 2).map((item) => {
        const selected = item.key === active;
        return (
          <Pressable key={item.key} onPress={() => router.replace(item.route)} style={styles.item}>
            <Text style={[styles.icon, selected && styles.active]}>{item.icon}</Text>
            <Text style={[styles.label, selected && styles.active]}>{item.label}</Text>
          </Pressable>
        );
      })}
      <Pressable onPress={() => router.push('/new-transaction')} style={styles.newButton}>
        <Text style={styles.newIcon}>+</Text>
      </Pressable>
      {items.slice(2).map((item) => (
        <Pressable key={item.key} onPress={() => router.replace(item.route)} style={styles.item}>
          <Text style={[styles.icon, item.key === active && styles.active]}>{item.icon}</Text>
          <Text style={[styles.label, item.key === active && styles.active]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 82,
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  item: { alignItems: 'center', justifyContent: 'center', width: 64 },
  icon: { color: '#64748B', fontSize: 20, lineHeight: 24 },
  label: { color: '#64748B', fontSize: 11, marginTop: 2 },
  active: { color: '#10B981' },
  newButton: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 30,
    width: 48,
  },
  newIcon: { color: '#FFFFFF', fontSize: 30, lineHeight: 32 },
});
