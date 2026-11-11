import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from './Icon';

export function SettingsRow({ icon, label, hint, value, onPress, danger = false }: { icon: string; label: string; hint?: string; value?: string; onPress?: () => void; danger?: boolean }) {
  const { theme } = useTheme();
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={styles.row}><View style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}><Icon name={icon} /></View><View style={styles.copy}><Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>{hint ? <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>{hint}</Text> : null}</View>{value ? <Text style={[styles.value, { color: danger ? theme.colors.danger : onPress ? theme.colors.primaryStrong : theme.colors.text }]}>{value}</Text> : onPress ? <Icon color={danger ? theme.colors.danger : theme.colors.textMuted} name="chevron-right" size={16} /> : null}</Pressable>;
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 58 },
  icon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  copy: { flex: 1, marginHorizontal: 10 },
  label: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 11, marginTop: 3 },
  value: { fontSize: 12, fontWeight: '600' },
});
