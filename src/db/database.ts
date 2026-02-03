import { CalendarBlock } from '../store/types';

class BlocksDatabase {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  private run(sql: string, params?: any[]): void {
    console.log('SQL run:', sql, 'params:', params);
    this.db.run(sql, params);
  }

  private all(sql: string, params?: any[]): any[] {
    console.log('SQL all:', sql, 'params:', params);
    const rows = this.db.all(sql, params);
    console.log('SQL result:', rows.length, 'rows');
    return rows;
  }

  addBlock(block: CalendarBlock): void {
    this.run(
      'INSERT INTO blocks (id, title, start, end) VALUES (?, ?, ?, ?)',
      [block.id, block.title, block.start.toISOString(), block.end.toISOString()]
    );
  }

  deleteBlock(id: number): void {
    this.run('DELETE FROM blocks WHERE id = ?', [id]);
  }

  updateBlockTime(id: number, start: Date, end: Date): void {
    this.run(
      'UPDATE blocks SET start = ?, end = ? WHERE id = ?',
      [start.toISOString(), end.toISOString(), id]
    );
  }

  updateBlockTitle(id: number, title: string): void {
    this.run(
      'UPDATE blocks SET title = ? WHERE id = ?',
      [title, id]
    );
  }

  getAllBlocks(): CalendarBlock[] {
    const rows = this.all('SELECT * FROM blocks');

    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      start: new Date(row.start),
      end: new Date(row.end),
    }));
  }

  getBlocksByDateRange(start: Date, end: Date): CalendarBlock[] {
    const rows = this.all(
      'SELECT * FROM blocks WHERE start < ? AND end > ?',
      [end.toISOString(), start.toISOString()]
    );

    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      start: new Date(row.start),
      end: new Date(row.end),
    }));
  }

  close(): void {
    this.db.close();
  }
}

let dbInstance: BlocksDatabase | null = null;

export function openDatabase(filename: string): BlocksDatabase {
  console.log('Opening database:', filename);

  const { Database } = require('node-sqlite3-wasm');
  const db = new Database(filename);

  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL
    );
  `);

  console.log('Database opened');

  dbInstance = new BlocksDatabase(db);
  return dbInstance;
}

export function getDatabase(): BlocksDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return dbInstance;
}
