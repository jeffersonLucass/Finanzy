import { StyleSheet, Text, View } from 'react-native';

export function BrandMark() {
  return (
    <View style={styles.container} accessible={false}>
      <Text style={styles.letter}>F</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 22,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  letter: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 46,
  },
});
