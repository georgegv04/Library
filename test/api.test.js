import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const projectDirectory = new URL("..", import.meta.url).pathname;

test("signup, sessions, protected books, logout, and login persistence work together", { timeout: 10_000 }, async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "library-api-"));
  const port = 44000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: projectDirectory,
    env: {
      ...process.env,
      PORT: String(port),
      LIBRARY_DB_PATH: join(directory, "test.sqlite"),
    },
    stdio: "ignore",
  });
  context.after(() => { child.kill("SIGTERM"); rmSync(directory, { recursive: true, force: true }); });

  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const signup = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Reader", email: "reader@example.com", password: "password123" }),
  });
  assert.equal(signup.status, 201);
  await signup.json();
  const cookie = signup.headers.get("set-cookie").split(";")[0];
  assert.match(cookie, /^library_session=/);

  const createBook = await fetch(`${baseUrl}/api/books`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: "Test Book", author: "Test Author", pages: 123, currentPage: 41, readStatus: "Currently reading" }),
  });
  assert.equal(createBook.status, 201);
  const createdBook = (await createBook.json()).book;
  assert.equal(createdBook.readStatus, "Currently reading");
  assert.equal(createdBook.currentPage, 41);

  const list = await fetch(`${baseUrl}/api/books`, { headers: { Cookie: cookie } });
  assert.equal(list.status, 200);
  assert.equal((await list.json()).books.length, 1);

  const anonymousList = await fetch(`${baseUrl}/api/books`);
  assert.equal(anonymousList.status, 401);

  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie } });
  assert.equal(logout.status, 200);
  const afterLogout = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(afterLogout.status, 401);

  const loginAgain = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "reader@example.com", password: "password123" }),
  });
  assert.equal(loginAgain.status, 200);
  const secondCookie = loginAgain.headers.get("set-cookie").split(";")[0];
  const libraryAfterLogin = await fetch(`${baseUrl}/api/books`, { headers: { Cookie: secondCookie } });
  assert.equal(libraryAfterLogin.status, 200);
  assert.equal((await libraryAfterLogin.json()).books.length, 1);

});

test("supports each reading status and rejects unknown statuses", { timeout: 10_000 }, async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "library-status-api-"));
  const port = 45000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: projectDirectory,
    env: { ...process.env, PORT: String(port), LIBRARY_DB_PATH: join(directory, "test.sqlite") },
    stdio: "ignore",
  });
  context.after(() => { child.kill("SIGTERM"); rmSync(directory, { recursive: true, force: true }); });

  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const signup = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Status Reader", email: "status@example.com", password: "password123" }),
  });
  const cookie = signup.headers.get("set-cookie").split(";")[0];
  const statuses = ["Want to read", "Currently reading", "Finished"];

  for (const [index, readStatus] of statuses.entries()) {
    const response = await fetch(`${baseUrl}/api/books`, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ title: `Book ${index}`, author: "An Author", pages: 100, readStatus }),
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).book.readStatus, readStatus);
  }

  const invalid = await fetch(`${baseUrl}/api/books`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: "Invalid", author: "An Author", pages: 100, readStatus: "Somewhere else" }),
  });
  assert.equal(invalid.status, 400);

  const beyondLastPage = await fetch(`${baseUrl}/api/books`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: "Too Far", author: "An Author", pages: 100, currentPage: 101 }),
  });
  assert.equal(beyondLastPage.status, 400);

  const finished = await fetch(`${baseUrl}/api/books`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: "Complete", author: "An Author", pages: 240, currentPage: 12, readStatus: "Finished" }),
  });
  assert.equal((await finished.json()).book.currentPage, 240);

  const wantToRead = await fetch(`${baseUrl}/api/books`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: "Later", author: "An Author", pages: 180, currentPage: 90, rating: 5, readStatus: "Want to read" }),
  });
  const wantToReadBook = (await wantToRead.json()).book;
  assert.equal(wantToReadBook.currentPage, 0);
  assert.equal(wantToReadBook.rating, 0);

  const rateAfterStarting = await fetch(`${baseUrl}/api/books/${wantToReadBook.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ ...wantToReadBook, currentPage: 20, rating: 4, readStatus: "Currently reading" }),
  });
  const ratedBook = (await rateAfterStarting.json()).book;
  assert.equal(ratedBook.rating, 4);

  const returnToWantToRead = await fetch(`${baseUrl}/api/books/${wantToReadBook.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ ...ratedBook, rating: 0, readStatus: "Want to read" }),
  });
  const preservedBook = (await returnToWantToRead.json()).book;
  assert.equal(preservedBook.currentPage, 0);
  assert.equal(preservedBook.rating, 4);
});

test("the configured production recovery route resets only its account and can be used once", { timeout: 10_000 }, async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "library-reset-api-"));
  const port = 46000 + Math.floor(Math.random() * 1000);
  const resetToken = "test-only-reset-token-123456789";
  const child = spawn(process.execPath, ["server.js"], {
    cwd: projectDirectory,
    env: {
      ...process.env,
      PORT: String(port),
      LIBRARY_DB_PATH: join(directory, "test.sqlite"),
      ONE_TIME_RESET_EMAIL: "owner@example.com",
      ONE_TIME_RESET_TOKEN: resetToken,
    },
    stdio: "ignore",
  });
  context.after(() => { child.kill("SIGTERM"); rmSync(directory, { recursive: true, force: true }); });

  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Owner", email: "owner@example.com", password: "old-password" }),
  });
  const reset = await fetch(`${baseUrl}/api/auth/one-time-reset`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@example.com", resetToken, password: "new-password" }),
  });
  assert.equal(reset.status, 200);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@example.com", password: "new-password" }),
  });
  assert.equal(login.status, 200);

  const secondReset = await fetch(`${baseUrl}/api/auth/one-time-reset`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@example.com", resetToken, password: "another-password" }),
  });
  assert.equal(secondReset.status, 410);
});
