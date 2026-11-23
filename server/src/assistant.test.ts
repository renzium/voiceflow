import assert from "node:assert/strict";
import { test } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { ClaudeAssistant, MODEL, buildMessages } from "./assistant.ts";

test("buildMessages drops leading assistant turns and appends the current turn", () => {
  const msgs = buildMessages({
    history: [
      { role: "assistant", text: "Hi! What should I add?" },
      { role: "user", text: "add eggs" },
      { role: "assistant", text: "Added eggs." },
    ],
    utterance: "and bread",
    list: ["eggs"],
  });
  assert.equal(msgs.length, 3);
  assert.equal(msgs[0].role, "user");
  const last = msgs.at(-1)!;
  assert.equal(last.role, "user");
  assert.match(String(last.content), /<current_list>\n- eggs\n<\/current_list>/);
  assert.match(String(last.content), /<utterance>and bread<\/utterance>/);
});

test("buildMessages marks an empty list", () => {
  const msgs = buildMessages({ history: [], utterance: "what's on my list", list: [] });
  assert.match(String(msgs[0].content), /\(empty\)/);
});

function fakeClient(result: object) {
  const seen: any[] = [];
  const client = { beta: { messages: { parse: async (p: any) => (seen.push(p), result) } } };
  return { client: client as unknown as Anthropic, seen };
}

test("ClaudeAssistant returns parsed structured output", async () => {
  const out = { type: "answer", reply: "Added milk.", operations: [{ action: "add", item: "milk" }] };
  const { client, seen } = fakeClient({ stop_reason: "end_turn", parsed_output: out });
  const res = await new ClaudeAssistant(client).converse({ history: [], utterance: "milk", list: [] });
  assert.deepEqual(res, out);
  assert.equal(seen[0].model, MODEL);
  assert.equal(seen[0].fallbacks, "default");
});

test("ClaudeAssistant degrades gracefully on refusal", async () => {
  const { client } = fakeClient({ stop_reason: "refusal", parsed_output: null });
  const res = await new ClaudeAssistant(client).converse({ history: [], utterance: "x", list: [] });
  assert.equal(res.type, "answer");
  assert.deepEqual(res.operations, []);
});
