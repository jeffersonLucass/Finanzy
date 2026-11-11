import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { theme } = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.colors.surface }, style]}>{children}</View>;
}

const styles = StyleSheet.create({ card: { borderRadius: 18, padding: 16 } });
