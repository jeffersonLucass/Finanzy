import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { KeyValueStore, SqlConnection, SqlDatabase, SqlValue } from './port';

class ExpoConnection implements SqlConnection {
  constructor(protected readonly database: SQLite.SQLiteDatabase) {}

  exec(sql: string) {
    return this.database.execAsync(sql);
  }

  all<T>(sql: string, params: SqlValue[] = []) {
    return this.database.getAllAsync<T>(sql, params);
  }

  async run(sql: string, params: SqlValue[] = []) {
    const result = await this.database.runAsync(sql, params);
    return { lastInsertRowId: result.lastInsertRowId, changes: result.changes };
  }
}

export class ExpoSqlDatabase extends ExpoConnection implements SqlDatabase {
  async transaction<T>(work: (connection: SqlConnection) => Promise<T>): Promise<T> {
    let value: T | undefined;
    await this.database.withTransactionAsync(async () => {
      value = await work(new ExpoConnection(this.database));
    });
    return value as T;
  }
}

export const keyValueStore: KeyValueStore = {
  getItem: key => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: key => AsyncStorage.removeItem(key),
};

export async function openFinanzyDatabase() {
  const database = await SQLite.openDatabaseAsync('finanzy.db');
  await database.execAsync('PRAGMA journal_mode=WAL;');
  return new ExpoSqlDatabase(database);
}
