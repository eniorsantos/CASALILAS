import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import type { ComponentProps } from "react";
import { colors, typography } from "../theme/tokens";

export function AuthInput(props: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      style={styles.input}
      {...props}
    />
  );
}

export function AuthButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function AuthError({ message }: { message: string }) {
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    fontFamily: typography.bodyFamily,
  },
  button: { backgroundColor: colors.primary, borderRadius: 4, padding: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 14, fontFamily: typography.bodyFamily },
  error: { color: "#E5484D", marginBottom: 12, fontSize: 12, fontFamily: typography.bodyFamily },
});
