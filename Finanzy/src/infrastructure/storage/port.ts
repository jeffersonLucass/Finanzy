export type SqlValue = string | number | null;
export interface SqlConnection {
  exec(sql: string): Promise<void>;
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  run(sql: string, params?: SqlValue[]): Promise<{ lastInsertRowId: number; changes: number }>;
}
export interface SqlDatabase extends SqlConnection {
  transaction<T>(work: (connection: SqlConnection) => Promise<T>): Promise<T>;
}
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
