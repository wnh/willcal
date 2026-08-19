// JSON-RPC 2.0 envelope handling for the single /rpc endpoint.
//
// Batch requests are not supported: the client never sends them, and rejecting
// them keeps the auth check to one decision per HTTP request.

import {
  RPC_APP_ERROR,
  RPC_INTERNAL_ERROR,
  RPC_INVALID_PARAMS,
  RPC_INVALID_REQUEST,
  RPC_METHOD_NOT_FOUND,
  RPC_UNAUTHORIZED,
} from '../shared/types';

export class RpcError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'RpcError';
    this.code = code;
  }

  /** A failure the user should see verbatim, e.g. a category still in use. */
  static app(message: string): RpcError {
    return new RpcError(RPC_APP_ERROR, message);
  }

  static unauthorized(): RpcError {
    return new RpcError(RPC_UNAUTHORIZED, 'Not signed in');
  }
}

export function invalidParams(message: string): RpcError {
  return new RpcError(RPC_INVALID_PARAMS, message);
}

export interface RpcRequest {
  id: string | number | null;
  method: string;
  params: unknown;
}

export interface RpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * Validates the JSON-RPC envelope. Returns the parsed request, or an error
 * response ready to send back.
 */
export function parseRequest(body: unknown): RpcRequest | RpcResponse {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return errorResponse(null, RPC_INVALID_REQUEST, 'Request must be a JSON-RPC object');
  }

  const raw = body as Record<string, unknown>;
  const id =
    typeof raw.id === 'string' || typeof raw.id === 'number' ? raw.id : null;

  if (raw.jsonrpc !== '2.0') {
    return errorResponse(id, RPC_INVALID_REQUEST, 'jsonrpc must be "2.0"');
  }
  if (typeof raw.method !== 'string') {
    return errorResponse(id, RPC_INVALID_REQUEST, 'method must be a string');
  }

  return { id, method: raw.method, params: raw.params };
}

export function isResponse(value: RpcRequest | RpcResponse): value is RpcResponse {
  return (value as RpcResponse).jsonrpc === '2.0';
}

export function errorResponse(
  id: string | number | null,
  code: number,
  message: string
): RpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

export function resultResponse(id: string | number | null, result: unknown): RpcResponse {
  return { jsonrpc: '2.0', id, result: result === undefined ? null : result };
}

type Handler = (params: unknown) => unknown;

/** Runs one method, mapping thrown errors onto JSON-RPC error responses. */
export function dispatch(
  table: Record<string, Handler>,
  request: RpcRequest
): RpcResponse {
  const handler = table[request.method];
  if (!handler) {
    return errorResponse(request.id, RPC_METHOD_NOT_FOUND, `Unknown method: ${request.method}`);
  }

  try {
    return resultResponse(request.id, handler(request.params));
  } catch (error) {
    if (error instanceof RpcError) {
      return errorResponse(request.id, error.code, error.message);
    }
    // Unexpected failures are logged in full but reported generically, so
    // SQLite internals never leak to the browser.
    console.error(`Method ${request.method} failed:`, error);
    return errorResponse(request.id, RPC_INTERNAL_ERROR, 'Internal server error');
  }
}
