import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { ConverseRequest, ConverseResponse } from "../../shared/contract.ts";
import { LIMITS } from "../../shared/contract.ts";

export interface Assistant {
  converse(req: ConverseRequest): Promise<ConverseResponse>;
}

export const MODEL = "claude-opus-5-5";

/** Schema Claude must answer with (enforced by structured outputs). */
export const ReplySchema = z.object({
  type: z.enum(["answer", "clarification"]),
  reply: z.string(),
  operations: z.array(
    z.object({
      action: z.enum(["add", "remove", "clear"]),
      item: z.string(),
    }),
  ),
});

// Kept byte-stable so it can be prompt-cached; per-request data goes in messages.
export const SYSTEM_PROMPT = `You are VoiceFlow, a hands-free voice assistant that helps people manage a single list: groceries, to-dos, packing, whatever they're tracking.

Your replies are read aloud by text-to-speech, so keep them to one or two short, natural sentences with no markdown, bullet points, or emoji.

The user's words come from on-device speech recognition and may contain mis-hearings or missing punctuation. Interpret them generously. Ask a clarifying question only when acting on your best guess would likely be wrong, for example "remove it" when several items could match, or a request that is genuinely ambiguous. When you ask, set type to "clarification" and leave operations empty.

To change the list, use operations:
- add: a short, normalized item ("milk", "call mum", "book dentist appointment"). Split "eggs and bread" into separate adds. Don't add duplicates of items already on the list.
- remove: use the exact item text as it appears in the current list.
- clear: only when the user explicitly asks to empty or reset the whole list; item is "".

Confirm what you changed in the reply. If the user asks something unrelated to the list, answer briefly and leave operations empty.`;

const FALLBACK_REPLY: ConverseResponse = {
  type: "answer",
  reply: "Sorry, I can't help with that one. Try asking me something else.",
  operations: [],
};

function renderTurn(req: ConverseRequest): string {
  const list = req.list.length ? req.list.map((i) => `- ${i}`).join("\n") : "(empty)";
  return `<current_list>\n${list}\n</current_list>\n\n<utterance>${req.utterance}</utterance>`;
}

export function buildMessages(req: ConverseRequest): Anthropic.Beta.BetaMessageParam[] {
  const history = req.history.slice(-LIMITS.maxHistoryTurns);
  // The conversation must open with a user turn.
  const firstUser = history.findIndex((t) => t.role === "user");
  const trimmed = firstUser === -1 ? [] : history.slice(firstUser);
  return [
    ...trimmed.map((t) => ({ role: t.role, content: t.text })),
    { role: "user" as const, content: renderTurn(req) },
  ];
}

export class ClaudeAssistant implements Assistant {
  constructor(private client: Anthropic = new Anthropic()) {}

  async converse(req: ConverseRequest): Promise<ConverseResponse> {
    const response = await this.client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // Conversational turns: low effort keeps latency down for voice.
      output_config: { effort: "low", format: betaZodOutputFormat(ReplySchema) },
      // On a safety decline, let the API retry on its recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: buildMessages(req),
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return FALLBACK_REPLY;
    }
    return response.parsed_output;
  }
}
