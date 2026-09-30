import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../theme/tokens";
import { CourseThumb } from "./CourseCard";

/** Overlay "Próxima aula" com contagem regressiva (spec §7.1, mockup). */
export function NextEpisodeOverlay({
  nextTitle,
  thumbnailUrl,
  seconds = 8,
  onPlay,
  onCancel,
}: {
  nextTitle: string;
  thumbnailUrl?: string | null;
  seconds?: number;
  onPlay: () => void;
  onCancel: () => void;
}) {
  const [countdown, setCountdown] = useState(seconds);

  useEffect(() => {
    if (countdown <= 0) {
      onPlay();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onPlay]);

  return (
    <View style={styles.box}>
      <CourseThumb uri={thumbnailUrl} size={60} />
      <View style={styles.texts}>
        <Text style={styles.label}>PRÓXIMA AULA</Text>
        <Text style={styles.title} numberOfLines={1}>
          {nextTitle}
        </Text>
        <Text style={styles.countdown}>Iniciando em {countdown}s · </Text>
        <Pressable onPress={onCancel}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  texts: { flex: 1 },
  label: { color: colors.primaryWarm, fontWeight: "700", fontSize: 10, marginBottom: 2, fontFamily: typography.bodyFamily },
  title: { color: colors.textPrimary, fontSize: 10, fontFamily: typography.bodyFamily },
  countdown: { fontSize: 9, color: colors.textSecondary, marginTop: 4, fontFamily: typography.bodyFamily },
  cancel: { fontSize: 9, color: colors.textSecondary, textDecorationLine: "underline", fontFamily: typography.bodyFamily },
});
