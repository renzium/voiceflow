import type { ConverseError, ConverseRequest, ConverseResponse } from "../../shared/contract";
import type { Scenario } from "../types";

export class AssistantError extends Error {
  constructor(public code: "NETWORK" | "SERVER", message: string) {
    super(message);
  }
}

export interface Assistant {
  readonly mode: "claude" | "demo";
  converse(req: ConverseRequest): Promise<ConverseResponse>;
}

/** Talks to the VoiceFlow backend, which calls Claude. */
export class HttpAssistant implements Assistant {
  readonly mode = "claude" as const;

  constructor(private baseUrl: string, private timeoutMs = 20_000) {}

  async converse(req: ConverseRequest): Promise<ConverseResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/converse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
    } catch {
      throw new AssistantError("NETWORK", "Can't reach the assistant. Check your connection and try again.");
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as ConverseError | null;
      throw new AssistantError("SERVER", body?.error.message ?? "Something went wrong. Please try again.");
    }
    return (await res.json()) as ConverseResponse;
  }
}

/**
 * Offline assistant with simple keyword rules, so the app runs without a
 * backend and so error/clarification states can be exercised on demand.
 */
export class DemoAssistant implements Assistant {
  readonly mode = "demo" as const;
  scenario: Scenario = "success";

  constructor(private delayMs = 700) {}

  async converse({ utterance, list }: ConverseRequest): Promise<ConverseResponse> {
    await new Promise((r) => setTimeout(r, this.delayMs));
    switch (this.scenario) {
      case "networkError":
        throw new AssistantError("NETWORK", "Can't reach the assistant. Check your connection and try again.");
      case "serverError":
        throw new AssistantError("SERVER", "The assistant is unavailable right now.");
      case "clarify":
        return { type: "clarification", reply: "Sorry, which list should that go on?", operations: [] };
    }

    const text = utterance.toLowerCase().replace(/[.!?]/g, "").trim();
    const after = (verb: RegExp) => text.replace(verb, "").replace(/\s+(to|from) (my|the) list$/, "").trim();

    if (/^(clear|empty|reset)\b/.test(text)) {
      return { type: "answer", reply: "Done, your list is empty.", operations: [{ action: "clear", item: "" }] };
    }
    if (/^(remove|delete|take off)\b/.test(text)) {
      const item = after(/^(remove|delete|take off)\s+/);
      const match = list.find((i) => i.toLowerCase() === item);
      return match
        ? { type: "answer", reply: `Removed ${match}.`, operations: [{ action: "remove", item: match }] }
        : { type: "clarification", reply: `I couldn't find ${item || "that"} on your list. Which item?`, operations: [] };
    }
    if (/^(add|put)\b/.test(text)) {
      const items = after(/^(add|put)\s+/).split(/,\s*|\s+and\s+/).filter(Boolean);
      if (!items.length) return { type: "clarification", reply: "What should I add?", operations: [] };
      return {
        type: "answer",
        reply: `Added ${items.join(" and ")}.`,
        operations: items.map((item) => ({ action: "add" as const, item })),
      };
    }
    if (/what('s| is) on my list|read (me )?my list/.test(text)) {
      return {
        type: "answer",
        reply: list.length ? `You have ${list.join(", ")}.` : "Your list is empty.",
        operations: [],
      };
    }
    return {
      type: "answer",
      reply: "In demo mode I understand add, remove, clear, and what's on my list. Connect the server for the full assistant.",
      operations: [],
    };
  }
}

export function createAssistant(): Assistant {
  const url = process.env.EXPO_PUBLIC_API_URL;
  return url ? new HttpAssistant(url) : new DemoAssistant();
}
