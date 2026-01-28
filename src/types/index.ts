// Core type definitions for the calendar application

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_time: string; // ISO 8601 datetime string
  end_time: string;   // ISO 8601 datetime string
  created_at?: string;
  updated_at?: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
}

export interface DatabaseConfig {
  path: string;
  verbose?: boolean;
}

// Type for react-big-calendar events
export interface BigCalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: CalendarEvent;
}
