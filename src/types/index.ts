export type AppState =
  | { kind: "Idle" }
  | { kind: "Listening"; startedAtMs: number }
  | { kind: "Processing" }
  | { kind: "Playing"; uri: string }
  | { kind: "Clarification"; prompt: string }
  | { kind: "Error"; message: string };

export type Scenario = "success" | "clarify" | "networkError" | "serverError";

export type ProcessVoiceInput = {
  audioUri: string;
  mimeType: string;
  clientTs: string;
  context?: Record<string, unknown>;
};

export type ProcessVoiceResult =
  | {
      kind: "ok";
      // Local asset or file URI to play back
      audioUri: string;
      transcript?: string;
    }
  | {
      kind: "clarification";
      prompt: string;
    };

export type ProcessVoiceError = {
  kind: "error";
  code: "NETWORK" | "SERVER";
  message: string;
};

export interface VoiceApi {
  processVoice(input: ProcessVoiceInput): Promise<ProcessVoiceResult>;
}

