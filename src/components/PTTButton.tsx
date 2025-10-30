import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onPressStart: () => void;
  disabled?: boolean;
};

export default function PTTButton({ onPressStart, disabled }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Press to talk"
        onPress={onPressStart}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : undefined,
          disabled ? styles.buttonDisabled : undefined,
        ]}
      >
        <Text style={styles.text}>Press to Talk</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 999,
  },
  buttonPressed: { backgroundColor: "#1d4ed8" },
  buttonDisabled: { backgroundColor: "#94a3b8" },
  text: { color: "white", fontSize: 16, fontWeight: "600" },
});


