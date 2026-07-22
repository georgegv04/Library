import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, keyLength);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, salt, storedKeyHex] = String(storedHash).split(":");
  if (algorithm !== "scrypt" || !salt || !storedKeyHex) return false;

  const storedKey = Buffer.from(storedKeyHex, "hex");
  if (storedKey.length !== keyLength) return false;

  const derivedKey = await scrypt(password, salt, keyLength);
  return timingSafeEqual(storedKey, derivedKey);
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
