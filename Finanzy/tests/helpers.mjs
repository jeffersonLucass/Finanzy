import { DatabaseSync } from 'node:sqlite';

export class TestDatabase {
  constructor() {
    this.database = new DatabaseSync(':memory:');
  }

  async exec(sql) {
    this.database.exec(sql);
  }

  async all(sql, params = []) {
    return this.database.prepare(sql).all(...params);
  }

  async run(sql, params = []) {
    const result = this.database.prepare(sql).run(...params);
    return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
  }

  async transaction(work) {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const result = await work(this);
      this.database.exec('COMMIT');
      return result;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
}

export class MemoryKeyValue {
  values = new Map();
  async getItem(key) { return this.values.get(key) ?? null; }
  async setItem(key, value) { this.values.set(key, value); }
  async removeItem(key) { this.values.delete(key); }
}
