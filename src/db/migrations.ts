export interface Migration {
  version: number;
  description: string;
  up: (db: any) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Create categories table with default General category',
    up: (db: any) => {
      db.run(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL,
          sort_order INTEGER NOT NULL
        )
      `);

      // Create default General category
      db.run(
        'INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)',
        ['General', '#90A4AE', 0]
      );
    }
  },
  {
    version: 2,
    description: 'Add category_id column to blocks table',
    up: (db: any) => {
      // SQLite doesn't support ALTER TABLE ADD COLUMN with FOREIGN KEY
      // Must recreate table
      db.run(`
        CREATE TABLE blocks_new (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          start TEXT NOT NULL,
          end TEXT NOT NULL,
          category_id INTEGER,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `);

      db.run('INSERT INTO blocks_new (id, title, start, end) SELECT id, title, start, end FROM blocks');
      db.run('DROP TABLE blocks');
      db.run('ALTER TABLE blocks_new RENAME TO blocks');

      // Assign all existing blocks to General category
      const generalCategory = db.all("SELECT id FROM categories WHERE name = 'General' LIMIT 1");
      if (generalCategory.length > 0) {
        db.run('UPDATE blocks SET category_id = ? WHERE category_id IS NULL', [generalCategory[0].id]);
      }
    }
  },
  // Future migrations go here...
];

// Validate migrations are in correct order
migrations.forEach((migration, index) => {
  if (migration.version !== index + 1) {
    throw new Error(
      `Migration version mismatch: expected ${index + 1}, got ${migration.version}`
    );
  }
});
