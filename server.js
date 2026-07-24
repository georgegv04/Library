import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./auth.js";
import { openDatabase } from "./database.js";

const projectDirectory = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT) || 4173;
const database = openDatabase(process.env.LIBRARY_DB_PATH);
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;
const authAttempts = new Map();
const readingStatuses = new Set(["Want to read", "Currently reading", "Finished"]);

const contentTypes = {
  ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon", ".jpeg": "image/jpeg", ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp",
};

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw Object.assign(new Error("Request is too large."), { status: 413 });
  }
  try { return body ? JSON.parse(body) : {}; }
  catch { throw Object.assign(new Error("Invalid JSON."), { status: 400 }); }
}

function getCookie(request, name) {
  const cookie = request.headers.cookie?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function sessionCookie(token, maxAge = sessionLifetimeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `library_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function currentUser(request) {
  const token = getCookie(request, "library_session");
  if (!token) return null;
  return database.prepare(`
    SELECT users.id, users.name, users.email
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > CURRENT_TIMESTAMP
  `).get(hashSessionToken(token)) || null;
}

function requireUser(request, response) {
  const user = currentUser(request);
  if (!user) sendJson(response, 401, { error: "Please log in to continue." });
  return user;
}

function authRateLimited(request) {
  const key = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const recent = (authAttempts.get(key) || []).filter((time) => now - time < 15 * 60_000);
  recent.push(now);
  authAttempts.set(key, recent);
  return recent.length > 20;
}

function publicUser(user) { return { id: Number(user.id), name: user.name, email: user.email }; }

function serializeBook(book) {
  return {
    id: book.id, title: book.title, author: book.author, pages: Number(book.pages),
    currentPage: Number(book.current_page || 0),
    readStatus: book.reading_status || (book.read_status ? "Finished" : "Want to read"),
    coverUrl: book.cover_url,
    description: book.description, descriptionVersion: book.description ? 2 : null,
    rating: Number(book.rating), dateAdded: book.date_added,
  };
}

function validateBook(input) {
  const requestedStatus = input.readStatus === "Read"
    ? "Finished"
    : input.readStatus === "Not read"
      ? "Want to read"
      : String(input.readStatus || "Want to read");
  const book = {
    title: String(input.title || "").trim(), author: String(input.author || "").trim(),
    pages: Number(input.pages), readStatus: requestedStatus,
    currentPage: Number(input.currentPage) || 0,
    coverUrl: input.coverUrl ? String(input.coverUrl).slice(0, 2000) : null,
    description: input.description ? String(input.description).slice(0, 5000) : null,
    rating: Number(input.rating) || 0,
    dateAdded: String(input.dateAdded || new Date().toISOString().slice(0, 10)),
  };
  if (!book.title || book.title.length > 300) throw Object.assign(new Error("Enter a valid title."), { status: 400 });
  if (!book.author || book.author.length > 300) throw Object.assign(new Error("Enter a valid author."), { status: 400 });
  if (!Number.isInteger(book.pages) || book.pages < 1 || book.pages > 100000) throw Object.assign(new Error("Enter a valid page count."), { status: 400 });
  if (!readingStatuses.has(book.readStatus)) throw Object.assign(new Error("Choose a valid reading status."), { status: 400 });
  if (!Number.isInteger(book.currentPage) || book.currentPage < 0 || book.currentPage > book.pages) throw Object.assign(new Error("Current page must be between 0 and the total number of pages."), { status: 400 });
  if (book.readStatus === "Want to read") book.currentPage = 0;
  if (book.readStatus === "Finished") book.currentPage = book.pages;
  if (!Number.isInteger(book.rating) || book.rating < 0 || book.rating > 5) throw Object.assign(new Error("Rating must be between 0 and 5."), { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(book.dateAdded)) throw Object.assign(new Error("Enter a valid date."), { status: 400 });
  return book;
}

function createSession(userId) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000).toISOString();
  database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashSessionToken(token), userId, expiresAt);
  return token;
}

async function handleAuth(request, response, pathname) {
  if (pathname === "/api/auth/me" && request.method === "GET") {
    const user = currentUser(request);
    return sendJson(response, user ? 200 : 401, user ? { user: publicUser(user) } : { error: "Not authenticated." });
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const token = getCookie(request, "library_session");
    if (token) database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
    return sendJson(response, 200, { ok: true }, { "Set-Cookie": sessionCookie("", 0) });
  }
  if (!["/api/auth/signup", "/api/auth/login"].includes(pathname) || request.method !== "POST") return false;
  if (authRateLimited(request)) return sendJson(response, 429, { error: "Too many attempts. Please try again later." });
  const input = await readJson(request);
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");

  let user;
  if (pathname.endsWith("signup")) {
    const name = String(input.name || "").trim();
    if (!name || name.length > 100) return sendJson(response, 400, { error: "Enter your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return sendJson(response, 400, { error: "Enter a valid email address." });
    if (password.length < 8 || password.length > 128) return sendJson(response, 400, { error: "Password must be 8–128 characters." });
    if (database.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return sendJson(response, 409, { error: "An account with that email already exists." });
    const result = database.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(name, email, await hashPassword(password));
    user = { id: result.lastInsertRowid, name, email };
  } else {
    const found = database.prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?").get(email);
    if (!found || !(await verifyPassword(password, found.password_hash))) return sendJson(response, 401, { error: "Incorrect email or password." });
    user = found;
  }
  const token = createSession(user.id);
  return sendJson(response, pathname.endsWith("signup") ? 201 : 200, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(token) });
}

async function handleBooks(request, response, pathname) {
  if (!pathname.startsWith("/api/books")) return false;
  const user = requireUser(request, response); if (!user) return true;
  const id = pathname.match(/^\/api\/books\/([^/]+)$/)?.[1];
  if (request.method === "GET" && !id) {
    const books = database.prepare("SELECT * FROM books WHERE user_id = ? ORDER BY date_added DESC, created_at DESC").all(user.id).map(serializeBook);
    return sendJson(response, 200, { books });
  }
  if (request.method === "POST" && !id) {
    const input = await readJson(request); const book = validateBook(input); const bookId = input.id || crypto.randomUUID();
    if (book.readStatus === "Want to read") book.rating = 0;
    database.prepare(`INSERT INTO books (id,user_id,title,author,pages,current_page,read_status,reading_status,cover_url,description,rating,date_added) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(bookId,user.id,book.title,book.author,book.pages,book.currentPage,book.readStatus === "Finished" ? 1 : 0,book.readStatus,book.coverUrl,book.description,book.rating,book.dateAdded);
    return sendJson(response, 201, { book: serializeBook(database.prepare("SELECT * FROM books WHERE id = ? AND user_id = ?").get(bookId,user.id)) });
  }
  const existing = id && database.prepare("SELECT * FROM books WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!existing) return sendJson(response, 404, { error: "Book not found." });
  if (request.method === "PUT") {
    const input = await readJson(request);
    const book = validateBook(input);
    if (book.readStatus === "Want to read") book.rating = Number(existing.rating);
    database.prepare(`UPDATE books SET title=?,author=?,pages=?,current_page=?,read_status=?,reading_status=?,cover_url=?,description=?,rating=?,date_added=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`)
      .run(book.title,book.author,book.pages,book.currentPage,book.readStatus === "Finished" ? 1 : 0,book.readStatus,book.coverUrl,book.description,book.rating,book.dateAdded,id,user.id);
    return sendJson(response, 200, { book: serializeBook(database.prepare("SELECT * FROM books WHERE id = ? AND user_id = ?").get(id,user.id)) });
  }
  if (request.method === "DELETE") {
    database.prepare("DELETE FROM books WHERE id = ? AND user_id = ?").run(id,user.id);
    return sendJson(response, 200, { ok: true });
  }
  return false;
}

function resolveRequestPath(pathname) {
  if (pathname === "/") return "index.html";
  if (pathname === "/library") return "library.html";
  if (pathname === "/login" || pathname === "/signup") return "auth.html";
  return pathname.replace(/^\/+/, "");
}

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  try {
    database.prepare("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP").run();
    if (pathname.startsWith("/api/auth/")) { const handled = await handleAuth(request, response, pathname); if (handled !== false) return; }
    if (pathname.startsWith("/api/books")) { const handled = await handleBooks(request, response, pathname); if (handled !== false) return; }
    if (!['GET','HEAD'].includes(request.method)) return sendJson(response, 405, { error: "Method not allowed." }, { Allow: "GET, HEAD" });
    if ((pathname === "/library" || pathname === "/library.html") && !currentUser(request)) {
      response.writeHead(302, { Location: "/login" }); return response.end();
    }
    const requestedPath = normalize(resolveRequestPath(pathname));
    const filePath = join(projectDirectory, requestedPath);
    if (!filePath.startsWith(projectDirectory)) { response.writeHead(403); return response.end("Forbidden"); }
    const fileStats = await stat(filePath); if (!fileStats.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Cache-Control": "no-cache", "Content-Length": fileStats.size, "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream" });
    if (request.method === "HEAD") return response.end();
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (pathname.startsWith("/api/")) return sendJson(response, error.status || 500, { error: error.status ? error.message : "Something went wrong." });
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("404 — Page not found");
  }
});

server.listen(port, "0.0.0.0", () => console.log(`My Library Corner is running at http://localhost:${port}`));

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
  server.closeAllConnections();
}
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
