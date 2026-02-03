import {
  CalendarBlock,
  DateRange,
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
import { getDatabase, Category } from '../db/database';

// Date range action
export function setDateRange(start: Date, end: Date): SetDateRangeAction {
  return {
    type: SET_DATE_RANGE,
    payload: { start, end },
  };
}

// Category actions that update both Redux AND database
export function setCategories(categories: Category[]): SetCategoriesAction {
  return {
    type: SET_CATEGORIES,
    payload: categories,
  };
}

export function addCategory(name: string, color: string): AddCategoryAction {
  const db = getDatabase();
  const category = db.addCategory(name, color);

  return {
    type: ADD_CATEGORY,
    payload: category,
  };
}

export function updateCategory(id: number, updates: { name?: string; color?: string }): UpdateCategoryAction {
  const db = getDatabase();
  db.updateCategory(id, updates);

  return {
    type: UPDATE_CATEGORY,
    payload: { id, ...updates },
  };
}

export function deleteCategory(id: number): DeleteCategoryAction {
  const db = getDatabase();
  // This will throw an error if category has blocks
  db.deleteCategory(id);

  return {
    type: DELETE_CATEGORY,
    payload: id,
  };
}

export function reorderCategories(categories: Category[]): ReorderCategoriesAction {
  const db = getDatabase();
  db.updateCategorySortOrder(categories);

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

// Block actions (direct DB calls, not Redux actions)
export function addBlock(block: CalendarBlock): void {
  const db = getDatabase();
  db.addBlock(block);
}

export function deleteBlock(blockId: number): void {
  const db = getDatabase();
  db.deleteBlock(blockId);
}

export function updateBlockTime(blockId: number, start: Date, end: Date): void {
  const db = getDatabase();
  db.updateBlockTime(blockId, start, end);
}

export function updateBlockCategory(blockId: number, categoryId: number): void {
  const db = getDatabase();
  db.updateBlockCategory(blockId, categoryId);
}
