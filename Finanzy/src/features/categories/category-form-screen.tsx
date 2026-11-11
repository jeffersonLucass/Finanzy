import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { errorMessage } from '../../domain/core';
import { TransactionType } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useTheme } from '../../theme/ThemeProvider';
import { categoryPalette } from '../../theme/tokens';

const icons = ['🛒', '🍔', '🚕', '🏠', '💊', '🎮', '💰', '💼', '📦'];

export function CategoryFormScreen({ id, initialType }: { id?: number; initialType: TransactionType }) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [type, setType] = useState(initialType);
  const [icon, setIcon] = useState(icons[0]);
  const [color, setColor] = useState<string>(categoryPalette[0]);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (!id) return;
    void getRuntime().then(runtime => runtime.categories.list(undefined, true)).then(items => {
      const item = items.find(category => category.id === id);
      if (item) { setName(item.name); setType(item.type); setIcon(item.icon); setColor(item.color); }
    });
  }, [id]);
  const save = useCallback(() => getRuntime().then(runtime => runtime.categories.save({ name, type, icon, color }, id)), [color, icon, id, name, type]);
  const action = useAsyncAction(save, () => router.replace('/categories'));
  const submit = () => void action.execute().catch(error => setFeedback(errorMessage(error)));
  return (
    <AppScreen>
      <AppHeader back title={id ? 'Editar categoria' : 'Nova categoria'} />
      <SegmentedControl onChange={setType} options={[{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }]} value={type} />
      <FormField label="Nome" onChangeText={setName} placeholder="Nome da categoria" value={name} />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Ícone</Text>
      <View style={styles.options}>{icons.map(value => <Pressable accessibilityRole="button" accessibilityState={{ selected: icon === value }} key={value} onPress={() => setIcon(value)} style={[styles.icon, { backgroundColor: icon === value ? theme.colors.primarySoft : theme.colors.surface, borderColor: icon === value ? theme.colors.primary : theme.colors.border }]}><Text style={styles.iconText}>{value}</Text></Pressable>)}</View>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Cor</Text>
      <View style={styles.options}>{categoryPalette.map(value => <Pressable accessibilityLabel={`Cor ${value}`} accessibilityRole="button" accessibilityState={{ selected: color === value }} key={value} onPress={() => setColor(value)} style={[styles.color, { backgroundColor: value, borderColor: color === value ? theme.colors.text : value }]} />)}</View>
      {feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
      <View style={styles.save}><Button label="Salvar categoria" loading={action.loading} onPress={submit} /></View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 9, marginTop: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  icon: { alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  iconText: { fontSize: 21 },
  color: { borderRadius: 22, borderWidth: 3, height: 44, width: 44 },
  error: { fontSize: 13, marginTop: 8 },
  save: { marginTop: 18 },
});
