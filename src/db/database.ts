import { CalendarBlock } from '../store/types';
import { runMigrations } from './migrationRunner';
import type { Database, BindValues, QueryResult } from 'node-sqlite3-wasm';

export const PASTEL_COLORS = [
  '#E57373', // Coral Pink
  '#FF8A65', // Peach
  '#FFD54F', // Golden Yellow
  '#AED581', // Lime Green
  '#4DB6AC', // Teal/Mint
  '#4DD0E1', // Cyan
  '#64B5F6', // Sky Blue
  '#9575CD', // Lavender
  '#F06292', // Magenta
  '#F48FB1', // Rose Pink
  '#FFAB91', // Light Coral
  '#FFF176', // Lemon Yellow
  '#81C784', // Soft Green
  '#4FC3F7', // Light Blue
  '#BA68C8', // Purple
  '#90A4AE', // Blue Gray
];

export interface Category {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  includeInTotals: boolean;
}

class BlocksDatabase {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private run(sql: string, params?: BindValues): void {
    console.log('SQL run:', sql, 'params:', params);
    this.db.run(sql, params);
  }

  private all(sql: string, params?: BindValues): QueryResult[] {
    console.log('SQL all:', sql, 'params:', params);
    const rows = this.db.all(sql, params);
    console.log('SQL result:', rows.length, 'rows');
    return rows;
  }


  addBlock(block: CalendarBlock): void {
    // Support both old format (no categoryId) and new format (with categoryId)
    const categoryId = (block as any).categoryId;
    if (categoryId !== undefined) {
      this.run(
        'INSERT INTO blocks (id, title, start, end, category_id) VALUES (?, ?, ?, ?, ?)',
        [block.id, block.title, block.start.toISOString(), block.end.toISOString(), categoryId]
      );
    } else {
      this.run(
        'INSERT INTO blocks (id, title, start, end) VALUES (?, ?, ?, ?)',
        [block.id, block.title, block.start.toISOString(), block.end.toISOString()]
      );
    }
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

    return rows.map((row) => ({
      id: row.id as number,
      title: row.title as string,
      start: new Date(row.start as string),
      end: new Date(row.end as string),
    }));
  }

  getBlocksByDateRange(start: Date, end: Date): CalendarBlock[] {
    const rows = this.all(
      'SELECT * FROM blocks WHERE start < ? AND end > ?',
      [end.toISOString(), start.toISOString()]
    );

    return rows.map((row) => {
      const block: CalendarBlock & { categoryId?: number } = {
        id: row.id as number,
        title: row.title as string,
        start: new Date(row.start as string),
        end: new Date(row.end as string),
      };
      // Include categoryId if it exists
      if (row.category_id !== undefined && row.category_id !== null) {
        block.categoryId = row.category_id as number;
      }
      return block;
    });
  }

  // CATEGORY CRUD METHODS
  getAllCategories(): Category[] {
    const rows = this.all('SELECT * FROM categories ORDER BY sort_order ASC');
    return rows.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      color: row.color as string,
      sortOrder: row.sort_order as number,
      includeInTotals: (row.include_in_totals as number) === 1,
    }));
  }

  addCategory(name: string, color: string, includeInTotals: boolean = true): Category {
    // Get max sort_order
    const maxOrder = this.all('SELECT MAX(sort_order) as max FROM categories');
    const sortOrder = ((maxOrder[0]?.max as number | null) ?? -1) + 1;

    this.run(
      'INSERT INTO categories (name, color, sort_order, include_in_totals) VALUES (?, ?, ?, ?)',
      [name, color, sortOrder, includeInTotals ? 1 : 0]
    );

    // Get the newly created category
    const rows = this.all('SELECT * FROM categories WHERE name = ?', [name]);
    const row = rows[0];

    return {
      id: row.id as number,
      name: row.name as string,
      color: row.color as string,
      sortOrder: row.sort_order as number,
      includeInTotals: (row.include_in_totals as number) === 1,
    };
  }

  updateCategory(id: number, updates: { name?: string; color?: string; includeInTotals?: boolean }): void {
    if (updates.name !== undefined) {
      this.run('UPDATE categories SET name = ? WHERE id = ?', [updates.name, id]);
    }
    if (updates.color !== undefined) {
      this.run('UPDATE categories SET color = ? WHERE id = ?', [updates.color, id]);
    }
    if (updates.includeInTotals !== undefined) {
      this.run('UPDATE categories SET include_in_totals = ? WHERE id = ?', [updates.includeInTotals ? 1 : 0, id]);
    }
  }

  deleteCategory(id: number): void {
    // Check if any blocks use this category
    const blocks = this.all('SELECT COUNT(*) as count FROM blocks WHERE category_id = ?', [id]);
    const count = blocks[0]?.count as number;
    if (count > 0) {
      throw new Error(`Cannot delete category: ${count} block(s) are using this category`);
    }

    this.run('DELETE FROM categories WHERE id = ?', [id]);
  }

  updateCategorySortOrder(categories: Category[]): void {
    categories.forEach((category, index) => {
      this.run(
        'UPDATE categories SET sort_order = ? WHERE id = ?',
        [index, category.id]
      );
    });
  }

  getBlockCountByCategory(categoryId: number): number {
    const rows = this.all(
      'SELECT COUNT(*) as count FROM blocks WHERE category_id = ?',
      [categoryId]
    );
    return rows[0].count as number;
  }

  updateBlockCategory(blockId: number, categoryId: number): void {
    this.run(
      'UPDATE blocks SET category_id = ? WHERE id = ?',
      [categoryId, blockId]
    );
  }

  getNextUpcomingBlock(startTime: Date, endTime: Date): CalendarBlock | null {
    const rows = this.all(
      'SELECT * FROM blocks WHERE start >= ? AND start < ? ORDER BY start ASC LIMIT 1',
      [startTime.toISOString(), endTime.toISOString()]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const block: CalendarBlock & { categoryId?: number } = {
      id: row.id as number,
      title: row.title as string,
      start: new Date(row.start as string),
      end: new Date(row.end as string),
    };

    if (row.category_id !== undefined && row.category_id !== null) {
      block.categoryId = row.category_id as number;
    }

    return block;
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

  // Create blocks table skeleton (for brand new databases)
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL
    );
  `);

  // Run migration system
  const migrationResult = runMigrations(db, filename);

  if (!migrationResult.success) {
    const errorMsg = `Database migration failed: ${migrationResult.error?.message}`;
    console.error(errorMsg);

    // Show error to user (NW.js alert)
    if (typeof nw !== 'undefined') {
      nw.Window.get().show();
      alert(`Database migration failed!\n\n${migrationResult.error?.message}\n\nThe database has been restored from backup. Please check the console for details.`);
    }

    throw new Error(errorMsg);
  }

  dbInstance = new BlocksDatabase(db);

  console.log('Database opened successfully');

  return dbInstance;
}

export function getDatabase(): BlocksDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return dbInstance;
}
