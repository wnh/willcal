// Browser side of the JSON-RPC transport. Every server call in the app goes
// through this one function and the single /rpc endpoint.

import { RPC_UNAUTHORIZED } from '../shared/types';

export class RpcClientError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'RpcClientError';
    this.code = code;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/**
 * Called whenever the server reports an expired or missing session, from any
 * request. The app uses it to drop straight back to the login screen instead
 * of leaving a stale calendar on screen.
 */
export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler;
}

let nextId = 1;

export async function call<T>(method: string, params?: unknown): Promise<T> {
  const response = await fetch('/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params: params ?? {} }),
  });

  if (!response.ok) {
    throw new RpcClientError(0, `Server returned ${response.status}`);
  }

  const payload = await response.json();

  if (payload.error) {
    if (payload.error.code === RPC_UNAUTHORIZED && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new RpcClientError(payload.error.code, payload.error.message);
  }

  return payload.result as T;
}
