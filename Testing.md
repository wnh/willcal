# WillCal Testing Checklist

## Block Creation
- [ ] Click on an empty time slot to create a new block
- [ ] Verify new block immediately enters edit mode with an empty input field
- [ ] Type a title (e.g., "Team Meeting") and press Enter to save
- [ ] Verify block is created with the entered title
- [ ] Click and drag to create a block spanning multiple time slots
- [ ] Verify new block enters edit mode automatically
- [ ] Enter a title and save, verify block is saved to database (persists after restart)
- [ ] Create a new block, then press Escape without entering a title
- [ ] Verify the block is deleted (canceled creation)
- [ ] Create a new block, leave the title empty, and press Enter
- [ ] Verify the block is saved with title "Untitled"

## Block Deletion
- [ ] Right-click on a block to open context menu
- [ ] Click "Delete" option in context menu
- [ ] Verify block is removed from calendar
- [ ] Verify block is deleted from database (stays deleted after restart)

## Block Editing (Inline Title Editing)
- [ ] Hover over a block and verify a pencil emoji (✏️) button appears
- [ ] Click the pencil button to enter edit mode
- [ ] Verify title text becomes an editable input field
- [ ] Type a new title (e.g., "Meeting with Team")
- [ ] Press Enter to save the changes
- [ ] Verify the title updates on the calendar
- [ ] Verify the new title is saved to database (persists after restart)
- [ ] Click the pencil button on another block to edit
- [ ] Press Escape to cancel editing without saving
- [ ] Verify the original title remains unchanged
- [ ] Click a block's pencil button, change the title, then click outside the input
- [ ] Verify the title saves automatically on blur

## Block Movement (Drag & Drop)
- [ ] Click and drag a block to a different time slot
- [ ] Verify block moves to new position
- [ ] Verify new time is saved to database (persists after restart)
- [ ] Drag block to different day in week view

## Block Resizing
- [ ] Hover over top edge of block to see resize handle
- [ ] Drag top edge to change start time
- [ ] Hover over bottom edge of block to see resize handle
- [ ] Drag bottom edge to change end time
- [ ] Verify resized times are saved to database (persists after restart)

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
- [ ] Leave name empty and verify "Create" button is disabled
- [ ] Enter name "Work" and select a blue color
- [ ] Click "Create"
- [ ] Verify category appears in sidebar with blue background
- [ ] Verify dialog closes
- [ ] Restart app and verify "Work" category persists

### Category Editing
- [ ] Click edit button (✏️) on "Work" category
- [ ] Verify "Edit Category" dialog appears
- [ ] Verify name field shows "Work"
- [ ] Verify current color is selected (blue border)
- [ ] Change name to "Work Projects"
- [ ] Change color to green pastel
- [ ] Click "Save"
- [ ] Verify category name and color update in sidebar
- [ ] Create a block assigned to "Work Projects"
- [ ] Edit the category color again to pink
- [ ] Verify the block's background color changes to pink
- [ ] Verify changes persist after restart

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
- [ ] Verify order changes to: C, General, A, B
- [ ] Restart app and verify order persists
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
- [ ] Verify "Category" submenu appears
- [ ] Verify all categories are listed with checkmarks
- [ ] Verify current category has a checkmark
- [ ] Select a different category from the menu
- [ ] Verify block color changes immediately
- [ ] Verify change persists after restart

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
- [ ] Restart app
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
- [ ] Create several blocks and close the application
- [ ] Restart the application
- [ ] Verify all blocks are still present
- [ ] Default database location: `$XDG_DATA_HOME/willcal/willcal.db` or `~/.local/share/willcal/willcal.db`

## Command-Line Arguments
- [ ] Run with `--db=:memory:` to use in-memory database
- [ ] Verify blocks don't persist after restart with in-memory DB
- [ ] Run with `--db=/custom/path/test.db` to use custom database location
- [ ] Verify blocks are saved to custom location

