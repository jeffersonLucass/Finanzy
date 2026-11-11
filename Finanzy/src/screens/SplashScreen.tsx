import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../components/BrandMark';
import { useTheme } from '../theme/ThemeProvider';

export function SplashScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.brand}>
        <BrandMark large />
        <Text style={[styles.title, { color: theme.colors.text }]}>Finanzy</Text>
        <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>Seu dinheiro, mais organizado.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    transform: [{ translateY: 12 }],
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    marginTop: 12,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
});
