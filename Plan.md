# Calendar App Plan

## Overview
A desktop calendar application built with NW.js (NodeWebkit) that provides a weekly view with drag-and-drop functionality for managing calendar entries.

## Technology Stack

### Core Technologies
- **NW.js**: Desktop application framework (combines Chromium and Node.js)
- **React**: UI library for building the interface
- **TypeScript**: Type-safe JavaScript for better development experience
- **SQLite**: Lightweight database for data persistence
- **Node.js**: Backend functionality and file system access

### React Calendar Libraries (Options)
- **react-big-calendar**: Feature-rich calendar component with drag-and-drop support
- **FullCalendar React**: Popular calendar with excellent drag-and-drop capabilities
- **react-calendar-timeline**: Good for timeline/weekly views

**Recommendation**: react-big-calendar with react-dnd (drag-and-drop) or FullCalendar React

### Additional Dependencies
- **better-sqlite3**: Synchronous SQLite3 bindings for Node.js
- **@types/better-sqlite3**: TypeScript type definitions
- **date-fns** or **moment.js**: Date manipulation utilities
- **react-dnd**: Drag-and-drop functionality (if not built into calendar library)
- **@types/react**, **@types/node**: TypeScript type definitions
- **typescript**: TypeScript compiler
- **ts-loader** or **@vitejs/plugin-react**: TypeScript build tooling

## Database Schema

### Single Table: `events`

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

CREATE INDEX idx_start_time ON events(start_time);
CREATE INDEX idx_end_time ON events(end_time);
```

## TypeScript Type Definitions

### Core Types

```typescript
// src/types/index.ts

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_time: string; // ISO 8601 datetime string
  end_time: string;   // ISO 8601 datetime string
  created_at?: string;
  updated_at?: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
}

export interface DatabaseConfig {
  path: string;
  verbose?: boolean;
}
```

## Application Architecture

### Directory Structure
```
willcal/
├── package.json
├── tsconfig.json       # TypeScript configuration
├── index.html          # NW.js entry point
├── src/
│   ├── main.ts         # Application initialization
│   ├── db/
│   │   └── database.ts # SQLite database wrapper
│   ├── components/
│   │   ├── App.tsx     # Main app component
│   │   ├── Calendar.tsx # Calendar view component
│   │   └── EventForm.tsx # Event creation/editing form
│   ├── types/
│   │   └── index.ts    # TypeScript type definitions
│   └── utils/
│       └── dateHelpers.ts # Date utility functions
├── dist/               # Webpack/Vite build output
└── styles/
    └── main.css        # Application styles
```

## Core Features

### 1. Weekly Calendar View
- Display current week with time slots
- Show all events for the week
- Navigate between weeks (previous/next)
- Display current day indicator

### 2. Event Management
- **Add Events**: Click on empty time slot to create new event
- **Move Events**: Drag event to different time slot
- **Resize Events**: Drag event edges to adjust duration
- **Edit Events**: Click event to edit title/description
- **Delete Events**: Option to delete events

### 3. Database Operations
- Initialize database on first run
- CRUD operations for events:
  - Create: INSERT new event
  - Read: SELECT events for date range
  - Update: UPDATE event times/details when moved/resized
  - Delete: DELETE event by ID

## Implementation Steps

### Phase 1: Project Setup
1. Initialize npm project
2. Install NW.js and configure package.json
3. Install TypeScript and configure tsconfig.json
4. Install React and build tools (Webpack/Vite with TypeScript support)
5. Install SQLite library (better-sqlite3) and type definitions
6. Install all type definitions (@types/react, @types/node, etc.)
7. Create basic directory structure

### Phase 2: Database Layer
1. Define TypeScript interfaces for events and database operations
2. Create database initialization module with type safety
3. Implement schema creation
4. Build typed CRUD functions for events
5. Add error handling and validation

### Phase 3: React Components
1. Set up React app with webpack/vite
2. Install chosen calendar library
3. Create main App component
4. Implement Calendar component with weekly view
5. Configure drag-and-drop functionality

### Phase 4: Event Management
1. Implement event creation (click to add)
2. Implement event dragging (move events)
3. Implement event resizing
4. Connect UI actions to database operations
5. Add event editing modal/form
6. Add event deletion

### Phase 5: Polish & Testing
1. Add styles and improve UX
2. Implement week navigation
3. Add loading states
4. Error handling and validation
5. Test all CRUD operations
6. Test drag-and-drop edge cases

## Technical Considerations

### TypeScript Configuration
- Enable strict mode for maximum type safety
- Configure paths for module resolution
- Target ES2020 or later for modern features
- Enable JSX for React (tsx files)
- Include Node.js and React type definitions

**Sample tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### NW.js Configuration
- Set window size and properties in package.json
- Configure Node.js integration
- Set up proper security context for Node.js APIs

### Data Flow
1. User interacts with React calendar component
2. Component triggers event handler (create/update/delete)
3. Event handler calls database function
4. Database operation completes
5. Component state updates
6. Calendar re-renders with new data

### Database Access
- Use synchronous SQLite operations (better-sqlite3) for simplicity
- Keep database file in user's app data directory
- Implement proper connection management

### Date Handling
- Store all times in UTC in database
- Convert to local timezone for display
- Handle daylight saving time transitions

## Future Enhancements (Out of Scope)
- Multiple calendar views (day, month, year)
- Event categories/colors
- Recurring events
- Search functionality
- Data export/import
- Multiple calendars
- Reminders/notifications