## Category Hours Display in Week View
- [ ] Switch to week view or work_week view
- [ ] Create multiple blocks with different categories on Monday
  - [ ] Create a 2-hour block assigned to "Work" category (e.g., 9:00 AM - 11:00 AM)
  - [ ] Create a 1.5-hour block assigned to "Personal" category (e.g., 1:00 PM - 2:30 PM)
  - [ ] Create a 3-hour block assigned to "Work" category (e.g., 3:00 PM - 6:00 PM)
- [ ] Verify the day header for Monday displays category hour totals:
  - [ ] Should show "Work: 5.0h" badge with Work category's color
  - [ ] Should show "Personal: 1.5h" badge with Personal category's color
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

## Console Logging (Development)
- [ ] Open DevTools console
- [ ] Create a block - verify SQL INSERT is logged
- [ ] Delete a block - verify SQL DELETE is logged
- [ ] Move a block - verify SQL UPDATE is logged
- [ ] Navigate calendar - verify SQL SELECT is logged with date range parameters
- [ ] Verify Redux actions are logged (SET_DATE_RANGE)

## Database Migrations

### New Database (First Time)
- [ ] Delete existing database: `rm ~/.local/share/willcal/willcal.db`
- [ ] Start app: `npm run start`
- [ ] Verify console shows "Running migration 1: Create categories table with default General category"
- [ ] Verify console shows "Running migration 2: Add category_id column to blocks table"
- [ ] Verify console shows "=== All migrations completed successfully ==="
- [ ] Check database has `schema_version` table with migrations recorded
- [ ] Verify no backup created (new DB, nothing to backup)
- [ ] Verify "General" category exists in sidebar
- [ ] Create a block and verify it's assigned to "General" category

### Existing Database (Up to Date)
- [ ] Start app with existing v2 database (pre-migration system)
- [ ] Verify console shows "Current schema version: 2"
- [ ] Verify console shows "Schema is up to date. No migrations needed."
- [ ] Verify no backup created
- [ ] Verify all existing blocks and categories are present
- [ ] Verify app functions normally

### Future Migration (v3+)
- [ ] When new migration is added to codebase, start app
- [ ] Verify backup created: `~/.local/share/willcal/backups/willcal.db.backup.YYYYMMDD_HHMMSS.before_v3`
- [ ] Verify new migration runs successfully
- [ ] Verify console shows "✓ Migration 3 completed successfully"
- [ ] Check `schema_version` table updated with new version
- [ ] Query: `SELECT * FROM schema_version` should show versions 1, 2, and 3
- [ ] Create 6+ migrations over time and verify old backups are deleted (keeps last 5)

### Migration Failure Recovery
- [ ] SETUP: Edit a migration file to throw an error (e.g., add `throw new Error('Test failure');` in migration up())
- [ ] Start application
- [ ] Verify error alert appears with message "Database migration failed!"
- [ ] Verify console shows "✗ Migration X failed:"
- [ ] Verify console shows "Transaction rolled back"
- [ ] Verify console shows "✓ Database successfully restored from backup"
- [ ] Verify database file restored to pre-migration state
- [ ] Verify application shows data from before failed migration
- [ ] CLEANUP: Restore original migration file and restart successfully
- [ ] Verify app now starts normally with migrations applied

### In-Memory Database
- [ ] Start app with in-memory database: `npm run dev` (uses --db=:memory:)
- [ ] Verify console shows migrations running
- [ ] Verify console shows "Skipping backup for in-memory database"
- [ ] Verify no backups directory created
- [ ] Create blocks and categories
- [ ] Restart app - verify data is NOT persisted (fresh state every restart)

### Backup Retention Policy
- [ ] Ensure you have an existing v2 database
- [ ] Create 6 fake future migrations (003 through 008)
- [ ] Start app and let each migration run (might need to restart 6 times if testing incrementally)
- [ ] Check `~/.local/share/willcal/backups/` directory
- [ ] Verify only 5 most recent backup files are kept
- [ ] Verify oldest backups were automatically deleted
- [ ] Verify backup filenames follow format: `willcal.db.backup.YYYYMMDD_HHMMSS.before_vX`
