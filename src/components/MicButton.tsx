import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import type { Phase } from "../types";

type Props = { phase: Phase; onPress: () => void };

const LABELS: Record<Phase["kind"], string> = {
  Idle: "Tap to talk",
  Listening: "Listening…",
  Thinking: "Thinking…",
  Speaking: "Tap to interrupt",
  Error: "Tap to try again",
};

export default function MicButton({ phase, onPress }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const speaking = phase.kind === "Speaking";

  useEffect(() => {
    if (!speaking) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [speaking, pulse]);

  const thinking = phase.kind === "Thinking";
  const bg = speaking ? colors.speaking : colors.primary;
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrap}>
        {speaking && (
          <Animated.View
            style={[styles.ring, { backgroundColor: bg, opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={LABELS[phase.kind]}
          accessibilityState={{ disabled: thinking, busy: thinking }}
          onPress={onPress}
          disabled={thinking}
          style={({ pressed }) => [styles.button, { backgroundColor: bg }, pressed && styles.pressed, thinking && styles.disabled]}
        >
          {thinking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name={speaking ? "volume-high" : "mic"} size={30} color="#fff" />
          )}
        </Pressable>
      </View>
      <Text style={styles.label}>{LABELS[phase.kind]}</Text>
    </View>
  );
}

const SIZE = 72;
const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 8 },
  buttonWrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pressed: { transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.7 },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
});
