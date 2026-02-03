import fs from 'fs';
import path from 'path';

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  error?: Error;
}

export function createBackup(dbPath: string, targetVersion: number): BackupResult {
  // Don't backup in-memory databases
  if (dbPath === ':memory:') {
    console.log('Skipping backup for in-memory database');
    return { success: true };
  }

  // Check if database file exists
  if (!fs.existsSync(dbPath)) {
    console.log('No existing database file to backup');
    return { success: true }; // Nothing to backup
  }

  try {
    const dbDir = path.dirname(dbPath);
    const backupDir = path.join(dbDir, 'backups');

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d+Z$/, '')
      .replace('T', '_')
      .slice(0, 15); // YYYYMMDD_HHMMSS

    const backupFilename = `willcal.db.backup.${timestamp}.before_v${targetVersion}`;
    const backupPath = path.join(backupDir, backupFilename);

    // Copy database file
    fs.copyFileSync(dbPath, backupPath);

    console.log(`✓ Backup created: ${backupPath}`);

    // Clean up old backups (keep only last 5)
    cleanupOldBackups(backupDir, 5);

    return { success: true, backupPath };
  } catch (error) {
    console.error('✗ Backup failed:', error);
    return { success: false, error: error as Error };
  }
}

function cleanupOldBackups(backupDir: string, keepCount: number): void {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('willcal.db.backup.'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        mtime: fs.statSync(path.join(backupDir, f)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Newest first

    // Delete old backups beyond keepCount
    files.slice(keepCount).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`  Deleted old backup: ${file.name}`);
    });
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

export function restoreFromBackup(backupPath: string, dbPath: string): boolean {
  try {
    if (!fs.existsSync(backupPath)) {
      console.error(`✗ Backup file not found: ${backupPath}`);
      return false;
    }

    // Copy backup over current database
    fs.copyFileSync(backupPath, dbPath);
    console.log(`✓ Database restored from backup: ${backupPath}`);
    return true;
  } catch (error) {
    console.error('✗ Restore failed:', error);
    return false;
  }
}
