# CLAUDE.md - Developer Notes for AI Assistants

This document contains important context about the WillCal project for future development sessions.

## Project Overview

WillCal is a desktop calendar application built with NW.js that combines:
- **Frontend**: React + TypeScript + Vite
- **Desktop**: NW.js (Chromium + Node.js)
- **Database**: SQLite via better-sqlite3
- **Calendar UI**: react-big-calendar with drag-and-drop

## NixOS / Nix Environment

**Important**: NW.js is NOT installed via npm. Instead, use `shell.nix`:

```bash
nix-shell  # Provides Node.js, NW.js, and all build dependencies
```

**Why**:
- The npm `nw` package doesn't work reliably on NixOS
- NixOS provides NW.js through nixpkgs with proper library dependencies
- `shell.nix` includes all system libraries NW.js needs (ALSA, Mesa, NSS, etc.)

**Dependencies Managed by Nix** (`shell.nix`):
- `nwjs` - The actual NW.js runtime
- `nodejs_22` - Node.js and npm
- `python3`, `gcc`, `gnumake` - For compiling better-sqlite3
- System libraries (alsa-lib, mesa, nss, etc.) - Required by NW.js on Linux

**Not in package.json**:
- `nw` and `nw-builder` are intentionally excluded
- These would conflict with the Nix-provided NW.js

## Critical Architecture Decisions

### NW.js Configuration (IMPORTANT!)

**Problem Solved**: NW.js requires specific configuration to allow Node.js modules to work in the browser context.

**Solution** (`package.json:5-32`):
```json
{
  "main": "dist/index.html",  // Points to BUILT files, not source
  "chromium-args": "--mixed-context",  // Enables Node.js in browser context
  "nodejs": true,  // Required for Node.js integration
  "node-remote": "*"  // Allows remote scripts to access Node.js
}
```

**Additional Fix** (`index.html:12-17`):
- Added script to expose `require` as `window.nodeRequire` before loading React
- This ensures better-sqlite3 (native Node module) can be loaded

### Build System

**Vite Configuration** (`vite.config.ts:14-20`):
```typescript
external: ['better-sqlite3', 'fs', 'path']  // Don't bundle Node modules
optimizeDeps: { exclude: ['better-sqlite3'] }  // Don't pre-bundle native modules
```

These settings prevent Vite from trying to bundle native Node.js modules, which would fail.

### TypeScript Type System

**Key Type Definitions** (`src/types/index.ts`):

1. **CalendarEvent**: Database event structure (uses ISO 8601 strings for dates)
2. **BigCalendarEvent**: UI event structure (uses Date objects)
3. **EventFormData**: Form input structure (uses Date objects)

**Important**: The app converts between ISO strings (database) and Date objects (UI) using utilities in `src/utils/dateHelpers.ts`.

### Database Architecture

**Location** (`src/db/database.ts:130-136`):
- Windows: `%APPDATA%/willcal/calendar.db`
- macOS: `~/Library/Application Support/willcal/calendar.db`
- Linux: `~/.local/share/willcal/calendar.db`

**Implementation**:
- Singleton pattern via `getDatabase()` function
- Synchronous operations (better-sqlite3)
- Auto-initialization on first run

**Schema**:
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Component Structure

### App.tsx (Main Controller)
- Manages all event state
- Handles CRUD operations
- Bridges between Calendar component and Database
- **Important**: Converts `EventInteractionArgs<BigCalendarEvent>` types for drag/drop handlers

### Calendar.tsx (View)
- Uses `withDragAndDrop` HOC from react-big-calendar
- **Type Parameter Required**: `withDragAndDrop<BigCalendarEvent>(BigCalendar)`
- Accessor functions needed: `startAccessor={(event) => event.start}` (not just `"start"`)
- Converts database events to `BigCalendarEvent[]` with `useMemo`

### EventForm.tsx (Modal Dialog)
- Modal with backdrop click-to-close
- Validates that end time > start time
- Dual mode: create (new events) vs edit (existing events)

## Known Issues & Solutions

### Issue 1: TypeScript Errors with react-big-calendar

**Problem**: Generic types not inferred correctly for drag-and-drop handlers

**Solution** (`src/components/Calendar.tsx:24,28`):
```typescript
import { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
const DragAndDropCalendar = withDragAndDrop<BigCalendarEvent>(BigCalendar);
```

