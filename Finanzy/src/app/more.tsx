import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';

type MenuItem = {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  route: '/budgets' | '/goals' | null;
};

const menuItems: MenuItem[] = [
  { icon: '💰', title: 'Orçamentos', subtitle: 'Limites mensais', color: '#FFF7E6', route: '/budgets' },
  { icon: '🎯', title: 'Metas', subtitle: 'Seus objetivos', color: '#FFF1F2', route: '/goals' },
  { icon: '▤', title: 'Gastos mensais', subtitle: 'Mensalidades e parcelas', color: '#EFF6FF', route: null },
  { icon: '🗓️', title: 'Calendário', subtitle: 'Visão por data', color: '#FFF1F2', route: null },
  { icon: '🗂️', title: 'Categorias', subtitle: 'Organize seus gastos', color: '#FFF7E6', route: null },
  { icon: '★', title: 'Favoritos', subtitle: 'Ações rápidas', color: '#F5F3FF', route: null },
  { icon: '🔮', title: 'Previsão financeira', subtitle: 'Próximos meses', color: '#FDF2F8', route: null },
  { icon: '⚙️', title: 'Configurações', subtitle: 'Preferências e dados', color: '#F1F5F9', route: null },
];

export default function MoreScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Mais</Text>
          <View style={styles.menu}>
            {menuItems.map((item) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: item.route === null }}
                disabled={item.route === null}
                key={item.title}
                onPress={() => {
                  if (item.route) router.push(item.route);
                }}
                style={styles.menuItem}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F9FC', flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700', marginBottom: 16, marginTop: 8 },
  menu: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 14 },
  menuItem: { alignItems: 'center', flexDirection: 'row', minHeight: 66 },
  iconWrap: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  icon: { fontSize: 17 },
  menuText: { flex: 1, marginLeft: 12 },
  menuTitle: { color: '#111827', fontSize: 13, fontWeight: '600' },
  subtitle: { color: '#64748B', fontSize: 11, marginTop: 3 },
  chevron: { color: '#94A3B8', fontSize: 22, marginLeft: 8 },
});
