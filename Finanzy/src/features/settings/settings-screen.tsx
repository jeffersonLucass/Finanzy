import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { ErrorState, LoadingState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { SettingsRow } from '../../components/ui/SettingsRow';
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
  const [editing, setEditing] = useState<'theme' | 'period' | 'reminders' | null>(null);
  const update = useCallback((patch: Partial<Omit<Settings, 'version'>>) => getRuntime().then(runtime => runtime.settings.update(patch)), []);
  const updateAction = useAsyncAction(update, query.reload);
  const clear = useCallback(() => getRuntime().then(runtime => runtime.dataManagement.clearFinancialData()), []);
  const reset = useCallback(() => getRuntime().then(runtime => runtime.dataManagement.resetApplication()), []);
  const clearAction = useAsyncAction(clear, query.reload);
  const resetAction = useAsyncAction(reset, () => router.replace('/onboarding'));
  const toggleNotifications = useCallback((enabled: boolean) => getRuntime().then(runtime => runtime.notifications.enable(enabled)), []);
  const notificationAction = useAsyncAction(toggleNotifications, query.reload);
  const signOut = useCallback(() => getRuntime().then(runtime => runtime.session.signOut()), []);
  const logoutAction = useAsyncAction(signOut, () => router.replace('/onboarding'));
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
      <SettingsRow hint="Claro, escuro ou sistema" icon="chart-pie" label="Tema" onPress={() => setEditing('theme')} value={settings.theme === 'light' ? 'Claro' : settings.theme === 'dark' ? 'Escuro' : 'Sistema'} />
      <Text style={[styles.section, { color: theme.colors.text }]}>Preferências</Text>
      <SettingsRow hint="Real brasileiro" icon="banknote" label="Moeda" value="BRL" />
      <SettingsRow hint="Primeiro dia" icon="calendar" label="Mês financeiro" onPress={() => setEditing('period')} value={String(settings.monthStartDay)} />
      <SettingsRow hint="Alertas e lembretes" icon="bell" label="Notificações" onPress={() => setEditing('reminders')} value={settings.notificationsEnabled ? 'Ativas' : 'Desativadas'} />
      <Text style={[styles.section, { color: theme.colors.text }]}>Dados</Text>
      <SettingsRow hint="CSV ou PDF" icon="file-text" label="Exportar dados" onPress={() => router.push('/settings/export')} />
      <SettingsRow danger hint="Remover movimentações" icon="receipt" label="Limpar dados" onPress={confirmClear} />
      <SettingsRow danger hint="Voltar ao início" icon="refresh" label="Redefinir aplicativo" onPress={confirmReset} />
      <SettingsRow hint="Seus dados permanecem no aparelho" icon="logout" label="Sair" onPress={() => run(logoutAction.execute())} />
      <Modal animationType="slide" onRequestClose={() => setEditing(null)} transparent visible={editing !== null}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}><Pressable accessibilityLabel="Fechar preferências" onPress={() => setEditing(null)} style={StyleSheet.absoluteFill} /><View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.colors.surface }]}><Text style={[styles.section, { color: theme.colors.text }]}>{editing === 'theme' ? 'Tema' : editing === 'period' ? 'Mês financeiro' : 'Notificações'}</Text>
          {editing === 'theme' ? <SegmentedControl onChange={value => run(updateAction.execute({ theme: value }))} options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'system', label: 'Sistema' }]} value={settings.theme} /> : null}
          {editing === 'period' ? <FormField inputKind="integer" label="Primeiro dia (1 a 28)" max={28} maxLength={2} min={1} onEndEditing={event => run(updateAction.execute({ monthStartDay: Number(event.nativeEvent.text) }))} required defaultValue={String(settings.monthStartDay)} /> : null}
          {editing === 'reminders' ? <><FormField autoCapitalize="none" autoCorrect={false} inputKind="timezone" label="Fuso horário" maxLength={100} onEndEditing={event => run(updateAction.execute({ timezone: event.nativeEvent.text }))} required defaultValue={settings.timezone} /><FormField inputKind="integer" label="Hora dos lembretes (0 a 23)" max={23} maxLength={2} min={0} onEndEditing={event => run(updateAction.execute({ reminderHour: Number(event.nativeEvent.text) }))} required defaultValue={String(settings.reminderHour)} /><Button label={settings.notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'} loading={notificationAction.loading} onPress={() => run(notificationAction.execute(!settings.notificationsEnabled))} /></> : null}
          {feedback ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback}</Text> : null}<Button label="Concluir" onPress={() => setEditing(null)} variant="ghost" />
        </View></View>
      </Modal>
      {feedback || updateAction.error || notificationAction.error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback || errorMessage(updateAction.error || notificationAction.error)}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '600', marginBottom: 9, marginTop: 14 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxWidth: 480, padding: 20, width: '100%' },
  error: { fontSize: 13, marginTop: 10, textAlign: 'center' },
});
