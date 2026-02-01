import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import path from 'path';
import fs from 'fs';
import os from 'os';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { store, RootState, AppDispatch } from './store/store';
import { addEvent, deleteEvent, setDateRange, updateEventTime } from './store/actions';
import { CalendarEvent } from './store/types';
import { openDatabase, getDatabase } from './db/database';

declare const nw: any;

// Parse command line arguments for database filename
function getDatabaseFilename(): string {
  const args = nw.App.argv.slice(2); // Skip node and script path

  for (const arg of args) {
    if (arg.startsWith('--db=')) {
      return arg.substring(5);
    }
  }

  // Default: use XDG_DATA_HOME or ~/.local/share
  const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  const appDataDir = path.join(dataHome, 'willcal');

  // Create directory if it doesn't exist
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }

  return path.join(appDataDir, 'willcal.db');
}

// Initialize database on startup
try {
  const dbFilename = getDatabaseFilename();
  console.log('Using database:', dbFilename);
  openDatabase(dbFilename);
} catch (error) {
  console.error('Database initialization failed:', error);
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface EventWrapperProps {
  event: CalendarEvent;
  children: React.ReactNode;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const dateRange = useSelector((state: RootState) => state.dateRange);

  // Set initial date range for the week view
  useEffect(() => {
    const now = new Date();
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    dispatch(setDateRange(start, end));
  }, [dispatch]);

  // Query events from DB whenever date range changes
  const events = useMemo(() => {
    if (!dateRange) return [];
    const db = getDatabase();
    return db.getEventsByDateRange(dateRange.start, dateRange.end);
  }, [dateRange]);

  const handleRangeChange = (range: Date[] | { start: Date; end: Date }) => {
    let start: Date;
    let end: Date;

    if (Array.isArray(range)) {
      // For week view, range is an array of dates
      start = range[0];
      end = range[range.length - 1];
      // Add one day to end to include the full last day
      end = new Date(end);
      end.setDate(end.getDate() + 1);
    } else {
      // For month/agenda views, range is an object with start and end
      start = range.start;
      end = range.end;
    }

    dispatch(setDateRange(start, end));
  };

  const handleDeleteEvent = (eventId: number) => {
    deleteEvent(eventId);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  function EventWrapper({ event, children }: EventWrapperProps) {
    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      console.log('Right click on event:', event);

      const menu = new nw.Menu();
      menu.append(new nw.MenuItem({
        label: 'Delete',
        click: () => {
          console.log('Delete clicked for event:', event);
          handleDeleteEvent(event.id);
        }
      }));

      menu.popup(e.clientX, e.clientY);
    };

    return (
      <div onContextMenu={handleContextMenu} style={{ height: '100%' }}>
        {children}
      </div>
    );
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: 'New Event',
      start: slotInfo.start,
      end: slotInfo.end,
    };
    addEvent(newEvent);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  const handleSelectEvent = (event: CalendarEvent, e: React.SyntheticEvent) => {
    const nativeEvent = e.nativeEvent as MouseEvent;
    console.log('Event selected:', event);
    console.log('Native event:', nativeEvent);
    console.log('Button:', nativeEvent.button);

    if (nativeEvent.button === 2) {
      console.log('Right click detected!');
    }
  };

  const handleEventDrop = ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    updateEventTime(event.id, start, end);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  const handleEventResize = ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    updateEventTime(event.id, start, end);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  return (
    <div style={{ height: '100vh' }}>
      <DnDCalendar
        localizer={localizer}
        events={events}
        defaultView="week"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onRangeChange={handleRangeChange}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        components={{
          eventWrapper: EventWrapper,
        }}
        style={{ height: '100%' }}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
