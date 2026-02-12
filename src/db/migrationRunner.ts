import { migrations } from './migrations';
import { createBackup, restoreFromBackup } from './backup';
import type { Database } from 'node-sqlite3-wasm';

export interface MigrationResult {
  success: boolean;
  currentVersion: number;
  targetVersion: number;
  migrationsRun: number[];
  error?: Error;
  backupPath?: string;
}

export function runMigrations(db: Database, dbPath: string): MigrationResult {
  console.log('=== Starting Migration Process ===');

  const currentVersion = getCurrentSchemaVersion(db);
  const targetVersion = migrations.length;

  console.log(`Current schema version: ${currentVersion}`);
  console.log(`Target schema version: ${targetVersion}`);

  // No migrations needed
  if (currentVersion >= targetVersion) {
    console.log('Schema is up to date. No migrations needed.');
    return {
      success: true,
      currentVersion,
      targetVersion,
      migrationsRun: [],
    };
  }

  // Create backup before migrating
  console.log('Creating backup before migrations...');
  const backupResult = createBackup(dbPath, targetVersion);

  if (!backupResult.success && dbPath !== ':memory:') {
    return {
      success: false,
      currentVersion,
      targetVersion,
      migrationsRun: [],
      error: new Error('Failed to create backup before migrations'),
    };
  }

  // Run migrations in transaction
  const migrationsRun: number[] = [];
  let migrationError: Error | undefined;

  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    // Create schema_version table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL,
        description TEXT NOT NULL
      )
    `);

    // Run pending migrations
    for (let i = currentVersion; i < targetVersion; i++) {
      const migration = migrations[i];
      console.log(`Running migration ${migration.version}: ${migration.description}`);

      try {
        migration.up(db);

        // Record migration in schema_version table
        db.run(
          'INSERT INTO schema_version (version, applied_at, description) VALUES (?, ?, ?)',
          [migration.version, new Date().toISOString(), migration.description]
        );

        migrationsRun.push(migration.version);
        console.log(`✓ Migration ${migration.version} completed successfully`);
      } catch (error) {
        migrationError = error as Error;
        console.error(`✗ Migration ${migration.version} failed:`, error);
        throw error; // Re-throw to trigger rollback
      }
    }

    // Commit transaction
    db.exec('COMMIT');
    console.log('=== All migrations completed successfully ===');

    return {
      success: true,
      currentVersion: targetVersion,
      targetVersion,
      migrationsRun,
      backupPath: backupResult.backupPath,
    };

  } catch (error) {
    // Rollback transaction
    try {
      db.exec('ROLLBACK');
      console.log('Transaction rolled back');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    // Restore from backup
    if (backupResult.backupPath && dbPath !== ':memory:') {
      console.log('Attempting to restore database from backup...');
      const restored = restoreFromBackup(backupResult.backupPath, dbPath);

      if (restored) {
        console.log('✓ Database successfully restored from backup');
      } else {
        console.error('✗ Failed to restore database from backup');
      }
    }

    console.error('=== Migration process failed ===');
    return {
      success: false,
      currentVersion,
      targetVersion,
      migrationsRun,
      error: migrationError || (error as Error),
      backupPath: backupResult.backupPath,
    };
  }
}

function getCurrentSchemaVersion(db: Database): number {
  // Check if schema_version table exists
  const tables = db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
  );

  if (tables.length === 0) {
    // No version table means either brand new DB or pre-migration DB
    // Check if categories table exists to distinguish
    const categoriesExists = db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
    );

    if (categoriesExists.length === 0) {
      return 0; // Brand new database
    } else {
      // Pre-migration database with ad-hoc migrations already applied
      // Check if category_id column exists to determine version
      const columns = db.all("PRAGMA table_info(blocks)");
      const hasCategoryId = columns.some((col) => col.name === 'category_id');
      return hasCategoryId ? 2 : 1;
    }
  }

  // Get latest version from schema_version table
  const result = db.all('SELECT MAX(version) as version FROM schema_version');
  return (result[0]?.version as number) ?? 0;
}
