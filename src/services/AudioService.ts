import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";

export type RecordingSession = {
  stopAndGetUri: () => Promise<string>;
  cancel: () => Promise<void>;
};

export class AudioService {
  private activeRecording: Audio.Recording | null = null;

  // Recording mode aims to capture mic input reliably
  async ensureRecordingMode() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
  }

  // Playback mode aims for loud speaker output by default
  async ensurePlaybackMode() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false, // route to speaker on Android
      staysActiveInBackground: false,
    });
  }

  async requestMicrophonePermission(): Promise<boolean> {
    // Support both legacy and new expo-audio permission APIs
    const anyAudio: any = Audio as any;
    if (typeof anyAudio.requestPermissionsAsync === 'function') {
      const perm = await anyAudio.requestPermissionsAsync();
      return perm.status === 'granted';
    }
    if (typeof anyAudio.requestRecordingPermissionsAsync === 'function') {
      const perm = await anyAudio.requestRecordingPermissionsAsync();
      return perm.status === 'granted';
    }
    // If no API is present, assume not granted
    return false;
  }

  async startRecording(): Promise<RecordingSession> {
    const granted = await this.requestMicrophonePermission();
    if (!granted) throw new Error("Microphone permission not granted");
    await this.ensureRecordingMode();

    // Clean any previous incomplete recording
    if (this.activeRecording) {
      try {
        await this.activeRecording.stopAndUnloadAsync();
      } catch {}
      this.activeRecording = null;
    }

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    this.activeRecording = recording;

    return {
      stopAndGetUri: async () => {
        if (!this.activeRecording) throw new Error("No active recording");
        try {
          await this.activeRecording.stopAndUnloadAsync();
        } catch {}
        const uri = this.activeRecording.getURI();
        this.activeRecording = null;
        if (!uri) throw new Error("Failed to get recording URI");

        // Move to cache with a predictable name
        const target = `${FileSystem.cacheDirectory}recording_${Date.now()}.m4a`;
        await FileSystem.copyAsync({ from: uri, to: target });
        return target;
      },
      cancel: async () => {
        if (!this.activeRecording) return;
        try {
          await this.activeRecording.stopAndUnloadAsync();
        } catch {}
        this.activeRecording = null;
      },
    };
  }

  async playAudio(source: string): Promise<{ stop: () => Promise<void> }> {
    await this.ensurePlaybackMode();
    const sound = new Audio.Sound();

    let resolvedUri = source;
    // If source is not a file/content/http URL, attempt to treat it as an asset module id (from require)
    const looksLikeUrl = /^(file:|content:|https?:)/.test(source);
    if (!looksLikeUrl) {
      const modId = Number(source);
      if (!Number.isNaN(modId)) {
        const asset = Asset.fromModule(modId);
        await asset.downloadAsync();
        resolvedUri = asset.localUri ?? asset.uri;
      }
    }

    await sound.loadAsync({ uri: resolvedUri }, { shouldPlay: true });
    return {
      stop: async () => {
        try {
          await sound.stopAsync();
        } finally {
          await sound.unloadAsync();
        }
      },
    };
  }

  async cleanupOldCacheFiles(olderThanMs = 24 * 60 * 60 * 1000) {
    try {
      const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!dir) return;
      const now = Date.now();
      const entries = await FileSystem.readDirectoryAsync(dir);
      await Promise.all(
        entries
          .filter((name) => name.startsWith("recording_") && name.endsWith(".m4a"))
          .map(async (name) => {
            const info = await FileSystem.getInfoAsync(dir + name);
            if (info.exists && info.modificationTime) {
              const age = now - info.modificationTime * 1000;
              if (age > olderThanMs) {
                await FileSystem.deleteAsync(dir + name, { idempotent: true });
              }
            }
          })
      );
    } catch {}
  }
}

export const audioService = new AudioService();

