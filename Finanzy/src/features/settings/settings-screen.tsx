import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { errorMessage } from '../../domain/core';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useAsyncQuery } from '../../hooks/use-async-query';
import { useTheme } from '../../theme/ThemeProvider';
import { Settings } from './settings-service';

export function SettingsScreen() {
  const { theme } = useTheme();
  const load = useCallback(() => getRuntime().then(runtime => runtime.settings.get()), []);
  const query = useAsyncQuery(load);
  const [feedback, setFeedback] = useState('');
  const update = useCallback((patch: Partial<Omit<Settings, 'version'>>) => getRuntime().then(runtime => runtime.settings.update(patch)), []);
  const updateAction = useAsyncAction(update, query.reload);
  const clear = useCallback(() => getRuntime().then(runtime => runtime.dataManagement.clearFinancialData()), []);
  const reset = useCallback(() => getRuntime().then(runtime => runtime.dataManagement.resetApplication()), []);
  const clearAction = useAsyncAction(clear, query.reload);
  const resetAction = useAsyncAction(reset, () => router.replace('/onboarding'));
  const toggleNotifications = useCallback((enabled: boolean) => getRuntime().then(runtime => runtime.notifications.enable(enabled)), []);
  const notificationAction = useAsyncAction(toggleNotifications, query.reload);
  const run = <T,>(promise: Promise<T>) => void promise.catch(error => setFeedback(errorMessage(error)));
  if (query.loading && !query.data) return <AppScreen><LoadingState /></AppScreen>;
  if (query.error || !query.data) return <AppScreen><AppHeader back title="Configurações" /><ErrorState error={query.error} onRetry={query.reload} /></AppScreen>;
  const settings = query.data;
  const confirmClear = () => Alert.alert('Limpar dados financeiros?', 'Transações, orçamentos, metas e gastos mensais serão removidos. Perfil e preferências serão preservados.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Limpar', style: 'destructive', onPress: () => run(clearAction.execute()) }]);
  const confirmReset = () => Alert.alert('Redefinir aplicativo?', 'Todos os dados, perfil e preferências serão removidos.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Redefinir tudo', style: 'destructive', onPress: () => run(resetAction.execute()) }]);
  return (
    <AppScreen>
      <AppHeader back title="Configurações" />
      <Text style={[styles.section, { color: theme.colors.text }]}>Aparência</Text>
      <Card style={styles.card}><SegmentedControl onChange={value => run(updateAction.execute({ theme: value }))} options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'system', label: 'Sistema' }]} value={settings.theme} /></Card>
      <Text style={[styles.section, { color: theme.colors.text }]}>Preferências</Text>
      <Card style={styles.card}>
        <Setting label="Moeda" value="Real brasileiro (BRL)" />
        <FormField keyboardType="number-pad" label="Dia inicial do mês financeiro" onEndEditing={event => run(updateAction.execute({ monthStartDay: Number(event.nativeEvent.text) }))} defaultValue={String(settings.monthStartDay)} />
        <FormField label="Fuso horário" onEndEditing={event => run(updateAction.execute({ timezone: event.nativeEvent.text }))} defaultValue={settings.timezone} />
        <FormField keyboardType="number-pad" label="Hora dos lembretes" onEndEditing={event => run(updateAction.execute({ reminderHour: Number(event.nativeEvent.text) }))} defaultValue={String(settings.reminderHour)} />
        <Button label={settings.notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'} loading={notificationAction.loading} onPress={() => run(notificationAction.execute(!settings.notificationsEnabled))} variant="secondary" />
      </Card>
      <Text style={[styles.section, { color: theme.colors.text }]}>Dados</Text>
      <Card style={styles.card}>
        <Button label="Exportar dados" onPress={() => router.push('/settings/export')} variant="secondary" />
        <View style={styles.gap}><Button label="Limpar dados financeiros" loading={clearAction.loading} onPress={confirmClear} variant="danger" /></View>
        <View style={styles.gap}><Button label="Redefinir aplicativo" loading={resetAction.loading} onPress={confirmReset} variant="danger" /></View>
      </Card>
      {feedback || updateAction.error || notificationAction.error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(updateAction.error || notificationAction.error)}</Text> : null}
    </AppScreen>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return <View style={styles.setting}><Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text><Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '700', marginBottom: 9, marginTop: 8 },
  card: { marginBottom: 14 },
  setting: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '600' },
  gap: { marginTop: 10 },
  error: { fontSize: 13, marginTop: 10, textAlign: 'center' },
});
