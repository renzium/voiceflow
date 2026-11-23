import type { ChatTurn, ListOperation } from "../../shared/contract";
import type { VoiceEvent, VoiceState } from "../types";

export const initialState: VoiceState = {
  phase: { kind: "Idle" },
  transcript: [],
  list: [],
};

const norm = (s: string) => s.trim().toLowerCase();

/** Apply assistant list operations. Case-insensitive, no duplicates, order preserved. */
export function applyOperations(list: string[], ops: ListOperation[]): string[] {
  let next = [...list];
  for (const op of ops) {
    const item = op.item.trim();
    if (op.action === "clear") next = [];
    else if (op.action === "add" && item && !next.some((i) => norm(i) === norm(item))) next.push(item);
    else if (op.action === "remove") next = next.filter((i) => norm(i) !== norm(item));
  }
  return next;
}

/** Transcript → conversation history for the backend. */
export function toHistory(state: VoiceState): ChatTurn[] {
  return state.transcript.map((t) => ({
    role: t.role === "user" ? "user" : "assistant",
    text: t.text,
  }));
}

/**
 * Pure state machine for the voice loop:
 * Idle → Listening → Thinking → Speaking → Idle, with Error reachable from
 * Listening/Thinking. Events that don't apply to the current phase are ignored,
 * which makes late native callbacks (e.g. a stray "end" after cancel) harmless.
 */
export function voiceReducer(state: VoiceState, event: VoiceEvent): VoiceState {
  const { phase } = state;
  switch (event.type) {
    case "LISTEN_START":
      if (phase.kind === "Listening" || phase.kind === "Thinking") return state;
      return { ...state, phase: { kind: "Listening", startedAtMs: event.now, partial: "" } };

    case "PARTIAL":
      if (phase.kind !== "Listening") return state;
      return { ...state, phase: { ...phase, partial: event.text } };

    case "LISTEN_END": {
      if (phase.kind !== "Listening") return state;
      const text = event.text.trim();
      if (!text) return { ...state, phase: { kind: "Idle" } };
      return {
        ...state,
        phase: { kind: "Thinking", utterance: text },
        transcript: [...state.transcript, { id: event.id, role: "user", text }],
      };
    }

    case "CANCEL":
      if (phase.kind !== "Listening") return state;
      return { ...state, phase: { kind: "Idle" } };

    case "REPLY": {
      if (phase.kind !== "Thinking") return state;
      const { response } = event;
      return {
        phase: { kind: "Speaking", text: response.reply },
        list: applyOperations(state.list, response.operations),
        transcript: [
          ...state.transcript,
          {
            id: event.id,
            role: response.type === "clarification" ? "clarification" : "assistant",
            text: response.reply,
          },
        ],
      };
    }

    case "SPEAK_DONE":
      if (phase.kind !== "Speaking") return state;
      return { ...state, phase: { kind: "Idle" } };

    case "FAIL":
      if (phase.kind !== "Listening" && phase.kind !== "Thinking") return state;
      return { ...state, phase: { kind: "Error", message: event.message } };

    case "DISMISS":
      if (phase.kind !== "Error") return state;
      return { ...state, phase: { kind: "Idle" } };

    case "RESET":
      return initialState;
  }
}
