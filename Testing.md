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
