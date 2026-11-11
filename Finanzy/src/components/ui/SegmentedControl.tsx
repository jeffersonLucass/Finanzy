import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type Option<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({ value, options, onChange }: { value: T; options: Option<T>[]; onChange: (value: T) => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable accessibilityRole="button" accessibilityState={{ selected }} hitSlop={6} key={option.value} onPress={() => onChange(option.value)} style={[styles.option, { backgroundColor: selected ? theme.colors.primary : theme.colors.chip }]}>
            <Text style={[styles.label, { color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  option: { alignItems: 'center', borderRadius: 18, minHeight: 32, paddingHorizontal: 13, justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '700' },
});
