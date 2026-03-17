import Database from "better-sqlite3";
import type { D1Database, D1PreparedStatement } from "@/lib/db";
import { readFileSync } from "fs";
import { resolve } from "path";

class SqlitePreparedStatement implements D1PreparedStatement {
  private boundValues: (string | number | boolean | null)[] = [];

  constructor(
    private sql: string,
    private db: Database.Database
  ) {}

  bind(...values: (string | number | boolean | null)[]): D1PreparedStatement {
    this.boundValues = values;
    return this;
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    try {
      const stmt = this.db.prepare(this.sql);
      const row = stmt.get(...this.boundValues);
      return (row as T) ?? null;
    } catch {
      return null;
    }
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    try {
      const stmt = this.db.prepare(this.sql);
      const rows = stmt.all(...this.boundValues);
      return { results: rows as T[] };
    } catch {
      return { results: [] };
    }
  }

  async run(): Promise<{ meta: { changes: number } }> {
    try {
      const stmt = this.db.prepare(this.sql);
      const info = stmt.run(...this.boundValues);
      return { meta: { changes: info.changes } };
    } catch {
      return { meta: { changes: 0 } };
    }
  }
}

export class SqliteD1Database implements D1Database {
  private db: Database.Database;

  constructor() {
    this.db = new Database(":memory:");
    // Load schema
    const schemaPath = resolve(__dirname, "../../../schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    this.db.exec(schema);
  }

  prepare(query: string): D1PreparedStatement {
    return new SqlitePreparedStatement(query, this.db);
  }

  async exec(query: string): Promise<void> {
    this.db.exec(query);
  }

  async batch(statements: D1PreparedStatement[]): Promise<Array<{ results?: unknown[] }>> {
    const results: Array<{ results?: unknown[] }> = [];
    for (const stmt of statements) {
      try {
        await stmt.run();
        results.push({ results: [] });
      } catch {
        results.push({ results: [] });
      }
    }
    return results;
  }

  close() {
    this.db.close();
  }
}

export function createSqliteD1(): SqliteD1Database {
  return new SqliteD1Database();
}
