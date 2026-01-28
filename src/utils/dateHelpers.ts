import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';

// Convert Date to ISO string for database storage
export function dateToISO(date: Date): string {
  return date.toISOString();
}

// Parse ISO string from database to Date
export function isoToDate(iso: string): Date {
  return parseISO(iso);
}

// Get start of week for a given date
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
}

// Get end of week for a given date
export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 0 });
}

// Format date for display
export function formatDate(date: Date, formatStr: string = 'PPP'): string {
  return format(date, formatStr);
}

// Format time for display
export function formatTime(date: Date): string {
  return format(date, 'p'); // Localized time format
}

// Format datetime for display
export function formatDateTime(date: Date): string {
  return format(date, 'PPp'); // Localized date and time format
}
