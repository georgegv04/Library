import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const projectDirectory = new URL("..", import.meta.url).pathname;

test("signup, sessions, protected books, password reset, and logout work together", { timeout: 10_000 }, async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "library-api-"));
  const port = 44000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: projectDirectory,
    env: {
      ...process.env,
      PORT: String(port),
      LIBRARY_DB_PATH: join(directory, "test.sqlite"),
      GMAIL_USER: "",
      GMAIL_APP_PASSWORD: "",
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
  const cookie = signup.headers.get("set-cookie").split(";")[0];
  assert.match(cookie, /^library_session=/);

  const createBook = await fetch(`${baseUrl}/api/books`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: "Test Book", author: "Test Author", pages: 123, readStatus: "Read" }),
  });
  assert.equal(createBook.status, 201);

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

  const forgot = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "reader@example.com" }),
  });
  assert.equal(forgot.status, 200);
  const resetUrl = (await forgot.json()).resetUrl;
  assert.match(resetUrl, /^\/reset-password\?token=/);
  const resetToken = new URL(resetUrl, baseUrl).searchParams.get("token");

  const reset = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, password: "new-password-123" }),
  });
  assert.equal(reset.status, 200);

  const reusedReset = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, password: "another-password" }),
  });
  assert.equal(reusedReset.status, 400);

  const oldLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "reader@example.com", password: "password123" }),
  });
  assert.equal(oldLogin.status, 401);
  const newLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "reader@example.com", password: "new-password-123" }),
  });
  assert.equal(newLogin.status, 200);
});
