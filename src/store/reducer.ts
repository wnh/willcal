import { EventsState, EventActionTypes, ADD_EVENT, DELETE_EVENT, AddEventAction, DeleteEventAction } from './types';

const initialState: EventsState = {
  events: [],
};

export function eventsReducer(
  state: EventsState = initialState,
  action: EventActionTypes | { type: string }
): EventsState {
  switch (action.type) {
    case ADD_EVENT:
      return {
        ...state,
        events: [...state.events, (action as AddEventAction).payload],
      };
    case DELETE_EVENT:
      return {
        ...state,
        events: state.events.filter((event) => event.id !== (action as DeleteEventAction).payload),
      };
    default:
      if (action.type.startsWith('@@')) {
        return state;
      }
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
