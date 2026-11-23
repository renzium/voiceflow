/**
 * Wire contract shared by the Expo app and the Node backend.
 * Plain types only (no runtime deps) so Metro and Node can both import it.
 */

export type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

export type ListOperation = {
  action: "add" | "remove" | "clear";
  /** Item text. Empty string for "clear". */
  item: string;
};

export type ConverseRequest = {
  /** Previous turns, oldest first. The server trims to the most recent turns. */
  history: ChatTurn[];
  /** What the user just said (final speech-recognition transcript). */
  utterance: string;
  /** The user's current list, so the assistant can reason about it. */
  list: string[];
};

export type ConverseResponse = {
  /** "clarification" means the assistant needs more info before acting. */
  type: "answer" | "clarification";
  /** Short, speakable reply. */
  reply: string;
  /** Changes to apply to the list, in order. */
  operations: ListOperation[];
};

export type ConverseError = {
  error: { code: "BAD_REQUEST" | "RATE_LIMITED" | "UPSTREAM" | "INTERNAL"; message: string };
};

export const LIMITS = {
  maxHistoryTurns: 20,
  maxUtteranceChars: 1000,
  maxListItems: 100,
  maxItemChars: 120,
} as const;
