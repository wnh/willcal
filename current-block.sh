#!/bin/bash

# Determine database location
if [ -n "$XDG_DATA_HOME" ]; then
    DB_PATH="$XDG_DATA_HOME/willcal/willcal.db"
else
    DB_PATH="$HOME/.local/share/willcal/willcal.db"
fi

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at $DB_PATH"
    exit 1
fi

# Get current time in ISO format
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Query for current block
sqlite3 "$DB_PATH" <<SQL
.mode list
SELECT
    title || ' [' ||
    printf('%02d', CAST((julianday(end) - julianday('$NOW')) * 24 AS INTEGER)) || ':' ||
    printf('%02d', CAST((julianday(end) - julianday('$NOW')) * 24 * 60 AS INTEGER) % 60) || ']'
FROM blocks
WHERE start <= '$NOW' AND end > '$NOW'
ORDER BY start
LIMIT 1;
SQL

# Check if any block was found
if [ $? -ne 0 ] || [ -z "$(sqlite3 "$DB_PATH" "SELECT id FROM blocks WHERE start <= '$NOW' AND end > '$NOW' LIMIT 1")" ]; then
    echo "No current block"
fi
