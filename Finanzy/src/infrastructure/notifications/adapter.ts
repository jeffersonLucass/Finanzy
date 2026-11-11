import { AppError } from '../../domain/core';
import { NotificationAdapter } from '../../features/notifications/notification-service';
export const notificationAdapter: NotificationAdapter = {
  supported: false, permission: async () => false, list: async () => [],
  schedule: async () => { throw new AppError('UNSUPPORTED_PLATFORM', 'Notificação nativa indisponível nesta plataforma.'); },
  cancel: async () => {}, listen: () => () => {},
};
