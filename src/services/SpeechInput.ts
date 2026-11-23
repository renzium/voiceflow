import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

/** Thin wrapper over on-device speech recognition so the hook stays declarative. */
export const speechInput = {
  async ensurePermission(): Promise<boolean> {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted;
  },

  start() {
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      addsPunctuation: true,
      // Short app-specific phrases improve recognition accuracy.
      contextualStrings: ["add", "remove", "clear my list", "what's on my list"],
    });
  },

  /** Stop listening and emit a final result. */
  stop() {
    ExpoSpeechRecognitionModule.stop();
  },

  /** Stop listening and discard the result. */
  abort() {
    ExpoSpeechRecognitionModule.abort();
  },
};

/** Human-friendly messages for recognizer error codes. */
export function describeSpeechError(code: string): string | null {
  switch (code) {
    case "aborted":
      return null; // user cancelled
    case "no-speech":
    case "speech-timeout":
      return "I didn't catch that. Tap the mic and try again.";
    case "not-allowed":
      return "Microphone or speech permission is off. Enable it in Settings to talk to VoiceFlow.";
    case "service-not-allowed":
    case "language-not-supported":
      return "Speech recognition isn't available on this device.";
    case "network":
      return "Speech recognition needs a connection on this device. Check your network.";
    case "busy":
      return "The microphone is busy. Try again in a moment.";
    default:
      return "Something went wrong while listening. Please try again.";
  }
}
