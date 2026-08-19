// Plain action creators. In the desktop build these also wrote to SQLite
// synchronously; persistence is now an awaited call to src/client/api.ts made
// by the component, which dispatches the matching action once the server has
// accepted the change.

import {
  Category,
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
  ToggleSidebarAction,
} from './types';

export function setDateRange(start: Date, end: Date): SetDateRangeAction {
  return {
    type: SET_DATE_RANGE,
    payload: { start, end },
  };
}

export function setCategories(categories: Category[]): SetCategoriesAction {
  return {
    type: SET_CATEGORIES,
    payload: categories,
  };
}

export function addCategory(category: Category): AddCategoryAction {
  return {
    type: ADD_CATEGORY,
    payload: category,
  };
}

export function updateCategory(
  id: number,
  updates: { name?: string; color?: string; includeInTotals?: boolean }
): UpdateCategoryAction {
  return {
    type: UPDATE_CATEGORY,
    payload: { id, ...updates },
  };
}

export function deleteCategory(id: number): DeleteCategoryAction {
  return {
    type: DELETE_CATEGORY,
    payload: id,
  };
}

export function reorderCategories(categories: Category[]): ReorderCategoriesAction {
  return {
    type: REORDER_CATEGORIES,
    payload: categories,
  };
}

export function toggleSidebar(): ToggleSidebarAction {
  return {
    type: TOGGLE_SIDEBAR,
  };
}
