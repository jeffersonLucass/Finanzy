import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../theme/ThemeProvider';

export default function TabLayout() {
  const { theme } = useTheme();
  return (
    <NativeTabs
      backgroundColor={theme.colors.surface}
      iconColor={{ default: theme.colors.textSecondary, selected: theme.colors.primary }}
      labelStyle={{ color: theme.colors.textSecondary, fontSize: 11 }}
      labelVisibilityMode="labeled"
      tintColor={theme.colors.primary}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Label>Transações</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="recurring">
        <NativeTabs.Trigger.Label>Gastos mensais</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.clockwise" md="repeat" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Label>Mais</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="ellipsis" md="more_horiz" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
