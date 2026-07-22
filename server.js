import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT) || 4173;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);

  if (pathname === "/") return "index.html";
  if (pathname === "/library") return "library.html";

  return pathname.replace(/^\/+/, "");
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  try {
    const requestedPath = normalize(resolveRequestPath(request.url));
    const filePath = join(projectDirectory, requestedPath);

    if (!filePath.startsWith(projectDirectory)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) throw new Error("Not a file");

    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Length": fileStats.size,
      "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("404 — Page not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`My Library Corner is running at http://localhost:${port}`);
});
