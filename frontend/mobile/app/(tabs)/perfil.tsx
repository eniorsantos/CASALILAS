import { Linking, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from "react-native";
import { useState } from "react";
import { Screen } from "../../src/components/Screen";
import { useSession } from "../../src/auth/SessionProvider";
import { useMyCertificates, usePlans } from "../../src/api/queries";
import { webUrl, api } from "../../src/api/client";
import { registerForPush } from "../../src/push/notifications";
import { colors, typography } from "../../src/theme/tokens";

/** Perfil: conta, assinatura, certificados, configurações (inventário §3). */
export default function ProfileScreen() {
  const { user, signOut } = useSession();
  const { data: certificates } = useMyCertificates();
  const { data: plans } = usePlans();
  const [notify, setNotify] = useState(true);

  async function onToggleNotify(value: boolean) {
    setNotify(value);
    // Liga: registra o device e envia o token ao backend (disparo via BullMQ).
    // Desliga: só local (o token segue válido p/ comunicações críticas).
    if (value) {
      const pushToken = await registerForPush().catch(() => null);
      if (pushToken) {
        await api
          .post("/api/mobile/push-token", { token: pushToken, platform: "mobile" })
          .catch(() => {});
      }
    }
  }

  return (
    <Screen>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionLabel}>Assinatura</Text>
        <View style={styles.list}>
          {(plans ?? []).map((p) => (
            <View key={p.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{p.name}</Text>
                <Text style={styles.itemSub}>
                  R$ {(p.priceCents / 100).toFixed(2).replace(".", ",")}/
                  {p.interval === "MONTHLY" ? "mês" : "ano"}
                </Text>
              </View>
            </View>
          ))}
          {(plans ?? []).length === 0 && (
            <Text style={styles.itemSub}>Nenhum plano disponível.</Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>Certificados ({certificates?.length ?? 0})</Text>
        <View style={styles.list}>
          {(certificates ?? []).map((c) => (
            <Pressable
              key={c.id}
              style={styles.item}
              onPress={() => Linking.openURL(webUrl(`/certificados/verificar/${c.verificationHash}`))}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{c.courseTitle}</Text>
                <Text style={styles.itemSub}>
                  Emitido em {new Date(c.issuedAt).toLocaleDateString("pt-BR")} · tocar para verificar
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  Share.share({
                    message: `Certificado: ${c.courseTitle} — verifique em ${webUrl(`/certificados/verificar/${c.verificationHash}`)}`,
                  }).catch(() => {})
                }
              >
                <Text style={styles.share}>Compartilhar</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Configurações</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.itemName}>Notificações</Text>
          <Switch
            value={notify}
            onValueChange={(v) => void onToggleNotify(v)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>

        <Pressable style={styles.logout} onPress={signOut}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", padding: 20 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 26, color: colors.primaryWarm, fontFamily: typography.displayFamily },
  name: { color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginTop: 8, fontFamily: typography.bodyFamily },
  email: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontFamily: typography.bodyFamily },
  sectionLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.textSecondary,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
    fontWeight: "700",
    fontFamily: typography.bodyFamily,
  },
  list: { paddingHorizontal: 18 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, fontFamily: typography.bodyFamily },
  itemSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontFamily: typography.bodyFamily },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  logout: { margin: 18, padding: 14, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  logoutText: { color: colors.textSecondary, fontWeight: "600", fontFamily: typography.bodyFamily },
  share: { color: colors.primaryWarm, fontSize: 12, fontFamily: typography.bodyFamily },
});
