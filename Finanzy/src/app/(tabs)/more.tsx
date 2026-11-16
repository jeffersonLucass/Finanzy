import { Icon } from '../../components/ui/Icon';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../components/ui/AppScreen';
import { useTheme } from '../../theme/ThemeProvider';

const menuItems = [
  { icon: 'banknote', title: 'Orçamentos', subtitle: 'Limites mensais', tone: 'primary', route: '/budgets' },
  { icon: 'target', title: 'Metas', subtitle: 'Seus objetivos', tone: 'danger', route: '/goals' },
  { icon: 'chart', title: 'Relatórios', subtitle: 'Resumo e comparação mensal', tone: 'info', route: '/reports' },
  { icon: 'calendar', title: 'Calendário', subtitle: 'Visão por data', tone: 'danger', route: '/calendar' },
  { icon: 'tags', title: 'Categorias', subtitle: 'Organize seus gastos', tone: 'warning', route: '/categories' },
  { icon: 'star', title: 'Favoritos', subtitle: 'Ações rápidas', tone: 'primary', route: '/favorites' },
  { icon: 'settings', title: 'Configurações', subtitle: 'Preferências e dados', tone: 'neutral', route: '/settings' },
] as const;

export default function MoreScreen() {
  const { theme } = useTheme();
  const tone = { warning: theme.colors.primarySoft, danger: theme.colors.primarySoft, info: theme.colors.primarySoft, primary: theme.colors.primarySoft, neutral: theme.colors.primarySoft };
  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Mais</Text>
      <View style={styles.menu}>
        {menuItems.map(item => <Pressable accessibilityRole="button" key={item.title} onPress={() => router.push(item.route)} style={styles.item}><View style={[styles.iconWrap, { backgroundColor: tone[item.tone] }]}><Icon name={item.icon} size={18} /></View><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{item.title}</Text><Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text></View><Text style={[styles.chevron, { color: theme.colors.textMuted }]}>›</Text></Pressable>)}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', marginBottom: 28, lineHeight: 28 },
  menu: { paddingVertical: 4 },
  item: { alignItems: 'center', flexDirection: 'row', minHeight: 62 },
  iconWrap: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  icon: { fontSize: 17 },
  copy: { flex: 1, marginLeft: 10 },
  name: { fontSize: 13, fontWeight: '600' },
  subtitle: { fontSize: 11, marginTop: 3 },
  chevron: { fontSize: 22, marginLeft: 8 },
});
