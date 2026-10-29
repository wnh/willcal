import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './styles.css';
import { store, RootState, AppDispatch } from './store/store';
import {
  setDateRange,
  setCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  toggleSidebar,
} from './store/actions';
import { CalendarBlock, Category } from './shared/types';
import * as api from './client/api';
import { onUnauthorized } from './client/rpc';
import { Sidebar } from './components/Sidebar';
import { CategoryDialog } from './components/CategoryDialog';
import { LoginScreen } from './components/LoginScreen';
import { NotificationModal } from './components/NotificationModal';
import { BlockContextMenu, ContextMenuTarget } from './components/BlockContextMenu';
import TwoDayView from './components/TwoDayView';

/** How far ahead the poll looks for a starting block, and how often it runs. */
const NOTIFICATION_WINDOW_MS = 30 * 1000;
const POLL_INTERVAL_MS = 30 * 1000;

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

interface PendingNotification {
  block: CalendarBlock;
  isWarning: boolean;
  /** Identifies the notification so a dismissed one is not shown again. */
  key: string;
}

/** Surfaces a failed action the way the desktop build did: a blocking alert. */
function reportError(error: unknown, fallback: string): void {
  const message = error instanceof Error ? error.message : String(error);
  alert(message || fallback);
}

function App({ onSignOut }: { onSignOut: () => void }) {
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
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);
  const [notification, setNotification] = useState<PendingNotification | null>(null);

  // Notifications for a given block are shown once; dismissing one stops the
  // 30-second poll from reopening it on the next tick.
  const dismissedNotification = useRef<string | null>(null);

  // Border width for category color indicators
  const categoryBorderWidth = '0.5em';

  /** Re-fetches blocks for the current range from the server. */
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  // Load categories on mount
  useEffect(() => {
    api.categories
      .getAll()
      .then((loaded) => dispatch(setCategories(loaded)))
      .catch((error) => console.error('Failed to load categories:', error));
  }, [dispatch]);

  // Update 'now' every 30 seconds to keep the current time indicator fresh
  // Also check for upcoming blocks
  useEffect(() => {
    let cancelled = false;

    const checkUpcomingBlocks = async () => {
      try {
        const { next, current } = await api.blocks.getUpcoming(
          new Date(),
          NOTIFICATION_WINDOW_MS
        );
        if (cancelled) return;

        // A block ending within the window with nothing scheduled after it.
        let isGapWarning = false;
        if (current && !next) {
          const timeUntilEnd = current.end.getTime() - Date.now();
          if (timeUntilEnd > 0 && timeUntilEnd <= NOTIFICATION_WINDOW_MS) {
            isGapWarning = true;
          }
        }

        const block = isGapWarning ? current : next;
        if (!block) return;

        const key = `${isGapWarning ? 'gap' : 'next'}:${block.id}`;
        if (dismissedNotification.current === key) return;

        setNotification((existing) => (existing?.key === key ? existing : { block, isWarning: isGapWarning, key }));
      } catch (error) {
        // A dropped connection should not interrupt the calendar.
        console.error('Upcoming block check failed:', error);
      }
    };

    checkUpcomingBlocks();

    const interval = setInterval(() => {
      setNow(new Date());
      checkUpcomingBlocks();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Set initial date range for the week view
  useEffect(() => {
    const now = new Date();
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    dispatch(setDateRange(start, end));
  }, [dispatch]);

  // Fetch blocks from the server whenever the range changes or something has
  // been written. Stale responses are discarded so a slow request cannot
  // overwrite the results of a newer one.
  useEffect(() => {
    if (!dateRange) return;

    let cancelled = false;
    setLoading(true);

    api.blocks
      .getByDateRange(dateRange.start, dateRange.end)
      .then((loaded) => {
        if (!cancelled) setBlocks(loaded);
      })
      .catch((error) => {
        if (!cancelled) console.error('Failed to load blocks:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateRange, reloadKey]);

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

  const handleDeleteBlock = async (blockId: number) => {
    try {
      await api.blocks.delete(blockId);
    } catch (error) {
      reportError(error, 'Failed to delete block.');
    }
    reload();
  };

  const handleSetBlockCategory = async (blockId: number, categoryId: number) => {
    // Applied locally first so the color changes immediately, then confirmed.
    setBlocks((current) =>
      current.map((block) => (block.id === blockId ? { ...block, categoryId } : block))
    );
    try {
      await api.blocks.updateCategory(blockId, categoryId);
    } catch (error) {
      reportError(error, 'Failed to change block category.');
    }
    reload();
  };

  // Category dialog handlers
  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setShowCategoryDialog(true);
  };

  const handleEditCategoryClick = async (category: Category) => {
    // Reload categories from the server to get fresh data
    try {
      const freshCategories = await api.categories.getAll();
      dispatch(setCategories(freshCategories));
      setEditingCategory(freshCategories.find(c => c.id === category.id) || category);
    } catch (error) {
      console.error('Failed to refresh categories:', error);
      setEditingCategory(category);
    }
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = async (name: string, color: string, includeInTotals: boolean) => {
    try {
      if (editingCategory) {
        await api.categories.update(editingCategory.id, { name, color, includeInTotals });
        dispatch(updateCategory(editingCategory.id, { name, color, includeInTotals }));
      } else {
        const created = await api.categories.add(name, color, includeInTotals);
        dispatch(addCategory(created));
      }
      setShowCategoryDialog(false);

      // Reload categories from the server to ensure Redux state is fresh
      dispatch(setCategories(await api.categories.getAll()));
      reload();
    } catch (error: any) {
      // Provide user-friendly error for duplicate names
      if (error.message && error.message.includes('UNIQUE')) {
        alert(`A category named "${name}" already exists. Please choose a different name.`);
      } else {
        reportError(error, 'An error occurred while saving the category.');
      }
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    // Prevent deletion of last category
    if (categories.length <= 1) {
      alert('Cannot delete the last category. You must have at least one category.');
      return;
    }

    try {
      const blockCount = await api.categories.blockCount(categoryId);
      if (blockCount > 0) {
        alert(`Cannot delete category: ${blockCount} block(s) are using this category`);
        return;
      }

      if (!confirm('Are you sure you want to delete this category?')) return;

      await api.categories.delete(categoryId);
      dispatch(deleteCategory(categoryId));
    } catch (error) {
      reportError(error, 'Failed to delete category.');
    }
  };

  const handleSignOut = async () => {
    try {
      await api.session.logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
    onSignOut();
  };

  function BlockWrapper({ event: block, children }: BlockWrapperProps) {
    // Don't show context menu for synthetic hour total events (negative IDs)
    if (block.id < 0) {
      return <div style={{ height: '100%' }}>{children}</div>;
    }

    // Calculate if block is small (15 minutes or less)
    const durationMs = block.end.getTime() - block.start.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    const isSmallBlock = durationMinutes <= 15;

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({
        blockId: block.id,
        categoryId: block.categoryId,
        x: e.clientX,
        y: e.clientY,
      });
    };

    // Clone children and add className if it's a React element
    const childrenWithClass = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          className: isSmallBlock ? 'small-block' : '',
        });
      }
      return child;
    });

    return (
      <div onContextMenu={handleContextMenu} style={{ height: '100%' }}>
        {childrenWithClass}
      </div>
    );
  }

  function CustomBlockEvent({ event: block }: { event: CalendarBlock }) {
    // For synthetic hour total events, just display the title without edit button
    if (block.id < 0) {
      return <div style={{ width: '100%', padding: '2px' }}>{block.title}</div>;
    }

    const isEditing = editingBlockId === block.id;

    // Format time range as "start time - duration"
    const startTime = format(block.start, 'h:mm a');
    const durationMs = block.end.getTime() - block.start.getTime();
    const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
    const timeRange = `${startTime} - ${durationHours}h`;

    // Hide time label for blocks 15 minutes or shorter
    const durationMinutes = durationMs / (1000 * 60);
    const showTimeLabel = durationMinutes > 15;

    const handleEditClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingBlockId(block.id);
      setEditingTitle(block.title);
    };

    const handleSave = async () => {
      const finalTitle = editingTitle.trim() !== '' ? editingTitle.trim() : 'Untitled';
      setEditingBlockId(null);
      setEditingTitle('');

      // Show the new title straight away, then persist it.
      setBlocks((current) =>
        current.map((b) => (b.id === block.id ? { ...b, title: finalTitle } : b))
      );

      try {
        await api.blocks.updateTitle(block.id, finalTitle);
      } catch (error) {
        reportError(error, 'Failed to save block title.');
      }
      reload();
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
        <div style={{ width: '100%', padding: showTimeLabel ? '0' : '2px' }}>
          {showTimeLabel && (
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              {timeRange}
            </div>
          )}
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
        </div>
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
        <div style={{ paddingRight: '24px', paddingTop: showTimeLabel ? '2px' : '0' }}>
          {showTimeLabel && (
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
              {timeRange}
            </div>
          )}
          <div>{block.title}</div>
        </div>
      </div>
    );
  }

  const handleSelectSlot = async (slotInfo: SlotInfo) => {
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

    try {
      await api.blocks.add(newBlock);
    } catch (error) {
      reportError(error, 'Failed to create block.');
      return;
    }

    // Show it and enter edit mode without waiting for the round trip back.
    setBlocks((current) => [...current, newBlock]);
    setEditingBlockId(newBlock.id);
    setEditingTitle('');
    reload();
  };

  const handleSelectBlock = (block: CalendarBlock, e: React.SyntheticEvent) => {
    console.log('Block selected:', block, 'button:', (e.nativeEvent as MouseEvent).button);
  };

  const moveBlock = async (block: CalendarBlock, start: string | Date, end: string | Date) => {
    // Prevent moving synthetic hour total events
    if (block.id < 0) return;

    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;

    // Applied locally first so the block does not snap back while the server
    // round trip is in flight.
    setBlocks((current) =>
      current.map((b) => (b.id === block.id ? { ...b, start: startDate, end: endDate } : b))
    );

    try {
      await api.blocks.updateTime(block.id, startDate, endDate);
    } catch (error) {
      reportError(error, 'Failed to move block.');
    }
    reload();
  };

  const handleBlockDrop = ({ event, start, end }: { event: CalendarBlock; start: string | Date; end: string | Date }) =>
    moveBlock(event, start, end);

  const handleBlockResize = ({ event, start, end }: { event: CalendarBlock; start: string | Date; end: string | Date }) =>
    moveBlock(event, start, end);

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

        <span style={{ fontSize: '12px', color: '#999', minWidth: '60px' }}>
          {loading ? 'Loading...' : ''}
        </span>

        <button
          onClick={handleSignOut}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Sign out
        </button>
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
            views={{ month: true, week: true, work_week: true, day: true, two_day: TwoDayView, agenda: true } as any}
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
            messages={{ two_day: '2 Day' } as any}
            formats={{
              eventTimeRangeFormat: () => '',
            }}
            components={{
              eventWrapper: BlockWrapper,
              event: CustomBlockEvent,
            }}
            style={{ height: '100%' }}
          />
        </div>
      </div>

      {/* Right-click menu on a block */}
      {contextMenu && (
        <BlockContextMenu
          target={contextMenu}
          categories={categories}
          onDelete={handleDeleteBlock}
          onSelectCategory={handleSetBlockCategory}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Upcoming block / gap warning */}
      {notification && (
        <NotificationModal
          block={notification.block}
          isWarning={notification.isWarning}
          onClose={() => {
            dismissedNotification.current = notification.key;
            setNotification(null);
          }}
        />
      )}

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

/**
 * Gates the app behind the shared password. Any request that comes back
 * unauthorized (an expired cookie, or the server restarting with a new
 * password) drops straight back to the login screen.
 */
function Root() {
  const [status, setStatus] = useState<'checking' | 'in' | 'out'>('checking');

  useEffect(() => {
    onUnauthorized(() => setStatus('out'));
    api.session
      .status()
      .then((authenticated) => setStatus(authenticated ? 'in' : 'out'))
      .catch(() => setStatus('out'));
  }, []);

  if (status === 'checking') {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}>
        Loading...
      </div>
    );
  }

  if (status === 'out') {
    return <LoginScreen onSignedIn={() => setStatus('in')} />;
  }

  return <App onSignOut={() => setStatus('out')} />;
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Provider store={store}>
    <Root />
  </Provider>
);
