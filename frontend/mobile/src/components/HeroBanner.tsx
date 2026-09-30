import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography } from "../theme/tokens";

export type HeroCourse = {
  title: string;
  bannerUrl: string;
  description: string;
  meta: string;
};

/** Hero de 300px do mockup: badge EM ALTA + título Bebas + Assistir/Detalhes. */
export function HeroBanner({
  course,
  onPlay,
  onDetails,
}: {
  course: HeroCourse;
  onPlay: () => void;
  onDetails: () => void;
}) {
  return (
    <ImageBackground source={{ uri: course.bannerUrl }} style={styles.hero}>
      <View style={styles.heroFallback} />
      <LinearGradient
        colors={["transparent", "rgba(30,24,48,0.8)", colors.background]}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EM ALTA</Text>
        </View>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.meta}>{course.meta}</Text>
        <View style={styles.buttons}>
          <Pressable onPress={onPlay} style={styles.primary}>
            <Text style={styles.primaryText}>▶ Assistir</Text>
          </Pressable>
          <Pressable onPress={onDetails} style={styles.secondary}>
            <Text style={styles.secondaryText}>ⓘ Detalhes</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: { height: 300, justifyContent: "flex-end" },
  heroFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: "#4A2E7A" },
  gradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 220 },
  content: { padding: 18, gap: 0 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryWarm,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginBottom: 8,
  },
  badgeText: { color: "#2A2033", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  title: {
    color: colors.textPrimary,
    fontSize: typography.hero.size,
    fontFamily: typography.displayFamily,
    lineHeight: 30,
    marginBottom: 6,
  },
  meta: { color: colors.textSecondary, fontSize: 11, marginBottom: 14, fontFamily: typography.bodyFamily },
  buttons: { flexDirection: "row", gap: 8 },
  primary: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 3,
  },
  primaryText: { color: colors.onLightButton, fontSize: 12, fontWeight: "700", fontFamily: typography.bodyFamily },
  secondary: {
    backgroundColor: "rgba(120,120,128,0.4)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 3,
  },
  secondaryText: { color: colors.textPrimary, fontSize: 12, fontWeight: "700", fontFamily: typography.bodyFamily },
});
