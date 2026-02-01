export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface EventsState {
  dateRange: DateRange | null;
}

export const SET_DATE_RANGE = 'SET_DATE_RANGE';

export interface SetDateRangeAction {
  type: typeof SET_DATE_RANGE;
  payload: DateRange;
}

export type EventActionTypes = SetDateRangeAction;
