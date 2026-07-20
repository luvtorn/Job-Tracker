import assert from "node:assert/strict";
import test from "node:test";
import {
  generateRefreshToken,
  hashRefreshToken,
  rotateRefreshSession,
} from "./refresh-token-service";

test("generates a random 256-bit refresh token", () => {
  const firstToken = generateRefreshToken();
  const secondToken = generateRefreshToken();

  assert.match(firstToken, /^[a-f0-9]{64}$/);
  assert.match(secondToken, /^[a-f0-9]{64}$/);
  assert.notEqual(firstToken, secondToken);
});

test("hashes refresh tokens deterministically with SHA-256", () => {
  const token = "refresh-token";

  assert.equal(hashRefreshToken(token), hashRefreshToken(token));
  assert.match(hashRefreshToken(token), /^[a-f0-9]{64}$/);
  assert.notEqual(hashRefreshToken(token), hashRefreshToken("other-token"));
});

test("rotates a refresh token without extending its absolute expiration", async () => {
  const expiresAt = new Date("2030-01-02T03:04:05.000Z");
  let receivedCurrentHash = "";
  let receivedNextHash = "";

  const result = await rotateRefreshSession(
    "current-token",
    async (currentHash, nextHash) => {
      receivedCurrentHash = currentHash;
      receivedNextHash = nextHash;
      return { user: { id: "user-id" }, expiresAt };
    },
  );

  assert.equal(receivedCurrentHash, hashRefreshToken("current-token"));
  assert.match(receivedNextHash, /^[a-f0-9]{64}$/);
  assert.notEqual(receivedCurrentHash, receivedNextHash);
  assert.equal(result?.expiresAt, expiresAt);
  assert.match(result?.refreshToken ?? "", /^[a-f0-9]{64}$/);
});

test("does not issue a replacement when the stored session is invalid", async () => {
  const result = await rotateRefreshSession("invalid-token", async () => null);

  assert.equal(result, null);
});
