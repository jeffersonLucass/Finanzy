import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { AppScreen } from '../components/ui/AppScreen';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/ThemeProvider';

const menuItems = [
  { icon: '💰', title: 'Orçamentos', subtitle: 'Limites mensais', tone: 'warning', route: '/budgets' },
  { icon: '🎯', title: 'Metas', subtitle: 'Seus objetivos', tone: 'danger', route: '/goals' },
  { icon: '▤', title: 'Gastos mensais', subtitle: 'Mensalidades e parcelas', tone: 'info', route: '/recurring' },
  { icon: '🗓️', title: 'Calendário', subtitle: 'Visão por data', tone: 'danger', route: '/calendar' },
  { icon: '🗂️', title: 'Categorias', subtitle: 'Organize seus gastos', tone: 'warning', route: '/categories' },
  { icon: '★', title: 'Favoritos', subtitle: 'Ações rápidas', tone: 'primary', route: '/favorites' },
  { icon: '🔮', title: 'Previsão financeira', subtitle: 'Próximos meses', tone: 'danger', route: '/forecast' },
  { icon: '⚙️', title: 'Configurações', subtitle: 'Preferências e dados', tone: 'neutral', route: '/settings' },
] as const;

export default function MoreScreen() {
  const { theme } = useTheme();
  const tone = { warning: theme.colors.warningSoft, danger: theme.colors.dangerSoft, info: theme.colors.infoSoft, primary: theme.colors.primarySoft, neutral: theme.colors.canvas };
  return (
    <AppScreen footer={<BottomNav active="more" />}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Mais</Text>
      <Card style={styles.menu}>
        {menuItems.map(item => <Pressable accessibilityRole="button" key={item.title} onPress={() => router.push(item.route)} style={styles.item}><View style={[styles.iconWrap, { backgroundColor: tone[item.tone] }]}><Text style={styles.icon}>{item.icon}</Text></View><View style={styles.copy}><Text style={[styles.name, { color: theme.colors.text }]}>{item.title}</Text><Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text></View><Text style={[styles.chevron, { color: theme.colors.textMuted }]}>›</Text></Pressable>)}
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, marginTop: 8 },
  menu: { paddingHorizontal: 14, paddingVertical: 4 },
  item: { alignItems: 'center', flexDirection: 'row', minHeight: 66 },
  iconWrap: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  icon: { fontSize: 17 },
  copy: { flex: 1, marginLeft: 12 },
  name: { fontSize: 13, fontWeight: '600' },
  subtitle: { fontSize: 11, marginTop: 3 },
  chevron: { fontSize: 22, marginLeft: 8 },
});
