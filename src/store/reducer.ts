import { produce } from 'immer';
import {
  BlocksState,
  BlockActionTypes,
  SET_DATE_RANGE,
  SetDateRangeAction,
  SET_CATEGORIES,
  SetCategoriesAction,
  ADD_CATEGORY,
  AddCategoryAction,
  UPDATE_CATEGORY,
  UpdateCategoryAction,
  DELETE_CATEGORY,
  DeleteCategoryAction,
  REORDER_CATEGORIES,
  ReorderCategoriesAction,
  TOGGLE_SIDEBAR,
} from './types';

const initialState: BlocksState = {
  dateRange: null,
  categories: [],
  sidebarCollapsed: false,
};

export const blocksReducer = produce(
  (draft: BlocksState, action: BlockActionTypes | { type: string }) => {
    console.log('Redux action:', action.type, action);
    switch (action.type) {
      case SET_DATE_RANGE:
        draft.dateRange = (action as SetDateRangeAction).payload;
        break;

      case SET_CATEGORIES:
        draft.categories = (action as SetCategoriesAction).payload;
        break;

      case ADD_CATEGORY:
        draft.categories.push((action as AddCategoryAction).payload);
        break;

      case UPDATE_CATEGORY: {
        const { id, name, color } = (action as UpdateCategoryAction).payload;
        const category = draft.categories.find(c => c.id === id);
        if (category) {
          if (name !== undefined) category.name = name;
          if (color !== undefined) category.color = color;
        }
        break;
      }

      case DELETE_CATEGORY:
        draft.categories = draft.categories.filter(
          c => c.id !== (action as DeleteCategoryAction).payload
        );
        break;

      case REORDER_CATEGORIES:
        draft.categories = (action as ReorderCategoriesAction).payload;
        break;

      case TOGGLE_SIDEBAR:
        draft.sidebarCollapsed = !draft.sidebarCollapsed;
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
