import assert from "node:assert/strict";
import test from "node:test";

import { openDatabase } from "../database.js";

test("creates the users and books schema", () => {
  const database = openDatabase(":memory:");

  const tables = database
    .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
    .all()
    .map(({ name }) => name);

  assert.ok(tables.includes("users"));
  assert.ok(tables.includes("books"));
  assert.ok(tables.includes("sessions"));
  const bookColumns = database
    .prepare("PRAGMA table_info(books)")
    .all()
    .map(({ name }) => name);
  assert.ok(bookColumns.includes("reading_status"));
  database.close();
});

test("keeps books private to a user and cascades account deletion", () => {
  const database = openDatabase(":memory:");
  const insertUser = database.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `);
  const firstUser = insertUser.run("Ada", "ada@example.com", "hash");
  const secondUser = insertUser.run("Grace", "grace@example.com", "hash");

  database
    .prepare(`
      INSERT INTO books (id, user_id, title, author, pages)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run("book-1", firstUser.lastInsertRowid, "A Book", "An Author", 200);

  const secondUsersBooks = database
    .prepare("SELECT * FROM books WHERE user_id = ?")
    .all(secondUser.lastInsertRowid);
  assert.deepEqual(secondUsersBooks, []);

  database
    .prepare("DELETE FROM users WHERE id = ?")
    .run(firstUser.lastInsertRowid);
  assert.equal(database.prepare("SELECT count(*) AS count FROM books").get().count, 0);
  database.close();
});
