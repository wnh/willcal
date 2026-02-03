import { Category } from '../db/database';

export interface CalendarBlock {
  id: number;
  title: string;
  start: Date;
  end: Date;
  categoryId?: number;  // Optional for backwards compatibility
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface BlocksState {
  dateRange: DateRange | null;
  categories: Category[];
  sidebarCollapsed: boolean;
}

// Action type constants
export const SET_DATE_RANGE = 'SET_DATE_RANGE';
export const SET_CATEGORIES = 'SET_CATEGORIES';
export const ADD_CATEGORY = 'ADD_CATEGORY';
export const UPDATE_CATEGORY = 'UPDATE_CATEGORY';
export const DELETE_CATEGORY = 'DELETE_CATEGORY';
export const REORDER_CATEGORIES = 'REORDER_CATEGORIES';
export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';

// Action interfaces
export interface SetDateRangeAction {
  type: typeof SET_DATE_RANGE;
  payload: DateRange;
}

export interface SetCategoriesAction {
  type: typeof SET_CATEGORIES;
  payload: Category[];
}

export interface AddCategoryAction {
  type: typeof ADD_CATEGORY;
  payload: Category;
}

export interface UpdateCategoryAction {
  type: typeof UPDATE_CATEGORY;
  payload: { id: number; name?: string; color?: string };
}

export interface DeleteCategoryAction {
  type: typeof DELETE_CATEGORY;
  payload: number; // category id
}

export interface ReorderCategoriesAction {
  type: typeof REORDER_CATEGORIES;
  payload: Category[];
}

export interface ToggleSidebarAction {
  type: typeof TOGGLE_SIDEBAR;
}

export type BlockActionTypes =
  | SetDateRangeAction
  | SetCategoriesAction
  | AddCategoryAction
  | UpdateCategoryAction
  | DeleteCategoryAction
  | ReorderCategoriesAction
  | ToggleSidebarAction;
