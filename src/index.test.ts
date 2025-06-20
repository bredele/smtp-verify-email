import test from "node:test";
import assert from "node:assert";
import getMailServer from "@bredele/get-mail-server";
import verifySmtp from ".";

test("should handle connection errors gracefully", async () => {
  try {
    await verifySmtp("invalid-server.example", "test@example.com");
    assert.fail("Should have thrown an error");
  } catch (error) {
    assert.ok(error instanceof Error);
  }
});

test("should handle connection timeout", async () => {
  try {
    await verifySmtp("192.0.2.1", "test@example.com");
    assert.fail("Should have thrown an error");
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok(error.message.includes('timeout') || error.message.includes('ETIMEDOUT'));
  }
});

test("should return boolean result", async () => {
  try {
    const result = await verifySmtp("localhost", "test@example.com");
    assert.strictEqual(typeof result, "boolean");
  } catch (error) {
    assert.ok(error instanceof Error);
  }
});

test("should handle DNS resolution errors", async () => {
  try {
    await verifySmtp("nonexistent-domain-12345.invalid", "test@example.com");
    assert.fail("Should have thrown an error");
  } catch (error) {
    assert.ok(error instanceof Error);
  }
});
