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
import './styles.css';
import { store, RootState, AppDispatch } from './store/store';
import { addBlock, deleteBlock, setDateRange, updateBlockTime, setCategories, addCategory, updateCategory, deleteCategory, toggleSidebar, updateBlockCategory } from './store/actions';
import { CalendarBlock } from './store/types';
import { openDatabase, getDatabase, Category } from './db/database';
import { Sidebar } from './components/Sidebar';
import { CategoryDialog } from './components/CategoryDialog';

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

// Check for upcoming blocks and show notification
function checkUpcomingBlocks() {
  const db = getDatabase();
  const now = new Date();
  const futureTime = new Date(now.getTime() + 30 * 1000); // 30 seconds from now
  const nextBlock = db.getNextUpcomingBlock(now, futureTime);

  if (nextBlock) {
    nw.Window.open('notification.html', {
      width: 350,
      height: 150,
      resizable: false,
      frame: true,
      show: true,
    }, function(notificationWin: any) {
      notificationWin.setAlwaysOnTop(true);

      // Center the window on screen
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const windowWidth = 350;
      const windowHeight = 150;
      const x = Math.floor((screenWidth - windowWidth) / 2);
      const y = Math.floor((screenHeight - windowHeight) / 2);
      notificationWin.moveTo(x, y);

      // Pass block data to the notification window
      notificationWin.on('loaded', function() {
        notificationWin.window.setBlockData(nextBlock);
      });
    });
  }
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

const DnDCalendar = withDragAndDrop<CalendarBlock>(Calendar);

interface BlockWrapperProps {
  event: CalendarBlock;
  children?: React.ReactNode;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const dateRange = useSelector((state: RootState) => state.dateRange);
  const categories = useSelector((state: RootState) => state.categories);
  const sidebarCollapsed = useSelector((state: RootState) => state.sidebarCollapsed);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [showWorkHoursOnly, setShowWorkHoursOnly] = useState<boolean>(true);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentView, setCurrentView] = useState<string>('work_week');
  const [now, setNow] = useState<Date>(new Date());

  // Border width for category color indicators
  const categoryBorderWidth = '0.5em';

  // Load categories on mount
  useEffect(() => {
    const db = getDatabase();
    const categories = db.getAllCategories();
    dispatch(setCategories(categories));
  }, [dispatch]);

  // Update 'now' every 30 seconds to keep the current time indicator fresh
  // Also check for upcoming blocks
  useEffect(() => {
    // Check immediately on mount
    checkUpcomingBlocks();

    const interval = setInterval(() => {
      setNow(new Date());
      checkUpcomingBlocks();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

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

  // Create synthetic all-day events showing category hour totals per day
  const eventsWithHourTotals = useMemo(() => {
    if (!dateRange) return blocks;

    const syntheticEvents: CalendarBlock[] = [];

    // Get all days in the current date range
    const currentDate = new Date(dateRange.start);
    while (currentDate < dateRange.end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Filter blocks for this day
      const dayBlocks = blocks.filter(block => {
        const blockStart = new Date(block.start);
        const blockEnd = new Date(block.end);
        return blockStart < dayEnd && blockEnd > dayStart;
      });

      // Calculate hours per category
      const categoryHours = new Map<number, number>();
      dayBlocks.forEach(block => {
        if (block.categoryId) {
          const blockStart = new Date(Math.max(block.start.getTime(), dayStart.getTime()));
          const blockEnd = new Date(Math.min(block.end.getTime(), dayEnd.getTime()));
          const hours = (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60 * 60);

          const current = categoryHours.get(block.categoryId) || 0;
          categoryHours.set(block.categoryId, current + hours);
        }
      });

      // Create one synthetic all-day event per category (only if includeInTotals is true)
      let totalHours = 0;
      Array.from(categoryHours.entries()).forEach(([categoryId, hours]) => {
        const category = categories.find(c => c.id === categoryId);
        if (category && category.includeInTotals) {
          totalHours += hours;
          syntheticEvents.push({
            id: -1 * (dayStart.getTime() + categoryId), // Unique negative ID
            title: `${category.name}: ${hours.toFixed(2)}h`,
            start: dayStart,
            end: dayStart,
            categoryId: categoryId, // Use actual category ID for coloring
          });
        }
      });

      // Add a total synthetic event if there are any hours
      if (totalHours > 0) {
        syntheticEvents.push({
          id: -1 * dayStart.getTime(), // Unique negative ID for total
          title: `Total: ${totalHours.toFixed(2)}h`,
          start: dayStart,
          end: dayStart,
          categoryId: -999, // Special marker for total event
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // In month view, only show synthetic events (totals only)
    // In other views, show both synthetic events and blocks
    if (currentView === 'month') {
      return syntheticEvents;
    } else {
      return [...syntheticEvents, ...blocks];
    }
  }, [blocks, dateRange, categories, currentView]);

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

  // Category dialog handlers
  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setShowCategoryDialog(true);
  };

  const handleEditCategoryClick = (category: Category) => {
    // Reload categories from DB to get fresh data
    const db = getDatabase();
    const freshCategories = db.getAllCategories();
    dispatch(setCategories(freshCategories));

    // Find the fresh category data
    const freshCategory = freshCategories.find(c => c.id === category.id);
    setEditingCategory(freshCategory || category);
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = (name: string, color: string, includeInTotals: boolean) => {
    try {
      if (editingCategory) {
        dispatch(updateCategory(editingCategory.id, { name, color, includeInTotals }));
      } else {
        dispatch(addCategory(name, color, includeInTotals));
      }
      setShowCategoryDialog(false);

      // Reload categories from DB to ensure Redux state is fresh
      const db = getDatabase();
      const freshCategories = db.getAllCategories();
      dispatch(setCategories(freshCategories));
    } catch (error: any) {
      // Provide user-friendly error for duplicate names
      if (error.message && error.message.includes('UNIQUE')) {
        alert(`A category named "${name}" already exists. Please choose a different name.`);
      } else {
        alert(error.message || 'An error occurred while saving the category.');
      }
    }
  };

  const handleDeleteCategory = (categoryId: number) => {
    // Prevent deletion of last category
    if (categories.length <= 1) {
      alert('Cannot delete the last category. You must have at least one category.');
      return;
    }

    const db = getDatabase();
    const blockCount = db.getBlockCountByCategory(categoryId);

    if (blockCount > 0) {
      alert(`Cannot delete category: ${blockCount} block(s) are using this category`);
      return;
    }

    if (confirm('Are you sure you want to delete this category?')) {
      try {
        dispatch(deleteCategory(categoryId));
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  function BlockWrapper({ event: block, children }: BlockWrapperProps) {
    // Don't show context menu for synthetic hour total events (negative IDs)
    if (block.id < 0) {
      return <div style={{ height: '100%' }}>{children}</div>;
    }

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      console.log('Right click on block:', block);

      const menu = new nw.Menu();

      menu.append(nw.MenuItem({
        label: 'Delete',
        click: () => {
          console.log('Delete clicked for block:', block);
          handleDeleteBlock(block.id);
        }
      }));

      menu.append(nw.MenuItem({ type: 'separator' }));

      // Add category items
      categories.forEach(category => {
        menu.append(nw.MenuItem({
          label: category.name,
          type: 'checkbox',
          checked: block.categoryId === category.id,
          click: () => {
            updateBlockCategory(block.id, category.id);
            if (dateRange) {
              dispatch(setDateRange(dateRange.start, dateRange.end));
            }
          }
        }));
      });
      menu.popup(e.clientX, e.clientY);
    };

    return (
      <div onContextMenu={handleContextMenu} style={{ height: '100%' }}>
        {children}
      </div>
    );
  }

  function CustomBlockEvent({ event: block }: { event: CalendarBlock }) {
    // For synthetic hour total events, just display the title without edit button
    if (block.id < 0) {
      return <div style={{ width: '100%', padding: '2px' }}>{block.title}</div>;
    }

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
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleEditClick}
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '12px',
            lineHeight: '1',
            zIndex: 10,
          }}
        >
          ✏️
        </button>
        <div style={{ paddingRight: '24px', paddingTop: '2px' }}>{block.title}</div>
      </div>
    );
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const firstCategory = categories[0];
    if (!firstCategory) {
      alert('Please create a category first');
      return;
    }

    const newBlock: CalendarBlock = {
      id: Date.now(),
      title: '',
      start: slotInfo.start,
      end: slotInfo.end,
      categoryId: firstCategory.id,
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

  const handleBlockDrop = ({ event, start, end }: { event: CalendarBlock; start: string | Date; end: string | Date }) => {
    // Prevent moving synthetic hour total events
    if (event.id < 0) return;

    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;

    updateBlockTime(event.id, startDate, endDate);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  const handleBlockResize = ({ event, start, end }: { event: CalendarBlock; start: string | Date; end: string | Date }) => {
    // Prevent resizing synthetic hour total events
    if (event.id < 0) return;

    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;

    updateBlockTime(event.id, startDate, endDate);
    // Re-trigger render by updating the date range (same range)
    if (dateRange) {
      dispatch(setDateRange(dateRange.start, dateRange.end));
    }
  };

  // Apply category colors to blocks
  const eventStyleGetter = (event: CalendarBlock) => {
    // Special styling for total event
    if (event.categoryId === -999) {
      return {
        style: {
          backgroundColor: '#ffffff',
          color: '#000000',
          border: '1px solid #ddd',
          borderLeft: `${categoryBorderWidth} solid #666`,
          fontWeight: 'bold',
        }
      };
    }

    const category = categories.find(c => c.id === event.categoryId);
    const color = category?.color || '#E5E5E5';
    return {
      style: {
        backgroundColor: '#f5f5f5',
        color: '#000000',
        border: '1px solid #ddd',
        borderLeft: `${categoryBorderWidth} solid ${color}`,
      }
    };
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with toggle button and work hours checkbox */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => dispatch(toggleSidebar())}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {sidebarCollapsed ? '☰ Show Categories' : '☰ Hide Categories'}
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showWorkHoursOnly}
            onChange={(e) => setShowWorkHoursOnly(e.target.checked)}
          />
          <span>Work hours only (6:00 AM - 6:00 PM)</span>
        </label>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <Sidebar
            onAddCategory={handleAddCategoryClick}
            onEditCategory={handleEditCategoryClick}
            onDeleteCategory={handleDeleteCategory}
            categoryBorderWidth={categoryBorderWidth}
          />
        )}

        {/* Calendar */}
        <div style={{ flex: 1, paddingTop: '16px', boxSizing: 'border-box' }}>
          <DnDCalendar
            localizer={localizer}
            events={eventsWithHourTotals}
            defaultView="work_week"
            views={['month', 'week', 'work_week', 'day', 'agenda']}
            selectable
            step={15}
            timeslots={4}
            {...({ now } as any)}
            min={showWorkHoursOnly ? new Date(1970, 0, 1, 6, 0, 0) : undefined}
            max={showWorkHoursOnly ? new Date(1970, 0, 1, 18, 0, 0) : undefined}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectBlock}
            onRangeChange={handleRangeChange}
            onView={(view) => setCurrentView(view)}
            onEventDrop={handleBlockDrop}
            onEventResize={handleBlockResize}
            eventPropGetter={eventStyleGetter}
            components={{
              eventWrapper: BlockWrapper,
              event: CustomBlockEvent,
            }}
            style={{ height: '100%' }}
          />
        </div>
      </div>

      {/* Category Dialog */}
      {showCategoryDialog && (
        <CategoryDialog
          category={editingCategory || undefined}
          onSave={handleSaveCategory}
          onCancel={() => setShowCategoryDialog(false)}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
