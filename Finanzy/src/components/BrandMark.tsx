import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function BrandMark() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]} accessible={false}>
      <Text style={[styles.letter, { color: theme.colors.onPrimary }]}>F</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 22,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  letter: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 46,
  },
});
