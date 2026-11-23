import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ErrorBanner from "./src/components/ErrorBanner";
import ListPanel from "./src/components/ListPanel";
import ListeningOverlay from "./src/components/ListeningOverlay";
import MicButton from "./src/components/MicButton";
import TranscriptList from "./src/components/TranscriptList";
import { useVoiceFlow } from "./src/hooks/useVoiceFlow";
import { colors, radius } from "./src/theme";
import type { Phase, Scenario } from "./src/types";

const STATUS: Record<Phase["kind"], string> = {
  Idle: "Ready",
  Listening: "Listening…",
  Thinking: "Thinking…",
  Speaking: "Speaking…",
  Error: "Needs attention",
};

const SCENARIOS: Scenario[] = ["success", "clarify", "networkError", "serverError"];

export default function App() {
  const vf = useVoiceFlow();
  const { phase, transcript, list } = vf.state;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <Image source={require("./assets/icon.png")} style={styles.logo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>VoiceFlow</Text>
            <Text style={styles.subtitle}>{STATUS[phase.kind]}</Text>
          </View>
          <View style={[styles.modeBadge, vf.mode === "demo" && styles.modeDemo]}>
            <Text style={[styles.modeText, vf.mode === "demo" && styles.modeDemoText]}>
              {vf.mode === "claude" ? "Claude" : "Demo"}
            </Text>
          </View>
          <Pressable onPress={vf.reset} hitSlop={10} accessibilityRole="button" accessibilityLabel="Start over">
            <Ionicons name="refresh" size={20} color={colors.muted} />
          </Pressable>
        </View>

        {vf.mode === "demo" && (
          <View style={styles.devBar}>
            {SCENARIOS.map((s) => (
              <Pressable
                key={s}
                onPress={() => vf.setScenario(s)}
                style={[styles.scenarioBtn, vf.scenario === s && styles.scenarioActive]}
              >
                <Text style={[styles.scenarioText, vf.scenario === s && styles.scenarioTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.content}>
          <ListPanel items={list} />
          {phase.kind === "Error" && <ErrorBanner message={phase.message} onDismiss={vf.dismissError} />}
          <TranscriptList items={transcript} />
        </View>

        <View style={styles.footer}>
          <MicButton phase={phase} onPress={vf.startListening} />
        </View>

        {phase.kind === "Listening" && (
          <ListeningOverlay
            startedAtMs={phase.startedAtMs}
            partial={phase.partial}
            onStop={vf.stopListening}
            onCancel={vf.cancelListening}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  logo: { width: 36, height: 36, borderRadius: 10 },
  title: { fontWeight: "800", fontSize: 17, color: colors.text },
  subtitle: { color: colors.muted, fontSize: 12 },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  modeText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  modeDemo: { backgroundColor: "#f1f5f9" },
  modeDemoText: { color: colors.muted },
  devBar: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingTop: 10, gap: 6 },
  scenarioBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: "#e2e8f0" },
  scenarioActive: { backgroundColor: colors.text },
  scenarioText: { color: colors.text, fontSize: 12 },
  scenarioTextActive: { color: "#fff" },
  content: { flex: 1, paddingTop: 12, gap: 10 },
  footer: {
    paddingTop: 14,
    paddingBottom: 10,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
