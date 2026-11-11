import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from './Icon';

type Option = { value: string; label: string; icon?: string };

export function SelectField({ label, value, options, onChange, placeholder = 'Selecionar' }: { label: string; value?: string; options: Option[]; onChange: (value: string) => void; placeholder?: string }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  return (
    <>
      <Pressable accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`} accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.field, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
        <View style={styles.selection}>{selected?.icon ? <Icon name={selected.icon} size={18} /> : null}<Text style={[styles.value, { color: selected ? theme.colors.text : theme.colors.textMuted }]}>{selected?.label ?? placeholder}</Text></View>
      </Pressable>
      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <Pressable accessibilityLabel="Fechar seleção" onPress={() => setOpen(false)} style={StyleSheet.absoluteFill} />
          <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.header}><Text style={[styles.title, { color: theme.colors.text }]}>{label}</Text><Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}><Text style={{ color: theme.colors.primaryStrong }}>Fechar</Text></Pressable></View>
            <FlatList data={options} keyExtractor={option => option.value} ListEmptyComponent={<Text style={{ color: theme.colors.textSecondary }}>Nenhuma opção disponível.</Text>} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: item.value === value }} onPress={() => { onChange(item.value); setOpen(false); }} style={[styles.option, { borderBottomColor: theme.colors.border }]}><View style={styles.selection}>{item.icon ? <Icon name={item.icon} size={18} /> : null}<Text style={[styles.value, { color: item.value === value ? theme.colors.primaryStrong : theme.colors.text }]}>{item.label}</Text></View>{item.value === value ? <Icon name="check" size={18} /> : null}</Pressable>} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { borderRadius: 14, borderWidth: 1, minHeight: 64, justifyContent: 'center', marginBottom: 10, paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 11, marginBottom: 3 },
  value: { fontSize: 16 },
  selection: { alignItems: 'center', flexDirection: 'row', gap: 10, flexShrink: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', maxWidth: 480, padding: 20, paddingBottom: 32, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  close: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  option: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
});
