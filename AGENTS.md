# AGENTS.md

This file contains useful information for AI agents working on the WillCal project.

## Project Overview

WillCal is a web calendar application: a React + TypeScript browser client talking to a small Node server over JSON-RPC. The server owns the SQLite database. Redux manages client state. The app features drag-and-drop scheduling with week/month/agenda views.

It was originally an NW.js desktop app. That build has been removed: the browser no longer touches the filesystem, and everything that used to be a direct SQLite call is now an RPC.

## Architecture

```
browser                          server
-------                          ------
main.tsx / components  ──▶  POST /rpc  ──▶  methods.ts  ──▶  db/database.ts  ──▶  SQLite
client/api.ts                                                                    (node-sqlite3-wasm)
client/rpc.ts
```

- **One endpoint.** Every server call is `POST /rpc` carrying a JSON-RPC 2.0 request. There is no REST surface. Batch requests are rejected.
- **Dates cross the wire as ISO strings.** `src/shared/types.ts` defines both the rich types (`CalendarBlock` with `Date`) and the wire types (`WireBlock` with `string`). Conversion happens in `src/client/api.ts` and `src/server/methods.ts`, nowhere else.
- **The database is the source of truth.** Mutations are awaited, then the current date range is re-fetched. Moves, title edits, and category changes also apply optimistically first so the UI does not visibly snap back during the round trip.

## Key Files and Structure

### Shared
- `src/shared/types.ts` - types used by both sides, wire formats, JSON-RPC error codes, `PASTEL_COLORS`

### Client
- `src/main.tsx` - main application entry point, auth gate, calendar wiring
- `src/client/rpc.ts` - JSON-RPC transport; also owns the "session expired" callback
- `src/client/api.ts` - typed wrappers per method; converts ISO strings to `Date`
- `src/styles.css` - global styles

### Server
- `src/server/index.ts` - HTTP server: static assets, `/rpc` routing, config, session endpoints
- `src/server/rpc.ts` - JSON-RPC envelope parsing, dispatch, error mapping
- `src/server/methods.ts` - the method table and param validation
- `src/server/auth.ts` - shared-password check, signed session cookie, login rate limiting
- `src/server/db/database.ts` - SQLite wrapper with CRUD operations
- `src/server/db/migrations.ts` - database migration definitions
- `src/server/db/migrationRunner.ts` - handles running migrations
- `src/server/db/backup.ts` - backup functionality for migrations

### State Management (Redux)
- `src/store/store.ts` - Redux store configuration
- `src/store/reducer.ts` - Root reducer
- `src/store/actions.ts` - Plain action creators (they no longer write to the database)
- `src/store/types.ts` - TypeScript types for Redux

### UI Components
- `src/components/Sidebar.tsx` - Category management sidebar
- `src/components/CategoryDialog.tsx` - Modal dialog for creating/editing categories
- `src/components/LoginScreen.tsx` - Shared-password sign-in
- `src/components/BlockContextMenu.tsx` - Right-click menu (replaces the native `nw.Menu`)
- `src/components/NotificationModal.tsx` - Upcoming block / gap warning (replaces the popup window)

## RPC Methods

| Method | Purpose |
| --- | --- |
| `session.status` / `session.login` / `session.logout` | Auth; the only methods callable while signed out |
| `blocks.getByDateRange` | Blocks overlapping the visible range |
| `blocks.add` / `blocks.delete` | Create and remove blocks |
| `blocks.updateTime` / `updateTitle` / `updateCategory` | Field updates |
| `blocks.getUpcoming` | Next block and current block, for the 30-second notification poll |
| `categories.getAll` / `add` / `update` / `delete` / `reorder` / `blockCount` | Category CRUD |

Adding a method means: add it to `methods` in `src/server/methods.ts` with param validation, then add a typed wrapper in `src/client/api.ts`. Never let unvalidated JSON reach SQLite.

## Database Schema

The application uses a SQLite database with the following tables:

