import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "./access-token-service";

const payload = { userId: "user-id", email: "user@example.com", role: "SEEKER" as const };

test("verifies a correctly signed access token", () => {
  const token = jwt.sign(payload, "correct-secret", { expiresIn: "1h" });
  assert.deepEqual(verifyAccessToken(token, "correct-secret"), payload);
});

test("rejects a token signed with another secret", () => {
  const token = jwt.sign(payload, "wrong-secret", { expiresIn: "1h" });
  assert.throws(() => verifyAccessToken(token, "correct-secret"));
});

test("rejects an expired token", () => {
  const token = jwt.sign(payload, "correct-secret", { expiresIn: -1 });
  assert.throws(() => verifyAccessToken(token, "correct-secret"));
});
