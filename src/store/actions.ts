import { CalendarBlock, DateRange, SET_DATE_RANGE, SetDateRangeAction } from './types';
import { getDatabase } from '../db/database';

export function setDateRange(start: Date, end: Date): SetDateRangeAction {
  return {
    type: SET_DATE_RANGE,
    payload: { start, end },
  };
}

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
