import { CalendarEvent } from '../store/types';

class EventsDatabase {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  addEvent(event: CalendarEvent): void {
    this.db.run(
      'INSERT INTO events (id, title, start, end) VALUES (?, ?, ?, ?)',
      [event.id, event.title, event.start.toISOString(), event.end.toISOString()]
    );
  }

  deleteEvent(id: number): void {
    this.db.run('DELETE FROM events WHERE id = ?', [id]);
  }

  getAllEvents(): CalendarEvent[] {
    const rows = this.db.all('SELECT * FROM events');

    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      start: new Date(row.start),
      end: new Date(row.end),
    }));
  }

  getEventsByDateRange(start: Date, end: Date): CalendarEvent[] {
    const rows = this.db.all(
      'SELECT * FROM events WHERE start < ? AND end > ?',
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

let dbInstance: EventsDatabase | null = null;

export function openDatabase(filename: string): EventsDatabase {
  console.log('Opening database:', filename);

  const { Database } = require('node-sqlite3-wasm');
  const db = new Database(filename);

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL
    );
  `);

  console.log('Database opened');

  dbInstance = new EventsDatabase(db);
  return dbInstance;
}

export function getDatabase(): EventsDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return dbInstance;
}
