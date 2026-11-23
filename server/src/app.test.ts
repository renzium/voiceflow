import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import type { ConverseRequest, ConverseResponse } from "../../shared/contract.ts";
import { createApp } from "./app.ts";
import type { Assistant } from "./assistant.ts";
import { RateLimiter } from "./rateLimit.ts";

const calls: ConverseRequest[] = [];
const fake: Assistant = {
  async converse(req) {
    calls.push(req);
    if (req.utterance === "explode") throw new Error("boom");
    return { type: "answer", reply: "Added milk.", operations: [{ action: "add", item: "milk" }] };
  },
};

let base = "";
let close: () => void;

before(async () => {
  const server = createApp({ assistant: fake, rateLimiter: new RateLimiter(5, 60_000) }).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => server.close();
});
after(() => close());

const post = (body: unknown) =>
  fetch(`${base}/api/converse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("health check", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("valid request returns the assistant reply", async () => {
  const res = await post({ history: [], utterance: "add milk", list: [] });
  assert.equal(res.status, 200);
  const body = (await res.json()) as ConverseResponse;
  assert.equal(body.reply, "Added milk.");
  assert.equal(calls.at(-1)?.utterance, "add milk");
});

test("rejects an empty utterance", async () => {
  const res = await post({ history: [], utterance: "   ", list: [] });
  assert.equal(res.status, 400);
  assert.equal(((await res.json()) as any).error.code, "BAD_REQUEST");
});

test("rejects malformed JSON", async () => {
  const res = await post("{not json");
  assert.equal(res.status, 400);
});

test("hides internal errors", async () => {
  const res = await post({ history: [], utterance: "explode", list: [] });
  assert.equal(res.status, 500);
  const body = (await res.json()) as any;
  assert.equal(body.error.code, "INTERNAL");
  assert.doesNotMatch(body.error.message, /boom/);
});

test("rate limits per client", async () => {
  let last = 0;
  for (let i = 0; i < 6; i++) last = (await post({ history: [], utterance: "hi", list: [] })).status;
  assert.equal(last, 429);
});
