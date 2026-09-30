import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { colors, typography } from "../../src/theme/tokens";

const SLIDES = [
  { title: "Aprenda onde estiver", desc: "Cursos completos com certificado, no bolso." },
  { title: "Continue de onde parou", desc: "Seu progresso sincroniza entre web e app." },
  { title: "Baixe e assista offline", desc: "Aulas disponíveis mesmo sem internet." },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.brand}>CURSOSFLIX</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          style={styles.cta}
          onPress={() =>
            last ? router.replace("/(auth)/cadastro") : setIndex((i) => i + 1)
          }
        >
          <Text style={styles.ctaText}>{last ? "Começar agora" : "Continuar"}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.login}>Já tenho conta</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  brand: { color: colors.primary, fontSize: 30, fontFamily: typography.displayFamily, textAlign: "center", marginBottom: 32 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", textAlign: "center", fontFamily: typography.bodyFamily },
  desc: { color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 8, fontFamily: typography.bodyFamily },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  cta: { backgroundColor: colors.primary, padding: 14, borderRadius: 4, alignItems: "center" },
  ctaText: { color: colors.onPrimary, fontWeight: "700", fontSize: 14, fontFamily: typography.bodyFamily },
  login: { color: colors.textSecondary, textAlign: "center", marginTop: 16, fontSize: 12, fontFamily: typography.bodyFamily },
});
