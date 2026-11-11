import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Icon } from '../../components/ui/Icon';
import { TransactionType } from '../../domain/models';
import { addDays, dateOnly, errorMessage, ensure } from '../../domain/core';
import { getRuntime } from '../../application/runtime';
import { toBrazilianDate, toDatabaseDate } from '../../presentation/date';
import { useCategories } from '../../features/categories/use-categories';
import { useTheme } from '../../theme/ThemeProvider';

type TypeFilter = 'all' | TransactionType;

export default function TransactionFiltersRoute() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ type?: string; categories?: string; start?: string; end?: string; favorites?: string }>();
  const [type, setType] = useState<TypeFilter>((params.type as TypeFilter) || 'all');
  const [categoryIds, setCategoryIds] = useState(() => new Set((params.categories ?? '').split(',').map(Number).filter(Boolean)));
  const [start, setStart] = useState(params.start ? toBrazilianDate(params.start) : '');
  const [end, setEnd] = useState(params.end ? toBrazilianDate(params.end) : '');
  const [preset, setPreset] = useState<'today' | 'week' | 'month' | 'previousMonth' | 'custom'>('custom');
  const [feedback, setFeedback] = useState('');
  const [favorites, setFavorites] = useState(params.favorites === '1');
  const expenseCategories = useCategories('expense');
  const incomeCategories = useCategories('income');
  const categories = [...(expenseCategories.data ?? []), ...(incomeCategories.data ?? [])].filter(category => type === 'all' || category.type === type);
  const toggleCategory = (id: number) => setCategoryIds(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const apply = async () => {
    try {
      let from = start ? dateOnly(toDatabaseDate(start)) : '';
      let until = end ? dateOnly(toDatabaseDate(end)) : '';
      if (preset !== 'custom') {
        const runtime = await getRuntime();
        const range = await runtime.transactions.filterPreset(preset);
        from = range.start;
        until = addDays(range.end, -1);
      }
      ensure(!from || !until || from <= until, 'A data final deve ser igual ou posterior à inicial.');
      router.replace({ pathname: '/transactions', params: { type: type === 'all' ? '' : type, categories: [...categoryIds].join(','), start: from, end: until, favorites: favorites ? '1' : '' } });
    } catch (error) { setFeedback(errorMessage(error)); }
  };
  const clear = () => router.replace('/transactions');
  return (
    <AppScreen action={<View style={styles.actions}><View style={styles.half}><Button label="Limpar filtros" onPress={clear} variant="secondary" /></View><View style={styles.half}><Button label="Aplicar filtros" onPress={() => void apply()} /></View></View>}>
      <AppHeader back title="Filtros de transações" />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Tipo</Text>
      <SegmentedControl onChange={setType} options={[{ value: 'all', label: 'Todas' }, { value: 'income', label: 'Receitas' }, { value: 'expense', label: 'Despesas' }]} value={type} />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Categorias</Text>
      <View style={styles.chips}>{categories.map(category => {
        const selected = categoryIds.has(category.id);
        const color = selected ? theme.colors.onPrimary : theme.colors.textSecondary;
        return <Pressable accessibilityLabel={category.name} accessibilityRole="checkbox" aria-checked={selected} key={category.id} onPress={() => toggleCategory(category.id)} style={[styles.chip, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.border }]}><Icon color={color} name={category.icon} size={15} /><Text style={[styles.chipLabel, { color }]}>{category.name}</Text></Pressable>;
      })}</View>
      <Text style={[styles.label, { color: theme.colors.text }]}>Período</Text>
      {([{ value: 'today', label: 'Hoje' }, { value: 'week', label: 'Esta semana' }, { value: 'month', label: 'Este mês' }, { value: 'previousMonth', label: 'Mês anterior' }, { value: 'custom', label: 'Período personalizado' }] as const).map(option => <Pressable accessibilityRole="radio" accessibilityState={{ checked: preset === option.value }} key={option.value} onPress={() => setPreset(option.value)} style={styles.preset}><View style={[styles.periodIcon, { backgroundColor: theme.colors.primarySoft }]}><Text style={{ color: theme.colors.primaryStrong }}>◷</Text></View><Text style={[styles.presetLabel, { color: theme.colors.text }]}>{option.label}</Text><Text style={{ color: preset === option.value ? theme.colors.primary : theme.colors.textMuted }}>{preset === option.value ? '◉' : '○'}</Text></Pressable>)}
      {preset === 'custom' ? <View style={styles.period}><View style={styles.half}><FormField inputKind="date" label="Data inicial" onChangeText={setStart} placeholder="DD/MM/AAAA" value={start} /></View><View style={styles.half}><FormField inputKind="date" label="Data final" onChangeText={setEnd} placeholder="DD/MM/AAAA" value={end} /></View></View> : null}
      <Button compact label={favorites ? 'Somente favoritos' : 'Incluir todos'} onPress={() => setFavorites(value => !value)} variant="ghost" />
      {feedback ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.dangerStrong }}>{feedback}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
  chipLabel: { fontSize: 13 },
  period: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  preset: { alignItems: 'center', flexDirection: 'row', minHeight: 54 },
  periodIcon: { alignItems: 'center', borderRadius: 12, height: 32, justifyContent: 'center', width: 32 },
  presetLabel: { flex: 1, fontSize: 13, fontWeight: '600', marginHorizontal: 10 },
});
