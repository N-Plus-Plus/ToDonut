import assert from "node:assert/strict";
import test from "node:test";
import { findEncodingDefects } from "./check-encoding.mjs";

test("encoding guard accepts ordinary valid Unicode", () => {
  assert.deepEqual(findEncodingDefects("Task · closes × at 9… with an en–dash"), []);
});

test("encoding guard detects replacement characters", () => {
  assert.deepEqual(findEncodingDefects(`Broken ${String.fromCodePoint(0xfffd)} text`), [String.fromCodePoint(0xfffd)]);
});