### `blocks` table
- Stores calendar events/blocks
- Columns: id, title, start, end, category_id

### `categories` table
- Stores event categories with colors
- Columns: id, name, color, sort_order, include_in_totals

### `schema_version` table
- Tracks which migrations have been applied
- Columns: version, applied_at, description

## Key Features

1. **Drag-and-Drop Scheduling** - Create, move, and resize calendar blocks
2. **Category Management** - Organize blocks by categories with colors
3. **Database Migrations** - Automatic schema updates with backup/restore
4. **Week/Month/Agenda Views** - Multiple calendar view modes
5. **Work Hours Toggle** - Show only 6:00 AM - 6:00 PM or full 24-hour day
6. **Category Hour Totals** - Display time spent per category in week views
7. **Shared-Password Access** - One password gates the whole app

## Development Commands

```bash
npm run build      # Build both bundles with esbuild
npm run typecheck  # tsc --noEmit
npm run start      # Build and serve (uses default database location)
npm run local      # Build and serve using ./dev.db
npm run dev        # Build and serve using an in-memory database
```

`WILLCAL_PASSWORD` must be set or the server refuses to start:

```bash
WILLCAL_PASSWORD=secret npm start
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `WILLCAL_PASSWORD` | *(required)* | The shared password. No default; the server exits without it. |
| `PORT` / `--port=` | `8080` | Listen port |
| `HOST` | `127.0.0.1` | Listen address. Loopback by default; set `0.0.0.0` to expose directly. |
| `WILLCAL_DB` / `--db=` | XDG path | Database file, or `:memory:` |
| `WILLCAL_SECRET` | derived from the password | Session signing key. Changing the password invalidates sessions by default. |
| `WILLCAL_ALLOW_INSECURE_COOKIE` | unset | Set to `1` to drop the `Secure` cookie flag when serving plain HTTP on a non-localhost host |
| `WILLCAL_TRUST_PROXY` | unset | Set to `1` to read the client address from `X-Forwarded-For` for rate limiting |

## Deployment Notes

- The server speaks plain HTTP. Put a TLS-terminating reverse proxy in front of it before exposing it to the internet, and leave `HOST` on loopback.
- Static assets are served from a whitelist in `src/server/index.ts`; renaming a build output means updating `STATIC_FILES`.
- Session cookies are stateless and signed. Signing out clears the browser's cookie but does not revoke a token that was copied elsewhere.

## Database Location

- Default: `$XDG_DATA_HOME/willcal/willcal.db` or `~/.local/share/willcal/willcal.db`
- Can be overridden via `WILLCAL_DB` or `--db=/path/to/database.db`
- For testing: Use `:memory:` for in-memory database (no persistence)

## Testing

See `Testing.md` for comprehensive manual testing checklist covering:
- Block creation, editing, deletion, and movement
- Category management (CRUD operations)
- Authentication, session expiry, and network failures
- Database migrations and backups
- Server startup and configuration

## Important Notes for AI Agents

1. **Always run `npm run build` after making code changes** (and `npm run typecheck` for type errors, since esbuild does not typecheck)
2. **Add to Testing.md** when adding new UI features - include manual testing steps
3. **Follow existing patterns** - functional components with TypeScript, Redux for state, SQLite via node-sqlite3-wasm on the server
4. **Never import server code from the client** - `src/server/**` uses `fs`, `http`, and `crypto` and will break the browser bundle. Shared code belongs in `src/shared/`.
5. **Database migrations** are critical - always test migration logic thoroughly
6. **Backup strategy** - Migrations automatically create backups before applying changes

## Build Process

`esbuild.config.js` produces two bundles:

1. `dist/client/main.js` + `main.css` - browser bundle, everything inlined, `process.env.NODE_ENV` defined at build time
2. `dist/server/index.js` - Node bundle, CommonJS, with `node-sqlite3-wasm` left external so it can load its `.wasm` file from `node_modules`

`dist/` is wiped at the start of each build.
