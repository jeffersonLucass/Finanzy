import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type Option<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({ value, options, onChange }: { value: T; options: Option<T>[]; onChange: (value: T) => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.colors.surface }]}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={option.value} onPress={() => onChange(option.value)} style={[styles.option, selected && { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.label, { color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderRadius: 16, flexDirection: 'row', marginBottom: 16, padding: 4 },
  option: { alignItems: 'center', borderRadius: 13, flex: 1, minHeight: 44, justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '700' },
});
