// The JSON-RPC method table. Every method that used to be a direct SQLite call
// in the browser now lives here and is reached over the single /rpc endpoint.

import { getDatabase } from './db/database';
import {
  CalendarBlock,
  CategoryUpdates,
  UpcomingResult,
  WireBlock,
} from '../shared/types';
import { RpcError, invalidParams } from './rpc';

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

// --- Param validation -------------------------------------------------------
//
// Params arrive as untrusted JSON. These helpers throw an invalid-params error
// rather than letting a bad value reach SQLite.

function obj(params: unknown): Record<string, unknown> {
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    throw invalidParams('params must be an object');
  }
  return params as Record<string, unknown>;
}

function num(params: Record<string, unknown>, key: string): number {
  const value = params[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalidParams(`${key} must be a number`);
  }
  return value;
}

function str(params: Record<string, unknown>, key: string): string {
  const value = params[key];
  if (typeof value !== 'string') {
    throw invalidParams(`${key} must be a string`);
  }
  return value;
}

function bool(params: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = params[key];
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    throw invalidParams(`${key} must be a boolean`);
  }
  return value;
}

function date(params: Record<string, unknown>, key: string): Date {
  const parsed = new Date(str(params, key));
  if (Number.isNaN(parsed.getTime())) {
    throw invalidParams(`${key} must be an ISO date string`);
  }
  return parsed;
}

/**
 * Application errors (e.g. "category still has blocks") are reported to the
 * client as RPC_APP_ERROR so the UI can show the message verbatim, the way the
 * desktop build showed the thrown Error's message in an alert().
 */
function appError(error: unknown): never {
  throw RpcError.app(error instanceof Error ? error.message : String(error));
}

export type RpcMethod = (params: unknown) => unknown;

export const methods: Record<string, RpcMethod> = {
  'blocks.getByDateRange': (params) => {
    const p = obj(params);
    return getDatabase()
      .getBlocksByDateRange(date(p, 'start'), date(p, 'end'))
      .map(toWire);
  },

  'blocks.add': (params) => {
    const p = obj(params);
    const block: CalendarBlock = {
      id: num(p, 'id'),
      title: str(p, 'title'),
      start: date(p, 'start'),
      end: date(p, 'end'),
    };
    if (p.categoryId !== undefined) {
      block.categoryId = num(p, 'categoryId');
    }
    try {
      getDatabase().addBlock(block);
    } catch (error) {
      appError(error);
    }
    return toWire(block);
  },

  'blocks.delete': (params) => {
    const p = obj(params);
    getDatabase().deleteBlock(num(p, 'id'));
    return null;
  },

  'blocks.updateTime': (params) => {
    const p = obj(params);
    getDatabase().updateBlockTime(num(p, 'id'), date(p, 'start'), date(p, 'end'));
    return null;
  },

  'blocks.updateTitle': (params) => {
    const p = obj(params);
    getDatabase().updateBlockTitle(num(p, 'id'), str(p, 'title'));
    return null;
  },

  'blocks.updateCategory': (params) => {
    const p = obj(params);
    getDatabase().updateBlockCategory(num(p, 'id'), num(p, 'categoryId'));
    return null;
  },

  /**
   * Backs the 30-second notification poll. Both lookups are answered in one
   * round trip because the client always needs them together.
   */
  'blocks.getUpcoming': (params): UpcomingResult => {
    const p = obj(params);
    const now = date(p, 'now');
    const windowMs = num(p, 'windowMs');
    const db = getDatabase();
    const next = db.getNextUpcomingBlock(now, new Date(now.getTime() + windowMs));
    const current = db.getCurrentBlock(now);
    return {
      next: next ? toWire(next) : null,
      current: current ? toWire(current) : null,
    };
  },

  'categories.getAll': () => getDatabase().getAllCategories(),

  'categories.add': (params) => {
    const p = obj(params);
    try {
      return getDatabase().addCategory(
        str(p, 'name'),
        str(p, 'color'),
        bool(p, 'includeInTotals', true)
      );
    } catch (error) {
      appError(error);
    }
  },

  'categories.update': (params) => {
    const p = obj(params);
    const updates: CategoryUpdates = {};
    if (p.name !== undefined) updates.name = str(p, 'name');
    if (p.color !== undefined) updates.color = str(p, 'color');
    if (p.includeInTotals !== undefined) {
      updates.includeInTotals = bool(p, 'includeInTotals', true);
    }
    try {
      getDatabase().updateCategory(num(p, 'id'), updates);
    } catch (error) {
      appError(error);
    }
    return null;
  },

  'categories.delete': (params) => {
    const p = obj(params);
    try {
      getDatabase().deleteCategory(num(p, 'id'));
    } catch (error) {
      appError(error);
    }
    return null;
  },

  'categories.reorder': (params) => {
    const p = obj(params);
    if (!Array.isArray(p.categories)) {
      throw invalidParams('categories must be an array');
    }
    // Only the order matters here; sort_order is rewritten from array position.
    const categories = p.categories.map((entry) => ({ id: num(obj(entry), 'id') }));
    getDatabase().updateCategorySortOrder(categories);
    return null;
  },

  'categories.blockCount': (params) => {
    const p = obj(params);
    return getDatabase().getBlockCountByCategory(num(p, 'id'));
  },
};
