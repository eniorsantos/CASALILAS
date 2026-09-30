import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "../../src/components/Screen";
import { api } from "../../src/api/client";
import { openCheckoutInBrowser } from "../../src/checkout/checkout";
import { colors, typography } from "../../src/theme/tokens";

/**
 * Checkout em modal: resumo + botão que abre o navegador do sistema
 * (spec §9 — sem IAP no MVP, sem comissão da Apple).
 */
export default function CheckoutScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { data: course, isLoading } = useQuery({
    queryKey: ["checkout-course", courseId],
    queryFn: () => api.get<{ title: string; priceCents: number }>(`/api/mobile/courses/by-id/${courseId}`),
  });

  if (isLoading || !course) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.price}>R$ {(course.priceCents / 100).toFixed(2).replace(".", ",")}</Text>
        <Text style={styles.note}>
          O pagamento acontece no navegador, com Pix, boleto ou cartão. Seu acesso é
          liberado automaticamente após a confirmação.
        </Text>
        <Pressable
          style={styles.cta}
          onPress={async () => {
            await openCheckoutInBrowser(courseId);
            router.back();
          }}
        >
          <Text style={styles.ctaText}>Continuar para pagamento</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Agora não</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: "700", textAlign: "center", fontFamily: typography.bodyFamily },
  price: { color: colors.primaryWarm, fontSize: 28, fontFamily: typography.displayFamily, textAlign: "center", marginVertical: 12 },
  note: { color: colors.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24, fontFamily: typography.bodyFamily },
  cta: { backgroundColor: colors.primary, padding: 14, borderRadius: 4, alignItems: "center" },
  ctaText: { color: colors.onPrimary, fontWeight: "700", fontFamily: typography.bodyFamily },
  cancel: { color: colors.textSecondary, textAlign: "center", marginTop: 16, fontFamily: typography.bodyFamily },
});
