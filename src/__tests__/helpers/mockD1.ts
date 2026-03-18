/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { D1Database, D1PreparedStatement } from "@/db";

// Simple SQL parser for basic operations
function parseSQL(sql: string): {
  operation: string;
  table: string;
  columns?: string[];
  values?: any[];
  where?: { [key: string]: number };
} {
  const normalizedSQL = sql.trim().toLowerCase();

  if (normalizedSQL.startsWith("insert into")) {
    const match = sql.match(/insert into\s+(\w+)\s*\((.*?)\)\s*values\s*\(/i);
    if (match) {
      const table = match[1];
      const columns = match[2].split(",").map((c) => c.trim().replace(/["`]/g, ""));
      return { operation: "insert", table, columns };
    }
  }

  if (normalizedSQL.startsWith("select")) {
    const match = sql.match(/from\s+(\w+)/i);
    const table = match?.[1] || "";
    const whereMatch = sql.match(/where\s+(.+?)(\s+order\s+by|\s+limit|$)/i);
    const where: { [key: string]: number } = {};
    if (whereMatch) {
      // Simple where parsing - just handle "column = ?" patterns
      const whereClause = whereMatch[1];
      const conditions = whereClause.split("and").map((c) => c.trim());
      let bindIndex = 0;
      for (const condition of conditions) {
        const condMatch = condition.match(/(\w+)\s*=\s*\?/);
        if (condMatch) {
          where[condMatch[1]] = bindIndex++;
        }
      }
    }
    return { operation: "select", table, where };
  }

  if (normalizedSQL.startsWith("update")) {
    const match = sql.match(/update\s+(\w+)/i);
    const table = match?.[1] || "";
    return { operation: "update", table };
  }

  if (normalizedSQL.startsWith("delete")) {
    const match = sql.match(/from\s+(\w+)/i);
    const table = match?.[1] || "";
    return { operation: "delete", table };
  }

  return { operation: "unknown", table: "" };
}

class MockPreparedStatement implements D1PreparedStatement {
  private boundValues: any[] = [];
  private parsedSQL: ReturnType<typeof parseSQL>;

  constructor(
    private sql: string,
    private storage: Map<string, Map<string, any>>
  ) {
    this.parsedSQL = parseSQL(sql);
  }

  bind(...values: any[]): D1PreparedStatement {
    this.boundValues = values;
    return this;
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const results = await this.executeQuery();
    return results.length > 0 ? (results[0] as T) : null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const results = await this.executeQuery();
    return { results: results as T[] };
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const results = await this.executeQuery();
    return { meta: { changes: results.length || 1 } };
  }

  private async executeQuery(): Promise<any[]> {
    const { operation, table, columns } = this.parsedSQL;

    if (!this.storage.has(table)) {
      this.storage.set(table, new Map());
    }

    const tableData = this.storage.get(table)!;

    switch (operation) {
      case "insert": {
        if (!columns) return [];

        const id = this.boundValues[0] || `mock_${Date.now()}_${Math.random()}`;
        const record: any = {};

        columns.forEach((col, index) => {
          record[col] = this.boundValues[index];
        });

        tableData.set(record.id || id, record);
        return [{ meta: { changes: 1 } }];
      }

      case "select": {
        const results: any[] = [];
        const { where } = this.parsedSQL;

        for (const [id, record] of tableData) {
          let matches = true;

          if (where && Object.keys(where).length > 0) {
            for (const [column, bindIndex] of Object.entries(where)) {
              if (record[column] !== this.boundValues[bindIndex]) {
                matches = false;
                break;
              }
            }
          }

          if (matches) {
            results.push({ ...record });
          }
        }

        return results;
      }

      case "update": {
        // Simple update - this is a simplified implementation
        // In real scenarios, we'd parse SET clauses
        return [{ meta: { changes: 1 } }];
      }

      case "delete": {
        // Simple delete - this is a simplified implementation
        return [{ meta: { changes: 1 } }];
      }

      default:
        return [];
    }
  }
}

export class MockD1Database implements D1Database {
  private storage = new Map<string, Map<string, any>>();

  constructor() {
    // Initialize tables
    this.storage.set("games", new Map());
    this.storage.set("players", new Map());
    this.storage.set("game_players", new Map());
    this.storage.set("messages", new Map());
    this.storage.set("game_actions", new Map());
    this.storage.set("missions", new Map());
  }

  prepare(query: string): D1PreparedStatement {
    return new MockPreparedStatement(query, this.storage);
  }

  async exec(_query: string): Promise<void> {
    // Simple exec implementation
  }

  async batch(statements: D1PreparedStatement[]): Promise<Array<{ results?: unknown[] }>> {
    const results: Array<{ results?: unknown[] }> = [];

    for (const statement of statements) {
      try {
        const result = await statement.all();
        results.push({ results: result.results });
      } catch (error) {
        results.push({ results: [] });
      }
    }

    return results;
  }

  // Helper methods for testing
  getTable(tableName: string): Map<string, any> {
    return this.storage.get(tableName) || new Map();
  }

  setTableData(tableName: string, data: Map<string, any>): void {
    this.storage.set(tableName, data);
  }

  clear(): void {
    this.storage.clear();
    // Reinitialize tables
    this.storage.set("games", new Map());
    this.storage.set("players", new Map());
    this.storage.set("game_players", new Map());
    this.storage.set("messages", new Map());
    this.storage.set("game_actions", new Map());
    this.storage.set("missions", new Map());
  }

  // Helper to seed test data
  seed(tableName: string, records: Array<{ id: string; [key: string]: any }>): void {
    const table = new Map();
    for (const record of records) {
      table.set(record.id, record);
    }
    this.storage.set(tableName, table);
  }
}

export function createMockD1Database(): MockD1Database {
  return new MockD1Database();
}
