# WillCal Testing Checklist

## Block Creation
- [ ] Click on an empty time slot to create a new block
- [ ] Click and drag to create a block spanning multiple time slots
- [ ] Verify new block appears with title "New Block"
- [ ] Verify block is saved to database (persists after restart)

## Block Deletion
- [ ] Right-click on a block to open context menu
- [ ] Click "Delete" option in context menu
- [ ] Verify block is removed from calendar
- [ ] Verify block is deleted from database (stays deleted after restart)

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
- [ ] Switch to agenda view
- [ ] Return to week view (default)

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

## Console Logging (Development)
- [ ] Open DevTools console
- [ ] Create a block - verify SQL INSERT is logged
- [ ] Delete a block - verify SQL DELETE is logged
- [ ] Move a block - verify SQL UPDATE is logged
- [ ] Navigate calendar - verify SQL SELECT is logged with date range parameters
- [ ] Verify Redux actions are logged (SET_DATE_RANGE)
