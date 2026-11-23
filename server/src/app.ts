import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import type { ConverseError } from "../../shared/contract.ts";
import { LIMITS } from "../../shared/contract.ts";
import type { Assistant } from "./assistant.ts";
import { RateLimiter } from "./rateLimit.ts";

const ConverseRequestSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(LIMITS.maxUtteranceChars),
      }),
    )
    .max(100),
  utterance: z.string().trim().min(1).max(LIMITS.maxUtteranceChars),
  list: z.array(z.string().max(LIMITS.maxItemChars)).max(LIMITS.maxListItems),
});

type Options = {
  assistant: Assistant;
  corsOrigins?: string[];
  rateLimiter?: RateLimiter;
};

function fail(res: Response, status: number, code: ConverseError["error"]["code"], message: string) {
  const body: ConverseError = { error: { code, message } };
  res.status(status).json(body);
}

export function createApp({ assistant, corsOrigins = [], rateLimiter = new RateLimiter() }: Options) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/converse", async (req, res, next) => {
    if (!rateLimiter.allow(req.ip ?? "unknown")) {
      return fail(res, 429, "RATE_LIMITED", "Too many requests. Please slow down.");
    }
    const parsed = ConverseRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, "BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid request");
    }
    try {
      res.json(await assistant.converse(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof Anthropic.RateLimitError) {
      return fail(res, 503, "UPSTREAM", "The assistant is busy. Please try again in a moment.");
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`[anthropic] ${err.status ?? "connection"}: ${err.message}`);
      return fail(res, 502, "UPSTREAM", "The assistant is unavailable right now.");
    }
    if (err instanceof SyntaxError) {
      return fail(res, 400, "BAD_REQUEST", "Malformed JSON body");
    }
    console.error(err);
    return fail(res, 500, "INTERNAL", "Something went wrong.");
  });

  return app;
}
