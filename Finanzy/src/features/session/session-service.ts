import { text } from '../../domain/core';
import { FinanceContext } from '../../application/finance-context';

export class SessionService {
  constructor(private readonly finance: FinanceContext) {}
  async getProfile() { return this.finance.store.read(async repository => (await repository.list('profile'))[0] ?? null); }
  async getState() {
    const [profile, settings] = await Promise.all([this.getProfile(), this.finance.settings.get()]);
    return { profile, isSessionActive: settings.isSessionActive };
  }
  async signIn(name: string) {
    const at = this.finance.clock().toISOString();
    const validName = text(name);
    const profile = await this.finance.store.write(async repository => {
      const current = (await repository.list('profile'))[0];
      return current ? repository.update('profile', 1, { name: validName, updatedAt: at }) : repository.insert('profile', { id: 1, name: validName, createdAt: at, updatedAt: at });
    });
    await this.finance.settings.update({ isSessionActive: true });
    return profile;
  }
  signOut() { return this.finance.settings.update({ isSessionActive: false }); }
}
