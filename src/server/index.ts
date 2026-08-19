// WillCal web server.
//
// Serves the static app shell and a single JSON-RPC endpoint at POST /rpc.
// Everything that used to touch the filesystem from the browser (SQLite reads
// and writes) now happens here.

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Auth } from './auth';
import { methods } from './methods';
import { openDatabase } from './db/database';
import {
  dispatch,
  errorResponse,
  isResponse,
  parseRequest,
  resultResponse,
  RpcResponse,
} from './rpc';
import {
  RPC_APP_ERROR,
  RPC_INVALID_REQUEST,
  RPC_PARSE_ERROR,
  RPC_RATE_LIMITED,
  RPC_UNAUTHORIZED,
} from '../shared/types';

const MAX_BODY_BYTES = 1024 * 1024;

// Static assets are whitelisted rather than resolved from the URL, so no
// request can walk out of the project directory.
const ROOT = path.resolve(__dirname, '..', '..');
const STATIC_FILES: Record<string, { file: string; type: string }> = {
  '/': { file: 'index.html', type: 'text/html; charset=utf-8' },
  '/index.html': { file: 'index.html', type: 'text/html; charset=utf-8' },
  '/dist/client/main.js': { file: 'dist/client/main.js', type: 'text/javascript; charset=utf-8' },
  '/dist/client/main.css': { file: 'dist/client/main.css', type: 'text/css; charset=utf-8' },
  '/dist/client/main.js.map': { file: 'dist/client/main.js.map', type: 'application/json; charset=utf-8' },
  '/dist/client/main.css.map': { file: 'dist/client/main.css.map', type: 'application/json; charset=utf-8' },
};

interface Config {
  dbPath: string;
  port: number;
  host: string;
  password: string;
  secret?: string;
  secureCookie: boolean;
  trustProxy: boolean;
}

function argValue(prefix: string): string | undefined {
  const arg = process.argv.slice(2).find((a) => a.startsWith(prefix));
  return arg ? arg.substring(prefix.length) : undefined;
}

function resolveDbPath(): string {
  const explicit = argValue('--db=') || process.env.WILLCAL_DB;
  if (explicit) return explicit;

  const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  const appDataDir = path.join(dataHome, 'willcal');
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }
  return path.join(appDataDir, 'willcal.db');
}

function loadConfig(): Config {
  const password = process.env.WILLCAL_PASSWORD;
  if (!password) {
    console.error(
      'WILLCAL_PASSWORD is not set. Refusing to start an unprotected server.\n' +
        'Set it in the environment, e.g. WILLCAL_PASSWORD=... npm start'
    );
    process.exit(1);
  }

  return {
    dbPath: resolveDbPath(),
    port: Number(argValue('--port=') || process.env.PORT || 8080),
    // Loopback by default: put a TLS-terminating reverse proxy in front, or
    // set HOST=0.0.0.0 to expose the server directly.
    host: argValue('--host=') || process.env.HOST || '127.0.0.1',
    password,
    secret: process.env.WILLCAL_SECRET,
    secureCookie: process.env.WILLCAL_ALLOW_INSECURE_COOKIE !== '1',
    trustProxy: process.env.WILLCAL_TRUST_PROXY === '1',
  };
}

