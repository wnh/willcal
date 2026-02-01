export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

export interface EventsState {
  events: CalendarEvent[];
}

export const ADD_EVENT = 'ADD_EVENT';
export const DELETE_EVENT = 'DELETE_EVENT';

export interface AddEventAction {
  type: typeof ADD_EVENT;
  payload: CalendarEvent;
}

export interface DeleteEventAction {
  type: typeof DELETE_EVENT;
  payload: number;
}

export type EventActionTypes = AddEventAction | DeleteEventAction;
