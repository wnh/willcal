export interface CalendarBlock {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface BlocksState {
  dateRange: DateRange | null;
}

export const SET_DATE_RANGE = 'SET_DATE_RANGE';

export interface SetDateRangeAction {
  type: typeof SET_DATE_RANGE;
  payload: DateRange;
}

export type BlockActionTypes = SetDateRangeAction;
