import type { ProcessVoiceInput, ProcessVoiceResult, VoiceApi } from "../types";
import Constants from "expo-constants";

type StubOptions = {
  delayMs?: number;
  scenario?: "success" | "clarify" | "networkError" | "serverError";
};

export class StubVoiceApi implements VoiceApi {
  private delayMs: number;
  private scenario: NonNullable<StubOptions["scenario"]>;
  private successCount = 0;
  private clarifyCount = 0;

  constructor(opts?: StubOptions) {
    this.delayMs = opts?.delayMs ?? 1000;
    this.scenario = opts?.scenario ?? "success";
  }

  setScenario(s: StubOptions["scenario"]) {
    if (s) this.scenario = s;
  }

  async processVoice(_input: ProcessVoiceInput): Promise<ProcessVoiceResult> {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, this.delayMs));

    // Resolve asset URIs for audiofile1 and audiofile2 in assets directory
    // In Expo, require() returns a module number; use Asset.fromModule at callsite if needed.
    const audio1 = require("../../assets/audio/audiofile1.mp3");
    const audio2 = require("../../assets/audio/audiofile2.mp3");

    switch (this.scenario) {
      case "networkError":
        throw { kind: "error", code: "NETWORK", message: "Network error. Please try again." } as const;
      case "serverError":
        throw { kind: "error", code: "SERVER", message: "Something went wrong. Please try again." } as const;
      case "clarify": {
        // Always acknowledge setting the time to 7 PM; alternate audio files per turn within clarify scenario
        const useFirst = this.clarifyCount % 2 === 0;
        this.clarifyCount++;
        return { kind: "ok", audioUri: String(useFirst ? audio1 : audio2), transcript: "Okay, I will set it for 7 PM." };
      }
      case "success":
      default: {
        // Success scenario alternates audio and transcripts per success turn only
        const useFirst = this.successCount % 2 === 0;
        this.successCount++;
        return {
          kind: "ok",
          audioUri: String(useFirst ? audio1 : audio2),
          transcript: useFirst
            ? "Added ‘milk’ to your shopping list."
            : "Also added ‘bread’.",
        };
      }
    }
  }
}

export function createVoiceApi(): StubVoiceApi {
  const defaults: StubOptions = {
    delayMs: 1000,
    scenario: "success",
  };
  return new StubVoiceApi(defaults);
}