function clientKey(req: http.IncomingMessage, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (value) return value.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function send(res: http.ServerResponse, status: number, body: string, type: string): void {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendRpc(res: http.ServerResponse, response: RpcResponse, cookie?: string): void {
  const body = JSON.stringify(response);
  const headers: http.OutgoingHttpHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    // Never let a proxy or the browser cache calendar data.
    'Cache-Control': 'no-store',
  };
  if (cookie) headers['Set-Cookie'] = cookie;
  res.writeHead(200, headers);
  res.end(body);
}

function serveStatic(res: http.ServerResponse, urlPath: string): void {
  // The app ships no icon; answer the browser's automatic request quietly
  // rather than logging a 404 on every page load.
  if (urlPath === '/favicon.ico') {
    res.writeHead(204).end();
    return;
  }

  const entry = STATIC_FILES[urlPath];
  if (!entry) {
    send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    return;
  }

  let contents: Buffer;
  try {
    contents = fs.readFileSync(path.join(ROOT, entry.file));
  } catch (error) {
    console.error(`Missing static asset ${entry.file}. Did you run \`npm run build\`?`, error);
    send(res, 500, 'Asset not built', 'text/plain; charset=utf-8');
    return;
  }

  res.writeHead(200, {
    'Content-Type': entry.type,
    'Content-Length': contents.length,
    'Cache-Control': 'no-cache',
  });
  res.end(contents);
}

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

/**
 * Secure cookies work fine on localhost, because browsers treat it as a secure
 * context. Bound to any other address over plain HTTP they are discarded
 * without an error, which looks exactly like a password that does not work.
 * Say so at startup rather than letting it be discovered at the login screen.
 */
function warnAboutCookieScope(config: Config): void {
  if (!config.secureCookie || LOOPBACK_HOSTS.has(config.host)) return;

  console.warn(
    `\nHOST is ${config.host}, and session cookies are marked Secure.\n` +
      '  Browsers only keep those over HTTPS, so if you reach this server directly\n' +
      '  over http:// the login will appear to do nothing.\n' +
      '  Serve it behind a TLS-terminating proxy, or for a trusted network restart\n' +
      '  with WILLCAL_ALLOW_INSECURE_COOKIE=1.\n'
  );
}

function main(): void {
  const config = loadConfig();
  const auth = new Auth(config.password, {
    secret: config.secret,
    secureCookie: config.secureCookie,
  });

  warnAboutCookieScope(config);

  console.log('Using database:', config.dbPath);
  openDatabase(config.dbPath);

  const server = http.createServer((req, res) => {
    const urlPath = (req.url || '/').split('?')[0];

    if (req.method === 'GET' || req.method === 'HEAD') {
      serveStatic(res, urlPath);
      return;
    }

    if (req.method !== 'POST' || urlPath !== '/rpc') {
      send(res, 404, 'Not found', 'text/plain; charset=utf-8');
      return;
    }

    handleRpc(req, res, auth, config).catch((error) => {
      console.error('Request failed:', error);
      if (!res.headersSent) {
        send(res, 400, 'Bad request', 'text/plain; charset=utf-8');
      }
    });
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} is already in use. Set PORT or --port= to pick another.`);
      process.exit(1);
    }
    throw error;
  });

  server.listen(config.port, config.host, () => {
    console.log(`WillCal listening on http://${config.host}:${config.port}`);
  });
}

async function handleRpc(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  auth: Auth,
  config: Config
): Promise<void> {
  // Session cookies are SameSite=Strict, and requiring a JSON content type
  // blocks the simple cross-origin form posts that could otherwise reach here.
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    sendRpc(res, errorResponse(null, RPC_INVALID_REQUEST, 'Content-Type must be application/json'));
    return;
  }

  const raw = await readBody(req);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    sendRpc(res, errorResponse(null, RPC_PARSE_ERROR, 'Invalid JSON'));
    return;
  }

  const parsed = parseRequest(body);
  if (isResponse(parsed)) {
    sendRpc(res, parsed);
    return;
  }

  const authenticated = auth.isAuthenticated(req.headers.cookie);

  switch (parsed.method) {
    case 'session.status':
      sendRpc(res, resultResponse(parsed.id, { authenticated }));
      return;

    case 'session.login': {
      const params = (parsed.params || {}) as Record<string, unknown>;
      let cookie: string | null;
      try {
        cookie = auth.login(params.password, clientKey(req, config.trustProxy));
      } catch (error) {
        sendRpc(res, errorResponse(parsed.id, RPC_RATE_LIMITED, (error as Error).message));
        return;
      }
      if (!cookie) {
        sendRpc(res, errorResponse(parsed.id, RPC_APP_ERROR, 'Incorrect password'));
        return;
      }
      sendRpc(res, resultResponse(parsed.id, { authenticated: true }), cookie);
      return;
    }

    case 'session.logout':
      sendRpc(res, resultResponse(parsed.id, { authenticated: false }), auth.logoutCookie());
      return;
  }

  if (!authenticated) {
    sendRpc(res, errorResponse(parsed.id, RPC_UNAUTHORIZED, 'Not signed in'));
    return;
  }

  sendRpc(res, dispatch(methods, parsed));
}

main();
