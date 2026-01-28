import Database from 'better-sqlite3';
import { CalendarEvent, DatabaseConfig } from '../types';
import * as path from 'path';
import * as fs from 'fs';

class CalendarDatabase {
  private db: Database.Database;

  constructor(config: DatabaseConfig) {
    // Ensure the directory exists
    const dbDir = path.dirname(config.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(config.path, { verbose: config.verbose ? console.log : undefined });
    this.initialize();
  }

  private initialize(): void {
    // Create events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_start_time ON events(start_time);
      CREATE INDEX IF NOT EXISTS idx_end_time ON events(end_time);
    `);
  }

  // Create a new event
  createEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): CalendarEvent {
    const stmt = this.db.prepare(`
      INSERT INTO events (title, description, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(event.title, event.description || null, event.start_time, event.end_time);

    return this.getEventById(info.lastInsertRowid as number)!;
  }

  // Get event by ID
  getEventById(id: number): CalendarEvent | undefined {
    const stmt = this.db.prepare('SELECT * FROM events WHERE id = ?');
    return stmt.get(id) as CalendarEvent | undefined;
  }

  // Get all events
  getAllEvents(): CalendarEvent[] {
    const stmt = this.db.prepare('SELECT * FROM events ORDER BY start_time');
    return stmt.all() as CalendarEvent[];
  }

  // Get events within a date range
  getEventsByDateRange(startDate: string, endDate: string): CalendarEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM events
      WHERE start_time <= ? AND end_time >= ?
      ORDER BY start_time
    `);
    return stmt.all(endDate, startDate) as CalendarEvent[];
  }

  // Update an event
  updateEvent(id: number, updates: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>): CalendarEvent | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.start_time !== undefined) {
      fields.push('start_time = ?');
      values.push(updates.start_time);
    }
    if (updates.end_time !== undefined) {
      fields.push('end_time = ?');
      values.push(updates.end_time);
    }

    if (fields.length === 0) {
      return this.getEventById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE events
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.getEventById(id);
  }

  // Delete an event
  deleteEvent(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM events WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  // Close the database connection
  close(): void {
    this.db.close();
  }
}

// Singleton instance
let dbInstance: CalendarDatabase | null = null;

export function getDatabase(): CalendarDatabase {
  if (!dbInstance) {
    // Get app data directory
    const appDataPath = process.env.APPDATA ||
      (process.platform === 'darwin' ?
        path.join(process.env.HOME || '', 'Library', 'Application Support') :
        path.join(process.env.HOME || '', '.local', 'share')
      );

    const dbPath = path.join(appDataPath, 'willcal', 'calendar.db');
    dbInstance = new CalendarDatabase({ path: dbPath });
  }
  return dbInstance;
}

export { CalendarDatabase };
