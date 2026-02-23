import sqlite3 from 'sqlite3';
import path from 'path';

let db: sqlite3.Database | null = null;

export async function initializeDatabase(): Promise<sqlite3.Database> {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'data', 'cctv.db');
  const dataDir = path.dirname(dbPath);

  // Ensure data directory exists
  await import('fs').then(fs => fs.promises.mkdir(dataDir, { recursive: true }));

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Create cameras table if it doesn't exist
      db!.run(`
        CREATE TABLE IF NOT EXISTS cameras (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          rtspUrl TEXT,
          status TEXT NOT NULL DEFAULT 'offline',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db!);
        }
      });
    });
  });
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    return new Promise((resolve, reject) => {
      db!.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    db = null;
  }
}
