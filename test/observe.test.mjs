/**
 * Unit test for generic observe(): mocks fetch and verifies POST to /v1/observe.
 * Run: npm test
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

let fetchCalls = [];
const originalFetch = globalThis.fetch;

describe("observe", () => {
  beforeEach(() => {
    fetchCalls = [];
    globalThis.fetch = function (url, opts) {
      fetchCalls.push({ url, opts });
      return Promise.resolve({ ok: true });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("POSTs to Relnk /v1/observe with messages, model, and response", async () => {
    const { observe } = await import("../dist/index.js");

    await observe({
      relnkApiKey: "relnk-key",
      messages: [{ role: "user", content: "Hello" }],
      model: "gpt-4o-mini",
      response: {
        choices: [{ message: { role: "assistant", content: "Hi" } }],
      },
    });

    assert.strictEqual(fetchCalls.length, 1);
    const { url, opts } = fetchCalls[0];
    assert.strictEqual(url, "https://api.relnk.ai/v1/observe");
    assert.strictEqual(opts.method, "POST");
    assert.strictEqual(opts.headers.Authorization, "Bearer relnk-key");
    const body = JSON.parse(opts.body);
    assert.deepStrictEqual(body.messages, [{ role: "user", content: "Hello" }]);
    assert.strictEqual(body.model, "gpt-4o-mini");
    assert.deepStrictEqual(body.response.choices, [{ message: { role: "assistant", content: "Hi" } }]);
  });
});
