import { produce } from 'immer';
import { EventsState, EventActionTypes, ADD_EVENT, DELETE_EVENT, LOAD_EVENTS, AddEventAction, DeleteEventAction, LoadEventsAction } from './types';

const initialState: EventsState = {
  events: [],
};

export const eventsReducer = produce(
  (draft: EventsState, action: EventActionTypes | { type: string }) => {
    switch (action.type) {
      case ADD_EVENT:
        draft.events.push((action as AddEventAction).payload);
        break;
      case DELETE_EVENT:
        const eventId = (action as DeleteEventAction).payload;
        draft.events = draft.events.filter((event) => event.id !== eventId);
        break;
      case LOAD_EVENTS:
        draft.events = (action as LoadEventsAction).payload;
        break;
      default:
        if (action.type.startsWith('@@')) {
          return;
        }
        throw new Error(`Unhandled action type: ${action.type}`);
    }
  },
  initialState
);
