import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, verifyPassword } from "../auth.js";

test("hashes and verifies passwords without storing the original", async () => {
  const password = "correct horse battery staple";
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("wrong password", hash), false);
});
