# WillCal Testing Checklist

## Block Creation
- [ ] Click on an empty time slot to create a new block
- [ ] Verify new block immediately enters edit mode with an empty input field
- [ ] Verify the time range is displayed above the input field in format "9:00 AM - 1.00h" (start time - duration)
- [ ] Type a title (e.g., "Team Meeting") and press Enter to save
- [ ] Verify block is created with the entered title
- [ ] Verify the time range is displayed above the title in a smaller, gray font
- [ ] Click and drag to create a block spanning multiple time slots (e.g., 2.5 hours)
- [ ] Verify new block enters edit mode automatically
- [ ] Verify duration is displayed correctly (e.g., "9:00 AM - 2.50h")
- [ ] Enter a title and save, verify block is saved to database (persists after reloading the page)
- [ ] Create a new block, then press Escape without entering a title
- [ ] Verify the block is deleted (canceled creation)
- [ ] Create a new block, leave the title empty, and press Enter
- [ ] Verify the block is saved with title "Untitled"

## Block Deletion
- [ ] Right-click on a block to open context menu
- [ ] Click "Delete" option in context menu
- [ ] Verify block is removed from calendar
- [ ] Verify block is deleted from database (stays deleted after reloading the page)

## Right-Click Context Menu

The native desktop menu is replaced by an in-page menu, so it needs its own
dismissal and positioning checks.

- [ ] Right-click a block and verify the app's own menu appears (not the browser's menu)
- [ ] Verify the menu appears at the cursor, with "Delete", a separator, then the category list
- [ ] Right-click a block near the right edge of the window
- [ ] Verify the menu stays fully on screen instead of being clipped
- [ ] Right-click a block near the bottom of the window and verify the same
- [ ] Open the menu, then click somewhere else on the page, and verify it closes
- [ ] Open the menu, then press Escape, and verify it closes
- [ ] Open the menu, then scroll the calendar, and verify it closes
- [ ] Open the menu, then right-click a *different* block, and verify the menu moves to that block
- [ ] Hover over menu items and verify they highlight
- [ ] Right-click a category hour total (the all-day "Total: 3.00h" row)
- [ ] Verify no menu appears for synthetic total events

## Block Editing (Inline Title Editing)
- [ ] Hover over a block and verify a pencil emoji (✏️) button appears
- [ ] Click the pencil button to enter edit mode
- [ ] Verify title text becomes an editable input field
- [ ] Type a new title (e.g., "Meeting with Team")
- [ ] Press Enter to save the changes
- [ ] Verify the title updates on the calendar
- [ ] Verify the new title is saved to database (persists after reloading the page)
- [ ] Click the pencil button on another block to edit
- [ ] Press Escape to cancel editing without saving
- [ ] Verify the original title remains unchanged
- [ ] Click a block's pencil button, change the title, then click outside the input
- [ ] Verify the title saves automatically on blur

## Block Movement (Drag & Drop)
- [ ] Click and drag a block to a different time slot
- [ ] Verify block moves to new position
- [ ] Verify new time is saved to database (persists after reloading the page)
- [ ] Drag block to different day in week view

## Block Resizing
- [ ] Verify resize handles are not visible by default (when not hovering)
- [ ] Hover over the middle of a block - verify resize handles do NOT appear
- [ ] Hover over the top edge of a block (within 10px from top)
- [ ] Verify a gray colored bar appears at the top edge (10px height, full width)
- [ ] Hover over the bottom edge of a block (within 10px from bottom)
- [ ] Verify a gray colored bar appears at the bottom edge (10px height, full width)
- [ ] Hover over block again and drag top edge to change start time
- [ ] Hover over block and drag bottom edge to change end time
- [ ] Hover over the top edge and drag to change start time
- [ ] Move mouse away from the edges - verify resize handles disappear
- [ ] Verify the resize handles don't overlap the block text (12px padding top/bottom)
- [ ] Hover over the bottom edge and drag to change end time
- [ ] Hover over the top edge and drag to change start time
- [ ] Move mouse away from block - verify resize handles disappear
- [ ] Move mouse away from the edges - verify resize handles disappear
- [ ] Verify the resize handles don't overlap the block text (12px padding top/bottom)
- [ ] Verify resized times are saved to database (persists after reloading the page)
- [ ] Verify resize handles are easier to grab with the larger 10px height
- [ ] Verify the colored bar style is cleaner than the previous line style
- [ ] Resize a block down to 15 minutes - verify the time/duration label is still visible
- [ ] Resize the block down to exactly 15 minutes or less - verify the time/duration label disappears
- [ ] Verify the top and bottom padding is removed for small blocks (15 min or less)
- [ ] Resize the block back up to more than 15 minutes - verify the time/duration label reappears
- [ ] Verify the top and bottom padding (12px) is restored for larger blocks

