import { CalendarBlock } from '../store/types';

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
}

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

  private initializeTables(): void {
    console.log('Initializing database tables...');

    // Check if categories table exists
    const tableExists = this.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
    );

    if (tableExists.length === 0) {
      console.log('Categories table does not exist - creating it...');
      // Categories table doesn't exist - first time setup
      this.run(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL,
          sort_order INTEGER NOT NULL
        )
      `);

      // Create default General category
      this.run(
        'INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)',
        ['General', '#90A4AE', 0]
      );
      console.log('Created default "General" category');
    }

    // Check if blocks table has category_id column
    const columnsResult = this.all("PRAGMA table_info(blocks)");
    const hasCategoryId = columnsResult.some((col: any) => col.name === 'category_id');

    if (!hasCategoryId) {
      console.log('Blocks table missing category_id - migrating...');
      // Migrate blocks table to add category_id
      this.run(`
        CREATE TABLE blocks_new (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          start TEXT NOT NULL,
          end TEXT NOT NULL,
          category_id INTEGER,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `);

      this.run('INSERT INTO blocks_new (id, title, start, end) SELECT id, title, start, end FROM blocks');
      this.run('DROP TABLE blocks');
      this.run('ALTER TABLE blocks_new RENAME TO blocks');

      // Update all blocks to use General category
      const generalCategory = this.all("SELECT id FROM categories WHERE name = 'General' LIMIT 1");
      if (generalCategory.length > 0) {
        this.run('UPDATE blocks SET category_id = ? WHERE category_id IS NULL', [generalCategory[0].id]);
        console.log('Assigned all existing blocks to "General" category');
      }
    }

    console.log('Database initialization complete');
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

    return rows.map((row: any) => {
      const block: any = {
        id: row.id,
        title: row.title,
        start: new Date(row.start),
        end: new Date(row.end),
      };
      // Include categoryId if it exists
      if (row.category_id !== undefined && row.category_id !== null) {
        block.categoryId = row.category_id;
      }
      return block;
    });
  }

  // CATEGORY CRUD METHODS
  getAllCategories(): Category[] {
    const rows = this.all('SELECT * FROM categories ORDER BY sort_order ASC');
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      sortOrder: row.sort_order,
    }));
  }

  addCategory(name: string, color: string): Category {
    // Get max sort_order
    const maxOrder = this.all('SELECT MAX(sort_order) as max FROM categories');
    const sortOrder = (maxOrder[0]?.max ?? -1) + 1;

    this.run(
      'INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)',
      [name, color, sortOrder]
    );

    // Get the newly created category
    const rows = this.all('SELECT * FROM categories WHERE name = ?', [name]);
    const row = rows[0];

    return {
      id: row.id,
      name: row.name,
      color: row.color,
      sortOrder: row.sort_order,
    };
  }

  updateCategory(id: number, updates: { name?: string; color?: string }): void {
    if (updates.name !== undefined) {
      this.run('UPDATE categories SET name = ? WHERE id = ?', [updates.name, id]);
    }
    if (updates.color !== undefined) {
      this.run('UPDATE categories SET color = ? WHERE id = ?', [updates.color, id]);
    }
  }

  deleteCategory(id: number): void {
    // Check if any blocks use this category
    const blocks = this.all('SELECT COUNT(*) as count FROM blocks WHERE category_id = ?', [id]);
    if (blocks[0].count > 0) {
      throw new Error(`Cannot delete category: ${blocks[0].count} block(s) are using this category`);
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
    return rows[0].count;
  }

  updateBlockCategory(blockId: number, categoryId: number): void {
    this.run(
      'UPDATE blocks SET category_id = ? WHERE id = ?',
      [categoryId, blockId]
    );
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

  // Create blocks table if it doesn't exist (for brand new databases)
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL
    );
  `);

  dbInstance = new BlocksDatabase(db);

  // Initialize/migrate tables
  dbInstance['initializeTables']();

  console.log('Database opened');

  return dbInstance;
}

export function getDatabase(): BlocksDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return dbInstance;
}
