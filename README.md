# WillCal - Desktop Calendar Application

A desktop calendar application built with NW.js, React, TypeScript, and SQLite that provides a weekly view with drag-and-drop functionality for managing calendar entries.

## Features

- **Weekly Calendar View**: View your schedule for the week with time slots
- **Drag & Drop**: Move events by dragging them to different time slots
- **Event Resizing**: Resize events by dragging their edges to adjust duration
- **Event Management**: Create, edit, and delete events with an intuitive form
- **Persistent Storage**: All events are stored locally in a SQLite database
- **Responsive UI**: Clean, modern interface with smooth interactions

## Technology Stack

- **NW.js**: Desktop application framework
- **React**: UI library
- **TypeScript**: Type-safe development
- **SQLite** (better-sqlite3): Local data persistence
- **react-big-calendar**: Calendar component with drag-and-drop
- **date-fns**: Date manipulation utilities
- **Vite**: Fast build tooling

## Getting Started

### Prerequisites

#### NixOS / Nix Users

Enter the development shell which provides all dependencies:
```bash
nix-shell
```

Or if you use direnv:
```bash
direnv allow
```

This provides:
- Node.js and npm
- NW.js runtime
- Build tools for native modules (better-sqlite3)
- All required system libraries

#### Other Linux / macOS / Windows

- Node.js (v18 or higher)
- npm
- NW.js (install globally: `npm install -g nw`)

### Installation

1. Clone the repository
2. Enter the Nix shell (NixOS users):
   ```bash
   nix-shell
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To run the application in development mode:

```bash
npm run dev
```

This will start the Vite dev server. To run it in NW.js:

```bash
npm run nw-dev
```

### Building

To build the application:

```bash
npm run build
```

### Running

To run the built application with NW.js:

```bash
npm run nw
```

## Usage

### Creating Events

1. Click on any empty time slot in the calendar
2. Fill in the event details (title, description, start/end times)
3. Click "Create"

### Editing Events

1. Click on an existing event
2. Modify the details in the form
3. Click "Save"

### Moving Events

1. Click and drag an event to a new time slot
2. The event will be automatically updated in the database

### Resizing Events

1. Hover over the top or bottom edge of an event
2. Drag to adjust the duration
3. The event will be automatically updated

### Deleting Events

1. Click on an event to open the edit form
2. Click the "Delete" button
3. Confirm the deletion

## Project Structure

```
willcal/
├── src/
│   ├── components/          # React components
│   │   ├── App.tsx          # Main application component
│   │   ├── Calendar.tsx     # Calendar view with drag-and-drop
│   │   └── EventForm.tsx    # Event creation/editing form
│   ├── db/
│   │   └── database.ts      # SQLite database wrapper
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── utils/
│   │   └── dateHelpers.ts   # Date utility functions
│   └── main.tsx             # Application entry point
├── styles/                  # CSS styles
├── dist/                    # Build output
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── index.html               # NW.js entry point
```

## Database

The application uses SQLite to store calendar events locally. The database file is stored in:

- **Windows**: `%APPDATA%/willcal/calendar.db`
- **macOS**: `~/Library/Application Support/willcal/calendar.db`
- **Linux**: `~/.local/share/willcal/calendar.db`

### Database Schema

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

## Future Enhancements

- Multiple calendar views (day, month, year)
- Event categories with colors
- Recurring events
- Search functionality
- Data export/import
- Multiple calendars
- Reminders and notifications

## License

ISC