## Calendar Navigation
- [ ] Navigate between weeks using calendar controls
- [ ] Verify only blocks in visible date range are loaded
- [ ] Switch to month view
- [ ] Switch to work week view
- [ ] Switch to agenda view
- [ ] Return to week view

## Work Hours Toggle
- [ ] Verify the "Work hours only (6:00 AM - 6:00 PM)" checkbox appears at the top
- [ ] Checkbox should be checked by default
- [ ] Verify calendar displays only 6:00 AM to 6:00 PM time range
- [ ] Uncheck the "Work hours only" checkbox
- [ ] Verify calendar expands to show full 24-hour day (12:00 AM to 11:00 PM)
- [ ] Check the checkbox again
- [ ] Verify calendar returns to 6:00 AM - 6:00 PM range
- [ ] Create blocks during work hours, toggle checkbox, verify blocks still display correctly

## Category Management

### Category Sidebar
- [ ] Verify sidebar appears on the left with "Categories" header
- [ ] Verify "General" category exists by default (gray color #E5E5E5)
- [ ] Verify "+" button appears in sidebar header
- [ ] Verify each category shows its name and colored background
- [ ] Verify edit button (✏️) and delete button (🗑️) appear on each category

### Category Creation
- [ ] Click "+" button in sidebar
- [ ] Verify "New Category" dialog appears with backdrop
- [ ] Verify name input field is autofocused
- [ ] Verify 16 pastel color grid appears (8 columns × 2 rows)
- [ ] Click on different colors and verify blue border indicates selection
- [ ] Verify "Include in daily totals" checkbox is present and checked by default
- [ ] Leave name empty and verify "Create" button is disabled
- [ ] Enter name "Work" and select a blue color
- [ ] Click "Create"
- [ ] Verify category appears in sidebar with blue background
- [ ] Verify dialog closes
- [ ] Reload the page and verify "Work" category persists

### Category Editing
- [ ] Click edit button (✏️) on "Work" category
- [ ] Verify "Edit Category" dialog appears
- [ ] Verify name field shows "Work"
- [ ] Verify current color is selected (blue border)
- [ ] Verify "Include in daily totals" checkbox reflects current setting
- [ ] Change name to "Work Projects"
- [ ] Change color to green pastel
- [ ] Click "Save"
- [ ] Verify category name and color update in sidebar
- [ ] Create a block assigned to "Work Projects"
- [ ] Edit the category color again to pink
- [ ] Verify the block's background color changes to pink
- [ ] Verify changes persist after reloading the page

### Category Deletion
- [ ] Create a new category "Temporary"
- [ ] Verify it appears in sidebar
- [ ] Click delete button (🗑️) on "Temporary"
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify category is removed from sidebar
- [ ] Create a block and assign it to "Work Projects"
- [ ] Try to delete "Work Projects" category
- [ ] Verify error message: "Cannot delete category: 1 block(s) are using this category"
- [ ] Delete the block
- [ ] Now delete "Work Projects" - should succeed
- [ ] Try to delete the last remaining category
- [ ] Verify error: "Cannot delete the last category. You must have at least one category."

### Category Reordering (Drag & Drop)
- [ ] Create 3 categories: "A", "B", "C"
- [ ] Verify they appear in sidebar in order: General, A, B, C
- [ ] Drag category "C" to the top position
- [ ] Verify the list reorders live while dragging
- [ ] Verify order changes to: C, General, A, B when you drop
- [ ] Verify the server terminal logs the sort_order UPDATEs only once, on drop, not on every dragover
- [ ] Reload the page and verify order persists
- [ ] Create a new block
- [ ] Verify it's assigned to "C" (first category in list)
- [ ] Drag "General" back to top position
- [ ] Create another new block
- [ ] Verify it's assigned to "General" (now first in list)

### Block Category Assignment
- [ ] Create a new block (click or drag on calendar)
- [ ] Verify block automatically enters edit mode
- [ ] Enter a title and save
- [ ] Verify block has the color of the first category in sidebar
- [ ] Right-click on the block
- [ ] Verify all categories are listed below the Delete item, each with its color swatch
- [ ] Verify the block's current category has a checkmark
- [ ] Select a different category from the menu
- [ ] Verify block color changes immediately
- [ ] Verify change persists after reloading the page

### Category Colors on Calendar
- [ ] Create multiple categories with different pastel colors
- [ ] Create blocks assigned to each category
- [ ] Verify each block displays with its category's background color
- [ ] Verify block titles are readable on pastel backgrounds
- [ ] Switch to month view and verify colors display correctly
- [ ] Switch to week view and verify colors display correctly
- [ ] Switch to agenda view and verify colors display correctly

### Sidebar Toggle
- [ ] Click "☰ Hide Categories" button in header
- [ ] Verify sidebar disappears
- [ ] Verify calendar expands to full width
- [ ] Verify button text changes to "☰ Show Categories"
- [ ] Click "☰ Show Categories"
- [ ] Verify sidebar reappears
- [ ] Verify calendar shrinks to make room for sidebar
- [ ] Reload the page
- [ ] Verify sidebar is visible by default (collapsed state does not persist)

### Duplicate Category Names
- [ ] Create a category named "Test"
- [ ] Try to create another category also named "Test"
- [ ] Verify error message: "A category named 'Test' already exists. Please choose a different name."
- [ ] Verify dialog remains open
- [ ] Change name to "Test 2" and save
- [ ] Verify new category is created successfully

### Category Migration (First-Time Users)
- [ ] Use a fresh database (or delete existing one)
- [ ] Launch app for first time
- [ ] Verify "General" category is created automatically
- [ ] Verify any existing blocks are assigned to "General"
- [ ] Verify database has both `blocks` and `categories` tables
- [ ] Verify `blocks` table has `category_id` column

## Database Persistence
- [ ] Create several blocks, then reload the browser tab
- [ ] Verify all blocks are still present
- [ ] Restart the server and reload the page
- [ ] Verify all blocks are still present
- [ ] Open the app in a second browser tab, create a block there, reload the first tab
- [ ] Verify the block created in the second tab appears (the database is the single source of truth)
- [ ] Default database location: `$XDG_DATA_HOME/willcal/willcal.db` or `~/.local/share/willcal/willcal.db`

## Command-Line Arguments
- [ ] Run with `--db=:memory:` to use in-memory database
- [ ] Verify blocks don't persist after restarting the server with in-memory DB
- [ ] Run with `--db=/custom/path/test.db` to use custom database location
- [ ] Verify blocks are saved to custom location
- [ ] Verify `WILLCAL_DB` sets the same path, and that `--db=` wins when both are set
- [ ] Run with `--port=9001` and verify it overrides the default port

## Category Hours Display in Week View
- [ ] Switch to week view or work_week view
- [ ] Create multiple blocks with different categories on Monday
  - [ ] Create a 2-hour block assigned to "Work" category (e.g., 9:00 AM - 11:00 AM)
  - [ ] Create a 1.5-hour block assigned to "Personal" category (e.g., 1:00 PM - 2:30 PM)
  - [ ] Create a 3-hour block assigned to "Work" category (e.g., 3:00 PM - 6:00 PM)
- [ ] Verify the day header for Monday displays category hour totals:
  - [ ] Should show "Work: 5.0h" badge with Work category's color
  - [ ] Should show "Personal: 1.5h" badge with Personal category's color
  - [ ] Should show "Total: 6.5h" badge
  - [ ] Badges should be displayed horizontally with small gaps between them
- [ ] Create blocks on Tuesday with a single category
  - [ ] Create two 1-hour blocks assigned to "Work"
  - [ ] Verify Tuesday's header shows "Work: 2.0h"
- [ ] Verify a day with no blocks shows no category badges
- [ ] Create a block that spans from Monday 11:00 PM to Tuesday 1:00 AM
  - [ ] Verify Monday's header counts 1.0h for that block
  - [ ] Verify Tuesday's header counts 1.0h for that block
- [ ] Switch to month view - verify no category hour totals are shown (only in week views)
- [ ] Switch back to week view - verify totals reappear
- [ ] Move a block from Monday to Wednesday via drag & drop
- [ ] Verify Monday's totals update (decrease)
- [ ] Verify Wednesday's totals update (increase)
- [ ] Change a block's category via right-click menu
- [ ] Verify the day's category hour totals update immediately

### Include in Totals Feature
- [ ] Create a new category "Break" with a color
- [ ] Leave "Include in daily totals" checked
- [ ] Create a 1-hour block on Monday assigned to "Break"
- [ ] Verify Monday's totals include "Break: 1.0h"
- [ ] Verify the Total includes the Break hour
- [ ] Edit "Break" category and uncheck "Include in daily totals"
- [ ] Click "Save"
- [ ] Verify "Break: 1.0h" badge disappears from Monday's header
- [ ] Verify Total decreases by 1.0h (excluding Break time)
- [ ] Verify the Break block is still visible on the calendar
- [ ] Edit "Break" category and re-check "Include in daily totals"
- [ ] Verify "Break: 1.0h" badge reappears
- [ ] Verify Total increases again
- [ ] Create multiple categories, some with includeInTotals=true and some false
- [ ] Create blocks for each category
- [ ] Verify only categories with includeInTotals=true appear in daily totals
- [ ] Reload the page and verify settings persist

## Console Logging (Development)

SQL now runs on the server, so SQL logs appear in the terminal running the
server. Redux and request logs stay in the browser console.

In the **server terminal**:
- [ ] Create a block - verify SQL INSERT is logged
- [ ] Delete a block - verify SQL DELETE is logged
- [ ] Move a block - verify SQL UPDATE is logged
- [ ] Navigate calendar - verify SQL SELECT is logged with date range parameters

In the **browser DevTools console**:
- [ ] Verify Redux actions are logged (SET_DATE_RANGE)
- [ ] Open the Network tab and verify every action is a POST to `/rpc` (no other API paths)
- [ ] Verify each request body is JSON-RPC shaped: `{"jsonrpc":"2.0","id":N,"method":"...","params":{...}}`
- [ ] Verify no request contains the password after sign-in
- [ ] Verify no uncaught exceptions appear during normal use

## Database Migrations

### New Database (First Time)
- [ ] Delete existing database: `rm ~/.local/share/willcal/willcal.db`
- [ ] Start the server: `WILLCAL_PASSWORD=secret npm start`
- [ ] Verify server output shows "Running migration 1: Create categories table with default General category"
- [ ] Verify server output shows "Running migration 2: Add category_id column to blocks table"
- [ ] Verify server output shows "=== All migrations completed successfully ==="
- [ ] Check database has `schema_version` table with migrations recorded
- [ ] Verify no backup created (new DB, nothing to backup)
- [ ] Verify "General" category exists in sidebar
- [ ] Create a block and verify it's assigned to "General" category

### Existing Database (Up to Date)
- [ ] Start the server with an existing v3 database (current version)
- [ ] Verify server output shows "Current schema version: 3"
- [ ] Verify server output shows "Schema is up to date. No migrations needed."
- [ ] Verify no backup created
- [ ] Verify all existing blocks and categories are present
- [ ] Verify the app functions normally in the browser

### Migration to v3 (include_in_totals)
- [ ] Start the server with an existing v2 database (before include_in_totals feature)
- [ ] Verify server output shows "Current schema version: 2"
- [ ] Verify server output shows "Running migration 3: Add include_in_totals column to categories table"
- [ ] Verify backup created: `~/.local/share/willcal/backups/willcal.db.backup.YYYYMMDD_HHMMSS.before_v3`
- [ ] Verify server output shows "✓ Migration 3 completed successfully"
- [ ] Verify server output shows "=== All migrations completed successfully ==="
- [ ] Open all existing categories in edit dialog
- [ ] Verify "Include in daily totals" checkbox is checked (default for existing categories)
- [ ] Verify daily totals continue to work as before migration
- [ ] Query database: `SELECT * FROM schema_version` should show versions 1, 2, and 3

### Future Migration (v4+)
- [ ] When a new migration is added to the codebase, start the server
- [ ] Verify backup created with appropriate version number
- [ ] Verify new migration runs successfully
- [ ] Check `schema_version` table updated with new version
- [ ] Create 6+ migrations over time and verify old backups are deleted (keeps last 5)

### Migration Failure Recovery
- [ ] SETUP: Edit a migration file to throw an error (e.g., add `throw new Error('Test failure');` in migration up())
- [ ] Start the server
- [ ] Verify the server exits instead of listening, rather than serving a half-migrated schema
- [ ] Verify server output shows "✗ Migration X failed:"
- [ ] Verify server output shows "Transaction rolled back"
- [ ] Verify server output shows "✓ Database successfully restored from backup"
- [ ] Verify database file restored to pre-migration state
- [ ] CLEANUP: Restore original migration file, rebuild, and start successfully
- [ ] Verify the server now starts normally with migrations applied and shows data from before the failed migration

### In-Memory Database
- [ ] Start the server with an in-memory database: `npm run dev` (uses --db=:memory:)
- [ ] Verify server output shows migrations running
- [ ] Verify server output shows "Skipping backup for in-memory database"
- [ ] Verify no backups directory created
- [ ] Create blocks and categories
- [ ] Restart the server - verify data is NOT persisted (fresh state every restart)

### Backup Retention Policy
- [ ] Ensure you have an existing v2 database
- [ ] Create 6 fake future migrations (003 through 008)
- [ ] Start the server and let each migration run (might need to restart 6 times if testing incrementally)
- [ ] Check `~/.local/share/willcal/backups/` directory
- [ ] Verify only 5 most recent backup files are kept
- [ ] Verify oldest backups were automatically deleted
- [ ] Verify backup filenames follow format: `willcal.db.backup.YYYYMMDD_HHMMSS.before_vX`

## Left Border Styling

### Category Boxes (Sidebar)
- [ ] Open the sidebar (if collapsed, click "☰ Show Categories")
- [ ] Verify each category box has:
  - [ ] A light gray background (`#f5f5f5`)
  - [ ] A thick colored border on the left side only (4px width)
  - [ ] The left border color matches the category's color
  - [ ] Dark text color (`#333`) instead of white
  - [ ] No colored background fill (only the left border is colored)
- [ ] Create a new category with a bright color (e.g., red)
- [ ] Verify the category box has a red left border with gray background
- [ ] Edit a category to change its color
- [ ] Verify the left border color updates immediately

### Calendar Blocks
- [ ] Create a block and assign it to a category
- [ ] Verify the block has:
  - [ ] A light gray background (`#f5f5f5`)
  - [ ] Black text color that is clearly readable
  - [ ] A thick colored border on the left side only (4px width)
  - [ ] The left border color matches the block's category color
  - [ ] A thin border on all sides (`1px solid #ddd`) for definition
- [ ] Create blocks with different categories
- [ ] Verify each block's left border matches its category color
- [ ] Verify text is black and readable on all blocks
- [ ] Change a block's category via right-click menu
- [ ] Verify the left border color changes immediately to match the new category
- [ ] Switch between week, work_week, and day views
- [ ] Verify left border styling is consistent across all views
- [ ] Verify thin borders are visible on all blocks in week/work_week views
- [ ] Switch to month view and verify left border styling on month view blocks

### Total Blocks (Synthetic Events)
- [ ] In week or work_week view, create blocks to generate daily totals
- [ ] Verify the "Total: X.Xh" all-day events have:
  - [ ] A white background (`#ffffff`)
  - [ ] A thick gray/dark left border (4px, color `#666`)
  - [ ] A thin border on all sides (`1px solid #ddd`)
  - [ ] Bold text
- [ ] Verify category hour totals (e.g., "Work: 5.0h") also have left borders matching their category colors

## Upcoming Block Notification

The desktop build opened a separate always-on-top window. In the browser this
is an in-page modal, so it only appears while the tab is open.

- [ ] Create a block starting about a minute from now
- [ ] Wait for the 30-second poll and verify a modal appears over the calendar
- [ ] Verify it reads "Next Upcoming Block", shows the block title, and shows the formatted start time
- [ ] Click "Close" and verify the modal disappears
- [ ] Wait through at least two more polls and verify the same notification does not reappear
- [ ] Create a second upcoming block and verify a *new* notification does appear for it
- [ ] Create a block that ends about a minute from now, with nothing scheduled after it
- [ ] Wait for the poll and verify the warning modal appears with a red border and pink background
- [ ] Verify it reads "WARNING: Block Ending With No Follow-Up" and shows "Ends at ..."
- [ ] Add a block immediately after that one, reload, and verify the warning no longer appears
- [ ] Reload the page while a notification would be due and verify it appears immediately on load
- [ ] Stop the server, wait for a poll, and verify no error dialog interrupts the calendar

## Server Startup and Configuration

WillCal now runs as a web server. Every test below assumes you started it with
a password set, then opened `http://127.0.0.1:8080` in a browser.

- [ ] Run `node dist/server/index.js` with no `WILLCAL_PASSWORD` set
- [ ] Verify it prints "Refusing to start an unprotected server" and exits without listening
- [ ] Run `WILLCAL_PASSWORD=secret npm start`
- [ ] Verify it prints the database path, the migration log, and "WillCal listening on http://127.0.0.1:8080"
- [ ] Verify `http://127.0.0.1:8080` loads the login screen in a browser
- [ ] Restart with `PORT=9000` and verify it listens on port 9000 instead
- [ ] Restart with `HOST=0.0.0.0` and verify the app is reachable from another machine on the network
- [ ] Restart with `WILLCAL_DB=/tmp/other.db` and verify it opens that file (check the startup log)

## Authentication

- [ ] Load the app while signed out and verify the login screen appears (no calendar behind it)
- [ ] Enter the wrong password and verify "Incorrect password" appears under the field
- [ ] Verify the password field is a masked input (characters show as dots)
- [ ] Enter the correct password and verify the calendar loads
- [ ] Reload the page and verify you stay signed in (the session cookie persists)
- [ ] Close the browser, reopen it, load the app, and verify you are still signed in
- [ ] Click "Sign out" in the top right and verify you return to the login screen
- [ ] Reload after signing out and verify the login screen still appears
- [ ] Sign in, then restart the server with a *different* `WILLCAL_PASSWORD`
- [ ] Reload the page and verify you are bounced back to the login screen (the old session is invalid)
- [ ] Enter the wrong password more than 10 times in a row
- [ ] Verify further attempts report "Too many failed sign-in attempts", including with the correct password
- [ ] Wait 15 minutes (or restart the server) and verify sign-in works again

### Access Over Plain HTTP From Another Machine

Session cookies are marked `Secure`, so they only stick over HTTPS. Localhost
is exempt (browsers treat it as a secure context), which is why this only
appears once you connect from a different machine.

- [ ] Start with `HOST=0.0.0.0` and *without* `WILLCAL_ALLOW_INSECURE_COOKIE`
- [ ] Verify the server prints a startup warning naming `WILLCAL_ALLOW_INSECURE_COOKIE=1`
- [ ] From another machine, open `http://<server-ip>:8080` and verify the login screen loads
- [ ] Enter the correct password
- [ ] Verify the app does NOT silently return to an empty login form
- [ ] Verify it reports "Signed in, but your browser discarded the session cookie" and names the fix
- [ ] Restart with `WILLCAL_ALLOW_INSECURE_COOKIE=1`
- [ ] Verify the startup warning is gone
- [ ] Sign in from the other machine and verify the calendar loads
- [ ] Reload and verify the session persists
- [ ] Behind an HTTPS reverse proxy, verify sign-in works *without* `WILLCAL_ALLOW_INSECURE_COOKIE`

### Session Expiry During Use
- [ ] Sign in and leave the calendar open
- [ ] Delete the `willcal_session` cookie in DevTools (Application > Cookies)
- [ ] Perform any action (create a block, change a range) and verify the app returns to the login screen
- [ ] Sign back in and verify the calendar reloads with your data intact

## Network Behaviour

- [ ] Sign in, then stop the server
- [ ] Drag a block and verify an error alert appears rather than a silent failure
- [ ] Verify the calendar does not crash or go blank (the console shows the failed request)
- [ ] Restart the server, reload the page, and verify everything works again
- [ ] Navigate quickly between several weeks and verify blocks always match the visible range (no stale results from a slow request)
- [ ] Verify "Loading..." appears briefly in the header while blocks are being fetched
