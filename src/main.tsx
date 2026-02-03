import React, { useEffect, useMemo, useState } from 'react';
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
import { addBlock, deleteBlock, setDateRange, updateBlockTime } from './store/actions';
import { CalendarBlock } from './store/types';
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

interface BlockWrapperProps {
  event: CalendarBlock;
  children: React.ReactNode;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const dateRange = useSelector((state: RootState) => state.dateRange);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  // Set initial date range for the week view
  useEffect(() => {
    const now = new Date();
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    dispatch(setDateRange(start, end));
  }, [dispatch]);

  // Query blocks from DB whenever date range changes
  const blocks = useMemo(() => {
    if (!dateRange) return [];
    const db = getDatabase();
    return db.getBlocksByDateRange(dateRange.start, dateRange.end);
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

  const handleDeleteBlock = (blockId: number) => {
    deleteBlock(blockId);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  function BlockWrapper({ event: block, children }: BlockWrapperProps) {
    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      console.log('Right click on block:', block);

      const menu = new nw.Menu();
      menu.append(new nw.MenuItem({
        label: 'Delete',
        click: () => {
          console.log('Delete clicked for block:', block);
          handleDeleteBlock(block.id);
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

  function CustomBlockEvent({ event: block }: { event: CalendarBlock }) {
    const isEditing = editingBlockId === block.id;

    const handleEditClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingBlockId(block.id);
      setEditingTitle(block.title);
    };

    const handleSave = () => {
      const finalTitle = editingTitle.trim() !== '' ? editingTitle.trim() : 'Untitled';
      const db = getDatabase();
      db.updateBlockTitle(block.id, finalTitle);

      // Re-trigger render by updating the date range (same range)
      if (dateRange) {
        dispatch(setDateRange(dateRange.start, dateRange.end));
      }
      setEditingBlockId(null);
      setEditingTitle('');
    };

    const handleCancel = () => {
      // If canceling a new block with empty title, delete it
      if (block.title === '' && editingTitle.trim() === '') {
        handleDeleteBlock(block.id);
      }
      setEditingBlockId(null);
      setEditingTitle('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    if (isEditing) {
      return (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            padding: 0,
            outline: 'none',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ flex: 1 }}>{block.title}</span>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleEditClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            fontSize: '14px',
            lineHeight: '1',
          }}
        >
          ✏️
        </button>
      </div>
    );
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const newBlock: CalendarBlock = {
      id: Date.now(),
      title: '',
      start: slotInfo.start,
      end: slotInfo.end,
    };
    addBlock(newBlock);
    // Enter edit mode for the new block
    setEditingBlockId(newBlock.id);
    setEditingTitle('');
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  const handleSelectBlock = (block: CalendarBlock, e: React.SyntheticEvent) => {
    const nativeEvent = e.nativeEvent as MouseEvent;
    console.log('Block selected:', block);
    console.log('Native event:', nativeEvent);
    console.log('Button:', nativeEvent.button);

    if (nativeEvent.button === 2) {
      console.log('Right click detected!');
    }
  };

  const handleBlockDrop = ({ event, start, end }: { event: CalendarBlock; start: Date; end: Date }) => {
    updateBlockTime(event.id, start, end);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  const handleBlockResize = ({ event, start, end }: { event: CalendarBlock; start: Date; end: Date }) => {
    updateBlockTime(event.id, start, end);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  return (
    <div style={{ height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      <DnDCalendar
        localizer={localizer}
        events={blocks}
        defaultView="work_week"
        views={['month', 'week', 'work_week', 'day', 'agenda']}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectBlock}
        onRangeChange={handleRangeChange}
        onEventDrop={handleBlockDrop}
        onEventResize={handleBlockResize}
        components={{
          eventWrapper: BlockWrapper,
          event: CustomBlockEvent,
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
