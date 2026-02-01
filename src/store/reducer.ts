import { produce } from 'immer';
import { BlocksState, BlockActionTypes, SET_DATE_RANGE, SetDateRangeAction } from './types';

const initialState: BlocksState = {
  dateRange: null,
};

export const blocksReducer = produce(
  (draft: BlocksState, action: BlockActionTypes | { type: string }) => {
    console.log('Redux action:', action.type, action);
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
