import type { ConverseResponse } from "../../shared/contract";

export type Phase =
  | { kind: "Idle" }
  | { kind: "Listening"; startedAtMs: number; partial: string }
  | { kind: "Thinking"; utterance: string }
  | { kind: "Speaking"; text: string }
  | { kind: "Error"; message: string };

export type TranscriptItem = {
  id: string;
  role: "user" | "assistant" | "clarification";
  text: string;
};

export type VoiceState = {
  phase: Phase;
  transcript: TranscriptItem[];
  list: string[];
};

export type VoiceEvent =
  | { type: "LISTEN_START"; now: number }
  | { type: "PARTIAL"; text: string }
  | { type: "LISTEN_END"; text: string; id: string }
  | { type: "CANCEL" }
  | { type: "REPLY"; response: ConverseResponse; id: string }
  | { type: "SPEAK_DONE" }
  | { type: "FAIL"; message: string }
  | { type: "DISMISS" }
  | { type: "RESET" };

/** Dev-only scenarios for the offline demo assistant. */
export type Scenario = "success" | "clarify" | "networkError" | "serverError";
