import { CalendarEvent, DateRange, SET_DATE_RANGE, SetDateRangeAction } from './types';
import { getDatabase } from '../db/database';

export function setDateRange(start: Date, end: Date): SetDateRangeAction {
  return {
    type: SET_DATE_RANGE,
    payload: { start, end },
  };
}

export function addEvent(event: CalendarEvent): void {
  const db = getDatabase();
  db.addEvent(event);
}

export function deleteEvent(eventId: number): void {
  const db = getDatabase();
  db.deleteEvent(eventId);
}
