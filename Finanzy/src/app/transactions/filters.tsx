import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { TransactionType } from '../../domain/models';
import { useCategories } from '../../features/categories/use-categories';
import { useTheme } from '../../theme/ThemeProvider';

type TypeFilter = 'all' | TransactionType;

export default function TransactionFiltersRoute() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ type?: string; categories?: string; start?: string; end?: string; favorites?: string }>();
  const [type, setType] = useState<TypeFilter>((params.type as TypeFilter) || 'all');
  const [categoryIds, setCategoryIds] = useState(() => new Set((params.categories ?? '').split(',').map(Number).filter(Boolean)));
  const [start, setStart] = useState(params.start ?? '');
  const [end, setEnd] = useState(params.end ?? '');
  const [favorites, setFavorites] = useState(params.favorites === '1');
  const expenseCategories = useCategories('expense');
  const incomeCategories = useCategories('income');
  const categories = [...(expenseCategories.data ?? []), ...(incomeCategories.data ?? [])].filter(category => type === 'all' || category.type === type);
  const toggleCategory = (id: number) => setCategoryIds(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const apply = () => router.replace({ pathname: '/transactions', params: { type: type === 'all' ? '' : type, categories: [...categoryIds].join(','), start: start || '', end: end || '', favorites: favorites ? '1' : '' } });
  const clear = () => router.replace('/transactions');
  return (
    <AppScreen>
      <AppHeader back title="Filtros" />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Tipo</Text>
      <SegmentedControl onChange={setType} options={[{ value: 'all', label: 'Todas' }, { value: 'income', label: 'Receitas' }, { value: 'expense', label: 'Despesas' }]} value={type} />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Categorias</Text>
      <View style={styles.chips}>{categories.map(category => {
        const selected = categoryIds.has(category.id);
        return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={category.id} onPress={() => toggleCategory(category.id)}><Text style={[styles.chip, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.border, color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }]}>{category.icon} {category.name}</Text></Pressable>;
      })}</View>
      <View style={styles.period}><View style={styles.half}><FormField label="Data inicial" onChangeText={setStart} placeholder="AAAA-MM-DD" value={start} /></View><View style={styles.half}><FormField label="Data final" onChangeText={setEnd} placeholder="AAAA-MM-DD" value={end} /></View></View>
      <Button label={favorites ? '★ Somente favoritos' : '☆ Incluir todos'} onPress={() => setFavorites(value => !value)} variant="secondary" />
      <View style={styles.actions}><View style={styles.half}><Button label="Limpar" onPress={clear} variant="secondary" /></View><View style={styles.half}><Button label="Aplicar filtros" onPress={apply} /></View></View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: { borderRadius: 18, borderWidth: 1, fontSize: 13, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 9 },
  period: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
});
