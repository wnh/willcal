import { CalendarEvent, ADD_EVENT, DELETE_EVENT, LOAD_EVENTS, AddEventAction, DeleteEventAction, LoadEventsAction } from './types';
import { getDatabase } from '../db/database';

export function addEvent(event: CalendarEvent): AddEventAction {
  const db = getDatabase();
  db.addEvent(event);
  return {
    type: ADD_EVENT,
    payload: event,
  };
}

export function deleteEvent(eventId: number): DeleteEventAction {
  const db = getDatabase();
  db.deleteEvent(eventId);
  return {
    type: DELETE_EVENT,
    payload: eventId,
  };
}

export function loadEvents(): LoadEventsAction {
  const db = getDatabase();
  const events = db.getAllEvents();
  return {
    type: LOAD_EVENTS,
    payload: events,
  };
}
