import { produce } from 'immer';
import { EventsState, EventActionTypes, ADD_EVENT, DELETE_EVENT, AddEventAction, DeleteEventAction } from './types';

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
      default:
        if (action.type.startsWith('@@')) {
          return;
        }
        throw new Error(`Unhandled action type: ${action.type}`);
    }
  },
  initialState
);
