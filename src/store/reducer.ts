import { produce } from 'immer';
import { EventsState, EventActionTypes, SET_DATE_RANGE, SetDateRangeAction } from './types';

const initialState: EventsState = {
  dateRange: null,
};

export const eventsReducer = produce(
  (draft: EventsState, action: EventActionTypes | { type: string }) => {
    switch (action.type) {
      case SET_DATE_RANGE:
        draft.dateRange = (action as SetDateRangeAction).payload;
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
