import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchFault } from "./fetch-fault.ts";

describe("fetchFault", () => {
  it("separates a signal abort from a network failure", () => {
    assert.equal(fetchFault(new DOMException("The operation was aborted due to timeout", "TimeoutError")), "timeout");
    assert.equal(fetchFault(new DOMException("The operation was aborted", "AbortError")), "timeout");
    assert.equal(fetchFault(new TypeError("fetch failed")), "network");
    assert.equal(fetchFault(new SyntaxError("Unexpected token")), "network");
  });
});
