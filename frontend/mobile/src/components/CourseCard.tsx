import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors, typography } from "../theme/tokens";

type Props = {
  title: string;
  thumbnailUrl: string;
  progressPercent?: number; // 0–100; undefined = não iniciado
  onPress: () => void;
};

/** Card 92×130 do mockup, com barra de progresso roxa + press scale (spec §2.3). */
export function CourseCard({ title, thumbnailUrl, progressPercent, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 1.05 }], opacity: 0.9 },
      ]}
    >
      <View style={styles.thumbWrap}>
        <ImageBackground
          source={{ uri: thumbnailUrl }}
          style={styles.thumb}
          resizeMode="cover"
        >
          <View style={styles.thumbFallback} />
        </ImageBackground>
        {progressPercent !== undefined && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progressPercent}%` }]} />
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.title}>
        {title}
      </Text>
    </Pressable>
  );
}

export function CourseThumb({ uri, size = 60 }: { uri?: string | null; size?: number }) {
  if (!uri) return <View style={[styles.thumbFallback, { width: size, height: size * 0.66 }]} />;
  return <Image source={{ uri }} style={{ width: size, height: size * 0.66, borderRadius: 3 }} contentFit="cover" />;
}

const styles = StyleSheet.create({
  card: { width: 92, marginRight: 8 },
  thumbWrap: { borderRadius: 4, overflow: "hidden" },
  thumb: { width: 92, height: 130, justifyContent: "flex-end" },
  thumbFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.surfaceElevated },
  track: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  fill: { height: 3, backgroundColor: colors.primary },
  title: { color: colors.textPrimary, fontSize: 9, fontWeight: "700", marginTop: 6, lineHeight: 12, fontFamily: typography.bodyFamily },
});
