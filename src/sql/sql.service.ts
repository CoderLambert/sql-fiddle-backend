import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import * as Database from 'better-sqlite3';

@Injectable()
export class SqlService {
  private readonly dataDir: string;

  constructor() {
    // 明确基于项目根目录的路径
    this.dataDir = join(process.cwd(), 'data');
    this.ensureDataDirExists();
  }

  execute(userId: number, query: string) {
    if (!userId || !query) throw new Error('userId and query are required');

    const dbPath = join(this.dataDir, `${userId}.sqlite`);
    const db = new Database(dbPath);

    try {
      const results = this.executeMultipleStatements(db, query);
      return this.formatSqlResults(results);
    } catch (err) {
      return { error: err.message };
    } finally {
      db.close();
    }
  }
  private ensureDataDirExists() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private executeMultipleStatements(db, query) {
    const results = [];
    const queries = query
      .split(';')
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    for (const sql of queries) {
      try {
        const stmt = db.prepare(sql);
        if (sql.toLowerCase().startsWith('select')) {
          results.push({ type: 'read', sql, result: stmt.all() });
        } else {
          const r = stmt.run();
          results.push({ type: 'write', sql, result: r });
        }
      } catch (err) {
        results.push({ type: 'error', sql, error: err.message });
      }
    }

    return results;
  }

  private formatSqlResults(rawResults: any[]) {
    return rawResults.map((entry) => {
      const sql = entry.sql.trim();
      const lowerSql = sql.toLowerCase();

      if (lowerSql.startsWith('select')) {
        return {
          type: 'select',
          sql,
          result: entry.result || [],
        };
      }

      if (lowerSql.startsWith('insert')) {
        return {
          type: 'insert',
          sql,
          table: /into\s+(\w+)/i.exec(sql)?.[1] ?? null,
          rowsAffected: entry.result?.changes ?? 0,
          insertedRowId: entry.result?.lastInsertRowid ?? null,
        };
      }

      if (
        lowerSql.startsWith('drop') ||
        lowerSql.startsWith('create') ||
        lowerSql.startsWith('alter')
      ) {
        return {
          type: 'ddl',
          sql,
        };
      }

      return {
        type: 'write',
        sql,
        rowsAffected: entry.result?.changes ?? 0,
        lastInsertRowid: entry.result?.lastInsertRowid ?? null,
      };
    });
  }
}
