import { CalendarEvent, ADD_EVENT, DELETE_EVENT, AddEventAction, DeleteEventAction } from './types';

export function addEvent(event: CalendarEvent): AddEventAction {
  return {
    type: ADD_EVENT,
    payload: event,
  };
}

export function deleteEvent(eventId: number): DeleteEventAction {
  return {
    type: DELETE_EVENT,
    payload: eventId,
  };
}
