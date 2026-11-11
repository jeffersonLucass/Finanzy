import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { SelectField } from '../../components/ui/SelectField';
import { iconOptions, normalizeIcon } from '../../domain/icons';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { errorMessage } from '../../domain/core';
import { TransactionType } from '../../domain/models';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useTheme } from '../../theme/ThemeProvider';
import { categoryPalette } from '../../theme/tokens';

const colorNames = ['Verde', 'Azul', 'Amarelo', 'Roxo', 'Vermelho', 'Turquesa'];

export function CategoryFormScreen({ id, initialType }: { id?: number; initialType: TransactionType }) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [type, setType] = useState(initialType);
  const [icon, setIcon] = useState('package');
  const [color, setColor] = useState<string>(categoryPalette[0]);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (!id) return;
    void getRuntime().then(runtime => runtime.categories.list(undefined, true)).then(items => {
      const item = items.find(category => category.id === id);
      if (item) { setName(item.name); setType(item.type); setIcon(normalizeIcon(item.icon)); setColor(item.color); }
    });
  }, [id]);
  const save = useCallback(() => getRuntime().then(runtime => runtime.categories.save({ name, type, icon, color }, id)), [color, icon, id, name, type]);
  const action = useAsyncAction(save, () => router.replace('/categories'));
  const archive = useCallback(() => getRuntime().then(runtime => runtime.categories.archive(id!)), [id]);
  const archiveAction = useAsyncAction(archive, () => router.replace('/categories'));
  const submit = () => void action.execute().catch(error => setFeedback(errorMessage(error)));
  return (
    <AppScreen action={<Button disabled={!name.trim() || !icon.trim()} label={id ? 'Salvar alterações' : 'Criar categoria'} loading={action.loading} onPress={submit} />}>
      <AppHeader back title={id ? 'Editar categoria' : 'Nova categoria'} />
      <FormField label="Nome" onChangeText={setName} placeholder="Nome da categoria" required value={name} />
      <SelectField label="Ícone" onChange={setIcon} options={iconOptions.map(option => ({ ...option, icon: option.value }))} value={icon} />
      <Text style={[styles.label, { color: theme.colors.text }]}>Cor</Text>
      <View style={styles.options}>{categoryPalette.map((value, index) => <Pressable accessibilityLabel={colorNames[index]} accessibilityRole="button" accessibilityState={{ selected: color === value }} hitSlop={6} key={value} onPress={() => setColor(value)} style={[styles.color, { backgroundColor: color === value ? value : theme.colors.chip }]}><Text style={[styles.colorLabel, { color: color === value ? theme.colors.onPrimary : theme.colors.text }]}>{colorNames[index]}</Text></Pressable>)}</View>
      <Text style={[styles.label, { color: theme.colors.text }]}>Tipo</Text>
      <SegmentedControl onChange={setType} options={[{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }]} value={type} />
      {id ? <Button compact label="Arquivar categoria" loading={archiveAction.loading} onPress={() => Alert.alert('Arquivar categoria?', 'O histórico será preservado.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Arquivar', style: 'destructive', onPress: () => void archiveAction.execute().catch(error => setFeedback(errorMessage(error))) }])} variant="danger" /> : null}
      {feedback || action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(action.error)}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 4 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  color: { alignItems: 'center', borderRadius: 18, justifyContent: 'center', minHeight: 32, paddingHorizontal: 13 },
  colorLabel: { fontSize: 12, fontWeight: '600' },
  error: { fontSize: 13, marginTop: 8 },
  save: { marginTop: 18 },
});
