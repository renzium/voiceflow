import assert from "node:assert/strict";
import { test } from "node:test";
import { applyOperations, initialState, toHistory, voiceReducer } from "./voiceMachine";
import type { VoiceEvent, VoiceState } from "../types";

const run = (events: VoiceEvent[], start: VoiceState = initialState) => events.reduce(voiceReducer, start);

test("happy path: listen → think → speak → idle, list updated", () => {
  const s = run([
    { type: "LISTEN_START", now: 1 },
    { type: "PARTIAL", text: "add mil" },
    { type: "LISTEN_END", text: "add milk", id: "u1" },
    { type: "REPLY", id: "a1", response: { type: "answer", reply: "Added milk.", operations: [{ action: "add", item: "milk" }] } },
  ]);
  assert.equal(s.phase.kind, "Speaking");
  assert.deepEqual(s.list, ["milk"]);
  assert.deepEqual(s.transcript.map((t) => t.role), ["user", "assistant"]);
  assert.equal(voiceReducer(s, { type: "SPEAK_DONE" }).phase.kind, "Idle");
});

test("empty final transcript returns to idle without a transcript entry", () => {
  const s = run([{ type: "LISTEN_START", now: 1 }, { type: "LISTEN_END", text: "  ", id: "u1" }]);
  assert.equal(s.phase.kind, "Idle");
  assert.equal(s.transcript.length, 0);
});

test("cancel ignores a late end event from the recognizer", () => {
  const s = run([
    { type: "LISTEN_START", now: 1 },
    { type: "CANCEL" },
    { type: "LISTEN_END", text: "add milk", id: "u1" },
  ]);
  assert.equal(s.phase.kind, "Idle");
  assert.equal(s.transcript.length, 0);
});

test("clarification replies are tagged and do not change the list", () => {
  const s = run([
    { type: "LISTEN_START", now: 1 },
    { type: "LISTEN_END", text: "remove it", id: "u1" },
    { type: "REPLY", id: "a1", response: { type: "clarification", reply: "Which item?", operations: [] } },
  ]);
  assert.equal(s.transcript.at(-1)?.role, "clarification");
  assert.deepEqual(toHistory(s).at(-1), { role: "assistant", text: "Which item?" });
});

test("failures surface as errors and can be dismissed", () => {
  const s = run([
    { type: "LISTEN_START", now: 1 },
    { type: "LISTEN_END", text: "hi", id: "u1" },
    { type: "FAIL", message: "Network error" },
  ]);
  assert.deepEqual(s.phase, { kind: "Error", message: "Network error" });
  assert.equal(voiceReducer(s, { type: "DISMISS" }).phase.kind, "Idle");
});

test("a reply arriving after an error is ignored", () => {
  const s = run([
    { type: "LISTEN_START", now: 1 },
    { type: "LISTEN_END", text: "hi", id: "u1" },
    { type: "FAIL", message: "timeout" },
    { type: "REPLY", id: "a1", response: { type: "answer", reply: "late", operations: [] } },
  ]);
  assert.equal(s.phase.kind, "Error");
});

test("applyOperations dedupes case-insensitively and supports remove/clear", () => {
  assert.deepEqual(
    applyOperations(["Milk"], [
      { action: "add", item: "milk" },
      { action: "add", item: "eggs" },
      { action: "add", item: "bread" },
      { action: "remove", item: "MILK" },
    ]),
    ["eggs", "bread"],
  );
  assert.deepEqual(applyOperations(["a", "b"], [{ action: "clear", item: "" }, { action: "add", item: "c" }]), ["c"]);
});
