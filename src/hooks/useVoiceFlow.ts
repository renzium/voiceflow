import { useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { initialState, toHistory, voiceReducer } from "../core/voiceMachine";
import { analytics } from "../services/Analytics";
import { AssistantError, DemoAssistant, createAssistant } from "../services/Assistant";
import { describeSpeechError, speechInput } from "../services/SpeechInput";
import { speak, stopSpeaking } from "../services/SpeechOutput";
import type { Scenario } from "../types";

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

/**
 * Orchestrates the voice loop: on-device speech recognition → backend (Claude) →
 * on-device text-to-speech. All state transitions go through `voiceReducer`;
 * this hook only wires native events and async side effects to it.
 */
export function useVoiceFlow() {
  const [state, dispatch] = useReducer(voiceReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const assistantRef = useRef(createAssistant());
  const assistant = assistantRef.current;
  const [scenario, setScenarioState] = useState<Scenario>("success");

  // Latest recognized text for the current listening session.
  const transcriptRef = useRef("");
  // True only while a listening session may still produce an utterance.
  // Cleared on cancel/error so a trailing native "end" event is ignored.
  const sessionOpenRef = useRef(false);
  // Bumped whenever a new turn starts or the conversation resets, so replies
  // from an abandoned turn are never applied or spoken.
  const turnRef = useRef(0);

  const setScenario = useCallback(
    (s: Scenario) => {
      if (assistant instanceof DemoAssistant) assistant.scenario = s;
      setScenarioState(s);
    },
    [assistant],
  );

  const respond = useCallback(
    async (utterance: string) => {
      const snapshot = stateRef.current;
      const turn = turnRef.current;
      try {
        const response = await assistant.converse({
          history: toHistory(snapshot),
          utterance,
          list: snapshot.list,
        });
        if (turn !== turnRef.current) return;
        analytics.log("assistant_reply", { type: response.type, ops: response.operations.length });
        dispatch({ type: "REPLY", response, id: nextId("a") });
        analytics.log("speech_started");
        await speak(response.reply);
        if (turn !== turnRef.current) return;
        analytics.log("speech_finished");
        dispatch({ type: "SPEAK_DONE" });
      } catch (e) {
        if (turn !== turnRef.current) return;
        const message =
          e instanceof AssistantError ? e.message : "Something went wrong. Please try again.";
        analytics.log("error", { where: "converse", code: e instanceof AssistantError ? e.code : "UNKNOWN" });
        dispatch({ type: "FAIL", message });
      }
    },
    [assistant],
  );

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    transcriptRef.current = text;
    dispatch({ type: "PARTIAL", text });
  });

  useSpeechRecognitionEvent("end", () => {
    if (!sessionOpenRef.current) return;
    sessionOpenRef.current = false;
    const text = transcriptRef.current.trim();
    analytics.log("listen_finished", { chars: text.length });
    // Read state before dispatching: history must not include this utterance yet.
    if (text) void respond(text);
    dispatch({ type: "LISTEN_END", text, id: nextId("u") });
  });

  useSpeechRecognitionEvent("error", (event) => {
    const message = describeSpeechError(event.error);
    analytics.log("error", { where: "recognizer", code: event.error });
    if (!sessionOpenRef.current) return;
    sessionOpenRef.current = false;
    if (message) dispatch({ type: "FAIL", message });
    else dispatch({ type: "CANCEL" });
  });

  const startListening = useCallback(async () => {
    const { phase } = stateRef.current;
    if (phase.kind === "Listening" || phase.kind === "Thinking") return;
    turnRef.current += 1;
    if (phase.kind === "Speaking") {
      // Barge-in: tapping the mic while the assistant talks interrupts it.
      stopSpeaking();
      dispatch({ type: "SPEAK_DONE" });
    }
    if (phase.kind === "Error") dispatch({ type: "DISMISS" });

    if (!(await speechInput.ensurePermission())) {
      dispatch({ type: "LISTEN_START", now: Date.now() });
      dispatch({ type: "FAIL", message: describeSpeechError("not-allowed")! });
      return;
    }
    transcriptRef.current = "";
    sessionOpenRef.current = true;
    dispatch({ type: "LISTEN_START", now: Date.now() });
    analytics.log("listen_started");
    speechInput.start();
  }, []);

  const stopListening = useCallback(() => {
    speechInput.stop();
  }, []);

  const cancelListening = useCallback(() => {
    sessionOpenRef.current = false;
    speechInput.abort();
    analytics.log("listen_cancelled");
    dispatch({ type: "CANCEL" });
  }, []);

  const dismissError = useCallback(() => dispatch({ type: "DISMISS" }), []);

  const reset = useCallback(() => {
    turnRef.current += 1;
    if (sessionOpenRef.current) {
      sessionOpenRef.current = false;
      speechInput.abort();
    }
    stopSpeaking();
    dispatch({ type: "RESET" });
  }, []);

  // Stop any speech if the screen unmounts mid-sentence.
  useEffect(() => () => stopSpeaking(), []);

  return {
    state,
    mode: assistant.mode,
    scenario,
    setScenario,
    startListening,
    stopListening,
    cancelListening,
    dismissError,
    reset,
  };
}
