# AGENTS.md

This file contains useful information for AI agents working on the WillCal project.

## Project Overview

WillCal is a desktop calendar application built with NW.js, React, and TypeScript. It uses SQLite for local persistence and Redux for state management. The app features drag-and-drop scheduling with week/month/agenda views.

## Key Files and Structure

### Core Application Files
- `src/main.tsx` - Main application entry point (React component)
- `src/styles.css` - Global styles

### Database Layer
- `src/db/database.ts` - SQLite database wrapper with CRUD operations
- `src/db/migrations.ts` - Database migration definitions
- `src/db/migrationRunner.ts` - Handles running migrations
- `src/db/backup.ts` - Backup functionality for migrations

### State Management (Redux)
- `src/store/store.ts` - Redux store configuration
- `src/store/reducer.ts` - Root reducer
- `src/store/actions.ts` - Action creators
- `src/store/types.ts` - TypeScript types for Redux

### UI Components
- `src/components/Sidebar.tsx` - Category management sidebar
- `src/components/CategoryDialog.tsx` - Modal dialog for creating/editing categories

## Database Schema

The application uses a SQLite database with the following tables:

### `blocks` table
- Stores calendar events/blocks
- Columns: id, title, start_time, end_time, category_id, created_at, updated_at

### `categories` table
- Stores event categories with colors
- Columns: id, name, color, include_in_totals

### `schema_version` table
- Tracks which migrations have been applied
- Columns: version, applied_at

## Key Features

1. **Drag-and-Drop Scheduling** - Create, move, and resize calendar blocks
2. **Category Management** - Organize blocks by categories with colors
3. **Database Migrations** - Automatic schema updates with backup/restore
4. **Week/Month/Agenda Views** - Multiple calendar view modes
5. **Work Hours Toggle** - Show only 6:00 AM - 6:00 PM or full 24-hour day
6. **Category Hour Totals** - Display time spent per category in week views

## Development Commands

```bash
npm run build      # Build the application with esbuild
npm run start      # Build and start the app (uses default database location)
npm run local      # Build, start with devtools open, uses ./dev.db
npm run dev        # Build, start with devtools open, uses in-memory database
```

## Database Location

- Default: `$XDG_DATA_HOME/willcal/willcal.db` or `~/.local/share/willcal/willcal.db`
- Can be overridden via command-line argument: `--db=/path/to/database.db`
- For testing: Use `:memory:` for in-memory database (no persistence)

## Testing

See `Testing.md` for comprehensive manual testing checklist covering:
- Block creation, editing, deletion, and movement
- Category management (CRUD operations)
- Database migrations and backups
- Console logging verification

## Important Notes for AI Agents

1. **Always run `npm run build` after making code changes**
2. **Add to Testing.md** when adding new UI features - include manual testing steps
3. **Follow existing patterns** - The codebase uses functional components with TypeScript, Redux for state management, and SQLite via node-sqlite3-wasm
4. **Database migrations** are critical - always test migration logic thoroughly
5. **Backup strategy** - Migrations automatically create backups before applying changes

## Build Process

The application uses esbuild for bundling (configured in `esbuild.config.js`). The build process:
1. Transpiles TypeScript to JavaScript
2. Bundles all dependencies
3. Outputs to files that NW.js can load

## NW.js Configuration

NW.js is configured via `package.json`:
- Main entry point: `index.html`
- Node.js integration enabled for file system and database access
- DevTools automatically opened in development mode
