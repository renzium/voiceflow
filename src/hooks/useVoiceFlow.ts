import { useCallback, useMemo, useRef, useState } from "react";
import { audioService } from "../services/AudioService";
import { StubVoiceApi, createVoiceApi } from "../services/VoiceApi";
import type { AppState, Scenario } from "../types";
import { analytics } from "../services/Analytics";

export function useVoiceFlow() {
  const voiceApiRef = useRef<StubVoiceApi>(createVoiceApi());
  const [scenario, setScenario] = useState<Scenario>("success");
  const [state, setState] = useState<AppState>({ kind: "Idle" });
  const [transcripts, setTranscripts] = useState<{ id: string; text: string; role: 'assistant' | 'user' }[]>(
    []
  );
  const recordingStartedAt = useRef<number | null>(null);
  const activePlayerStop = useRef<null | (() => Promise<void>)>(null);
  const activeRecording = useRef<null | { stopAndGetUri: () => Promise<string>; cancel: () => Promise<void> }>(null);
  const isFinishing = useRef(false);

  // Keep API scenario in sync
  const api = voiceApiRef.current;
  useMemo(() => api.setScenario(scenario), [api, scenario]);

  const onPressIn = useCallback(async () => {
    try {
      const session = await audioService.startRecording();
      activeRecording.current = session;
      recordingStartedAt.current = Date.now();
      analytics.log('recording_started');
      setState({ kind: "Listening", startedAtMs: Date.now() });
    } catch (e: any) {
      analytics.log('error', { where: 'startRecording', message: e?.message });
      setState({ kind: "Error", message: e?.message || "Microphone permission denied." });
    }
  }, []);

  const onCancel = useCallback(async () => {
    try {
      await activeRecording.current?.cancel();
    } finally {
      activeRecording.current = null;
      recordingStartedAt.current = null;
      setState({ kind: "Idle" });
    }
  }, []);

  const finishRecording = useCallback(async () => {
    if (isFinishing.current) return;
    isFinishing.current = true;
    if (!activeRecording.current) return;
    setState({ kind: "Processing" });
    try {
      const uri = await activeRecording.current.stopAndGetUri();
      analytics.log('recording_stopped', { uri });
      activeRecording.current = null;

      const res = await api.processVoice({
        audioUri: uri,
        mimeType: "audio/m4a",
        clientTs: new Date().toISOString(),
      });

      if (res.kind === "clarification") {
        analytics.log('api_result', { kind: 'clarification' });
        setState({ kind: "Clarification", prompt: res.prompt });
        return;
      }

      // Play audio response
      setState({ kind: "Playing", uri: res.audioUri });
      analytics.log('api_result', { kind: 'ok' });
      analytics.log('playback_started');
      const player = await audioService.playAudio(res.audioUri);
      activePlayerStop.current = player.stop;

      // Update transcript list
      if (res.transcript) {
        setTranscripts((prev) => [...prev, { id: String(Date.now()), text: res.transcript!, role: 'assistant' }]);
      }

      // Wait until playback naturally finishes – we cannot easily know, so auto-return to Idle after a delay
      // A simple heuristic: 3.5s per response file
      setTimeout(async () => {
        try {
          await activePlayerStop.current?.();
        } catch {}
        analytics.log('playback_finished');
        setState({ kind: "Idle" });
        activePlayerStop.current = null;
      }, 3500);
    } catch (e: any) {
      let msg = "Something went wrong. Please try again.";
      const code = e?.code as string | undefined;
      if (code === 'NETWORK') {
        msg = e?.message || 'Network error. Please check your connection and try again.';
      } else if (code === 'SERVER') {
        msg = e?.message || 'Server error. Please try again in a moment.';
      } else if (typeof e?.message === 'string') {
        msg = e.message;
      }
      analytics.log('error', { where: 'finishRecording', code, message: msg });
      setState({ kind: "Error", message: msg });
    } finally {
      isFinishing.current = false;
    }
  }, [api]);

  const onPressOut = finishRecording;
  const onStop = finishRecording;

  return {
    state,
    scenario,
    setScenario,
    transcripts,
    onPressIn,
    onPressOut,
    onCancel,
    onStop,
  };
}


