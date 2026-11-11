import {
  addNotificationResponseReceivedListener,
  AndroidImportance,
  cancelScheduledNotificationAsync,
  clearLastNotificationResponseAsync,
  getAllScheduledNotificationsAsync,
  getLastNotificationResponseAsync,
  getPermissionsAsync,
  IosAuthorizationStatus,
  NotificationResponse,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { Platform } from 'react-native';
import { Destination, NotificationAdapter } from '../../features/notifications/notification-service';
import { AppError } from '../../domain/core';

export const notificationAdapter: NotificationAdapter = {
  supported: true,
  async permission(request) {
    if (Platform.OS === 'android') await setNotificationChannelAsync('finanzy-reminders', { name: 'Lembretes financeiros', importance: AndroidImportance.DEFAULT });
    let permission = await getPermissionsAsync();
    if (request && !permission.granted && permission.canAskAgain) permission = await requestPermissionsAsync();
    return permission.granted || permission.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  },
  async list() { return (await getAllScheduledNotificationsAsync()).filter(n => typeof n.content.data?.finanzyKey === 'string').map(n => ({ id: n.identifier, key: n.content.data!.finanzyKey as string })); },
  async schedule(key, at, notice) {
    try { return await scheduleNotificationAsync({ content: { title: notice.title, body: notice.body, data: { finanzyKey: key, destination: notice.destination } }, trigger: { type: SchedulableTriggerInputTypes.DATE, date: at, channelId: 'finanzy-reminders' } }); }
    catch { throw new AppError('STORAGE_ERROR', 'Pagamento salvo, mas não foi possível atualizar os lembretes.'); }
  },
  async cancel(id) { await cancelScheduledNotificationAsync(id); },
  listen(listener) {
    setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
    const handle = (response: NotificationResponse) => {
      const destination = response.notification.request.content.data?.destination as Destination | undefined;
      if (destination?.screen === 'budgets' || (destination?.screen === 'occurrence' && Number.isSafeInteger(destination.id) && destination.id > 0)) listener(destination);
    };
    const subscription = addNotificationResponseReceivedListener(handle);
    void getLastNotificationResponseAsync().then(response => { if (response) { handle(response); void clearLastNotificationResponseAsync(); } }).catch(() => undefined);
    return () => subscription.remove();
  },
};
