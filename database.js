import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const projectDirectory = fileURLToPath(new URL(".", import.meta.url));
const defaultDatabasePath = join(projectDirectory, "data", "library.sqlite");

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;

  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    author TEXT NOT NULL CHECK (length(trim(author)) > 0),
    pages INTEGER NOT NULL CHECK (pages > 0),
    current_page INTEGER NOT NULL DEFAULT 0 CHECK (current_page >= 0),
    read_status INTEGER NOT NULL DEFAULT 0 CHECK (read_status IN (0, 1)),
    reading_status TEXT NOT NULL DEFAULT 'Want to read'
      CHECK (reading_status IN ('Want to read', 'Currently reading', 'Finished')),
    cover_url TEXT,
    description TEXT,
    rating INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
    date_added TEXT NOT NULL DEFAULT (date('now')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) STRICT;

  CREATE INDEX IF NOT EXISTS books_user_id_index ON books(user_id);
  CREATE INDEX IF NOT EXISTS books_user_date_added_index
    ON books(user_id, date_added DESC);

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) STRICT;

  CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_index ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS one_time_reset_uses (
    token_hash TEXT PRIMARY KEY,
    used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;

`;

export function openDatabase(databasePath = defaultDatabasePath) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec(schema);

  const bookColumns = database.prepare("PRAGMA table_info(books)").all();
  if (!bookColumns.some(({ name }) => name === "reading_status")) {
    database.exec(`
      ALTER TABLE books ADD COLUMN reading_status TEXT NOT NULL DEFAULT 'Want to read'
        CHECK (reading_status IN ('Want to read', 'Currently reading', 'Finished'));
      UPDATE books
      SET reading_status = CASE
        WHEN read_status = 1 THEN 'Finished'
        ELSE 'Want to read'
      END;
    `);
  }
  if (!bookColumns.some(({ name }) => name === "current_page")) {
    database.exec(`
      ALTER TABLE books ADD COLUMN current_page INTEGER NOT NULL DEFAULT 0
        CHECK (current_page >= 0);
      UPDATE books
      SET current_page = pages
      WHERE reading_status = 'Finished' OR read_status = 1;
    `);
  }
  database.exec(`
    UPDATE books SET reading_status = 'Currently reading'
    WHERE reading_status = 'Did not finish';
    UPDATE books SET current_page = 0 WHERE reading_status = 'Want to read';
    UPDATE books SET current_page = pages WHERE reading_status = 'Finished';
  `);

  return database;
}

const isRunDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isRunDirectly) {
  const database = openDatabase();
  database.close();
  console.log(`Database ready at ${defaultDatabasePath}`);
}
