// GET /now: the one REST endpoint.
//
// Answers "what am I doing right now?" for scripts and status bars, which want
// a plain GET rather than a JSON-RPC envelope. It reads the same rows as
// `blocks.getUpcoming`, but shapes them for a shell caller.

import { getDatabase } from './db/database';

/** The block covering the requested instant. Every field is present together. */
export interface NowBlock {
  id: number;
  /** The block's title. Empty string if it was never given one. */
  name: string;
  /** The category the block is in, or null when it has none. */
  calendar: string | null;
  calendarId: number | null;
  start: string;
  end: string;
  /**
   * Whole minutes until the block ends, rounded up, so a block that is still
   * running never reads as 0.
   */
  minutesRemaining: number;
}

export interface NowResponse {
  /** The moment the answer was computed, ISO 8601. */
  now: string;
  /** Null when nothing is scheduled over `now`. */
  block: NowBlock | null;
}

export function currentTask(now: Date): NowResponse {
  const db = getDatabase();
  const block = db.getCurrentBlock(now);
  if (!block) {
    return { now: now.toISOString(), block: null };
  }

  const category =
    block.categoryId === undefined
      ? undefined
      : db.getAllCategories().find((c) => c.id === block.categoryId);

  return {
    now: now.toISOString(),
    block: {
      id: block.id,
      name: block.title,
      calendar: category ? category.name : null,
      calendarId: category ? category.id : null,
      start: block.start.toISOString(),
      end: block.end.toISOString(),
      minutesRemaining: Math.ceil((block.end.getTime() - now.getTime()) / 60000),
    },
  };
}