Then use `EventInteractionArgs<BigCalendarEvent>` for handler types.

### Issue 2: stringOrDate Type in Event Handlers

**Problem**: `EventInteractionArgs` uses `start: stringOrDate` which can be string OR Date

**Solution** (`src/components/App.tsx:50-66`):
```typescript
const startDate = typeof data.start === 'string' ? new Date(data.start) : data.start;
const endDate = typeof data.end === 'string' ? new Date(data.end) : data.end;
```

### Issue 3: Vite Browser Compatibility Warnings

**Expected Behavior**: Build shows warnings about fs/path being externalized
- This is NORMAL for NW.js apps
- These modules are available at runtime via Node.js
- Don't try to "fix" by bundling them

## Development Workflow

### Standard Development
```bash
npm run dev        # Vite dev server (for UI work)
npm run nw-dev     # Build + run in NW.js (full testing)
```

### Testing Changes
Always test in NW.js (`npm run nw-dev`) before considering complete, because:
- Vite dev server doesn't test Node.js integration
- Database operations won't work in browser
- NW.js window API differences

### Building
```bash
npm run build      # TypeScript check + Vite build
npm run nw         # Run already-built app
```

## File Organization

```
src/
├── components/        # React UI components
│   ├── App.tsx       # Main app controller - event state & CRUD
│   ├── Calendar.tsx  # react-big-calendar wrapper with D&D
│   └── EventForm.tsx # Modal form for create/edit/delete
├── db/
│   └── database.ts   # SQLite wrapper, singleton pattern
├── types/
│   └── index.ts      # All TypeScript interfaces
└── utils/
    └── dateHelpers.ts # Date ↔ ISO string conversion
```

## Important Constants

- **Week Start**: Sunday (0) - defined in `dateHelpers.ts:11`
- **Time Slot**: 30 minutes - defined in `Calendar.tsx:61`
- **Default View**: Week view - defined in `Calendar.tsx:59`

## Dependencies to Watch

### Critical Native Dependencies
- **better-sqlite3**: Native module, version-sensitive to Node.js version in NW.js
  - If updating NW.js, may need to rebuild or update better-sqlite3

### UI Dependencies
- **react-big-calendar**: Provides calendar grid
- **react-big-calendar/lib/addons/dragAndDrop**: Adds drag-and-drop (separate import)
- **date-fns**: Used by both our code and react-big-calendar's localizer

## Common Tasks

### Adding a New Event Field

1. Update schema in `database.ts:36-47`
2. Add to `CalendarEvent` interface in `types/index.ts:7-15`
3. Update `EventFormData` if needed in `types/index.ts:17-22`
4. Add to `createEvent` and `updateEvent` in `database.ts:51-112`
5. Add form field in `EventForm.tsx`
6. Update handlers in `App.tsx` to include new field

### Changing Calendar View Options

Modify `Calendar.tsx:59-60`:
```typescript
defaultView={Views.WEEK}
views={[Views.WEEK, Views.DAY, Views.MONTH]}  // Add/remove views
```

### Changing Time Slot Granularity

Modify `Calendar.tsx:61`:
```typescript
step={30}  // Change to 15, 30, 60, etc. (minutes)
```

## Debugging Tips

### Database Issues
- Database file location is OS-dependent (see Database Architecture above)
- Check file permissions in app data directory
- Use `verbose: true` in DatabaseConfig for SQL logging

### NW.js Issues
- Check browser console (F12) for errors
- Check terminal output for Node.js errors
- Verify `window.nodeRequire` is defined (shows Node.js is available)

### Type Errors
- Most type issues are with react-big-calendar generics
- Always specify `<BigCalendarEvent>` type parameter
- Check that date conversions happen at component boundaries

## Future Enhancement Ideas

From `Plan.md:223-230`:
- Multiple calendar views (month, year)
- Event categories/colors
- Recurring events
- Search functionality
- Data export/import
- Multiple calendars
- Reminders/notifications

## Testing Checklist

Before considering a feature complete:
- [ ] TypeScript compiles with no errors
- [ ] Vite build completes successfully
- [ ] App runs in NW.js (`npm run nw`)
- [ ] Database operations work (create/read/update/delete)
- [ ] Drag-and-drop works (events move correctly)
- [ ] Event resizing works
- [ ] Form validation works
- [ ] No console errors in NW.js

## Last Updated
2026-01-27 - Initial implementation complete
