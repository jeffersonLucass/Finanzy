import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../components/BrandMark';

export function SplashScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.brand}>
        <BrandMark />
        <Text style={styles.title}>Finanzy</Text>
        <Text style={styles.tagline}>Seu dinheiro, mais organizado.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    transform: [{ translateY: 12 }],
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: 10,
  },
  tagline: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
});
