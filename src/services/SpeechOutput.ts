import * as Speech from "expo-speech";

/** Text-to-speech using the device's built-in voices. Resolves when speech ends or is stopped. */
export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: "en-US",
      rate: 1.0,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking() {
  Speech.stop();
}
