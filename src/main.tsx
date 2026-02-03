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
import { addBlock, deleteBlock, setDateRange, updateBlockTime, setCategories, addCategory, updateCategory, deleteCategory, toggleSidebar, updateBlockCategory } from './store/actions';
import { CalendarBlock } from './store/types';
import { openDatabase, getDatabase, Category } from './db/database';
import { Sidebar } from './components/Sidebar';
import { CategoryDialog } from './components/CategoryDialog';

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
  const categories = useSelector((state: RootState) => state.categories);
  const sidebarCollapsed = useSelector((state: RootState) => state.sidebarCollapsed);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [showWorkHoursOnly, setShowWorkHoursOnly] = useState<boolean>(true);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Load categories on mount
  useEffect(() => {
    const db = getDatabase();
    const categories = db.getAllCategories();
    dispatch(setCategories(categories));
  }, [dispatch]);

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

  // Category dialog handlers
  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setShowCategoryDialog(true);
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = (name: string, color: string) => {
    try {
      if (editingCategory) {
        dispatch(updateCategory(editingCategory.id, { name, color }));
      } else {
        dispatch(addCategory(name, color));
      }
      setShowCategoryDialog(false);
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

      menu.append(new nw.MenuItem({ type: 'separator' }));

      // Add category items
      categories.forEach(category => {
        menu.append(new nw.MenuItem({
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

  // Apply category colors to blocks
  const eventStyleGetter = (event: CalendarBlock) => {
    const category = categories.find(c => c.id === event.categoryId);
    return {
      style: {
        backgroundColor: category?.color || '#E5E5E5',
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
          />
        )}

        {/* Calendar */}
        <div style={{ flex: 1, paddingTop: '16px', boxSizing: 'border-box' }}>
          <DnDCalendar
            localizer={localizer}
            events={blocks}
            defaultView="work_week"
            views={['month', 'week', 'work_week', 'day', 'agenda']}
            selectable
            step={15}
            timeslots={4}
            min={showWorkHoursOnly ? new Date(1970, 0, 1, 6, 0, 0) : undefined}
            max={showWorkHoursOnly ? new Date(1970, 0, 1, 18, 0, 0) : undefined}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectBlock}
            onRangeChange={handleRangeChange}
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
