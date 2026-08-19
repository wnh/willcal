// Typed wrappers around the JSON-RPC methods. This is the client-side
// replacement for the old `getDatabase()` object: same operations, same
// argument shapes, but async and with ISO strings converted back to Dates so
// the React components are unchanged in that respect.

import { call } from './rpc';
import {
  CalendarBlock,
  Category,
  CategoryUpdates,
  UpcomingResult,
  WireBlock,
} from '../shared/types';

function fromWire(wire: WireBlock): CalendarBlock {
  const block: CalendarBlock = {
    id: wire.id,
    title: wire.title,
    start: new Date(wire.start),
    end: new Date(wire.end),
  };
  if (wire.categoryId !== undefined && wire.categoryId !== null) {
    block.categoryId = wire.categoryId;
  }
  return block;
}

function toWire(block: CalendarBlock): WireBlock {
  const wire: WireBlock = {
    id: block.id,
    title: block.title,
    start: block.start.toISOString(),
    end: block.end.toISOString(),
  };
  if (block.categoryId !== undefined) {
    wire.categoryId = block.categoryId;
  }
  return wire;
}

export const session = {
  async status(): Promise<boolean> {
    const result = await call<{ authenticated: boolean }>('session.status');
    return result.authenticated;
  },

  /**
   * Returns true when the password was accepted *and* the browser kept the
   * session cookie. Those can differ: a Secure cookie is silently discarded
   * when the page is served over plain HTTP from anything but localhost, which
   * otherwise looks like a login that succeeds and then does nothing.
   */
  async login(password: string): Promise<boolean> {
    await call('session.login', { password });
    return session.status();
  },

  async logout(): Promise<void> {
    await call('session.logout');
  },
};

export const blocks = {
  async getByDateRange(start: Date, end: Date): Promise<CalendarBlock[]> {
    const rows = await call<WireBlock[]>('blocks.getByDateRange', {
      start: start.toISOString(),
      end: end.toISOString(),
    });
    return rows.map(fromWire);
  },

  async add(block: CalendarBlock): Promise<void> {
    await call('blocks.add', toWire(block));
  },

  async delete(id: number): Promise<void> {
    await call('blocks.delete', { id });
  },

  async updateTime(id: number, start: Date, end: Date): Promise<void> {
    await call('blocks.updateTime', {
      id,
      start: start.toISOString(),
      end: end.toISOString(),
    });
  },

  async updateTitle(id: number, title: string): Promise<void> {
    await call('blocks.updateTitle', { id, title });
  },

  async updateCategory(id: number, categoryId: number): Promise<void> {
    await call('blocks.updateCategory', { id, categoryId });
  },

  /** One round trip for the notification poll: the next block and the current one. */
  async getUpcoming(
    now: Date,
    windowMs: number
  ): Promise<{ next: CalendarBlock | null; current: CalendarBlock | null }> {
    const result = await call<UpcomingResult>('blocks.getUpcoming', {
      now: now.toISOString(),
      windowMs,
    });
    return {
      next: result.next ? fromWire(result.next) : null,
      current: result.current ? fromWire(result.current) : null,
    };
  },
};

export const categories = {
  getAll(): Promise<Category[]> {
    return call<Category[]>('categories.getAll');
  },

  add(name: string, color: string, includeInTotals: boolean): Promise<Category> {
    return call<Category>('categories.add', { name, color, includeInTotals });
  },

  async update(id: number, updates: CategoryUpdates): Promise<void> {
    await call('categories.update', { id, ...updates });
  },

  async delete(id: number): Promise<void> {
    await call('categories.delete', { id });
  },

  async reorder(ordered: Category[]): Promise<void> {
    await call('categories.reorder', {
      categories: ordered.map((category) => ({ id: category.id })),
    });
  },

  blockCount(id: number): Promise<number> {
    return call<number>('categories.blockCount', { id });
  },
};
