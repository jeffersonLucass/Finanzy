import { FinanceContext } from '../../application/finance-context';
import { NotificationService } from '../notifications/notification-service';
import { SettingsService } from '../settings/settings-service';

export interface TemporaryFiles {
  cleanupAll(): Promise<void>;
}

export class DataManagementService {
  constructor(
    private readonly finance: FinanceContext,
    private readonly notifications: NotificationService,
    private readonly settings: SettingsService,
    private readonly files: TemporaryFiles,
  ) {}

  async clearFinancialData() {
    await this.finance.store.write(repo => repo.markMaintenance('clear'), false);
    await this.resume();
  }

  async resetApplication() {
    await this.finance.store.write(repo => repo.markMaintenance('reset'), false);
    await this.resume();
  }

  async resume() {
    const action = await this.finance.store.read(repo => repo.maintenance());
    if (!action) return;
    await this.notifications.cancelAll();
    await this.finance.store.write(async repo => {
      await repo.clearFinancial();
      if (action === 'reset') await repo.resetProfile(this.finance.clock().toISOString());
    }, false);
    if (action === 'reset') {
      await this.settings.reset();
      await this.files.cleanupAll();
    }
    await this.finance.store.write(repo => repo.finishMaintenance(), false);
  }
}
