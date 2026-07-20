import assert from "node:assert/strict";
import test from "node:test";
import { badRequest, handleApiError } from "./application-error";

test("maps application errors to a safe response", async () => {
  const response = handleApiError(badRequest("Invalid input", { field: ["Required"] }), "test");
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Invalid input",
    errors: { field: ["Required"] },
  });
});

test("does not expose unexpected error messages", async () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;
  try {
    const response = handleApiError(new Error("database password leaked"), "test");
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { success: false, message: "Internal server error" });
  } finally {
    console.error = originalConsoleError;
  }
});
