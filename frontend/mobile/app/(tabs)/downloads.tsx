import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { CourseThumb } from "../../src/components/CourseCard";
import { colors, typography } from "../../src/theme/tokens";
import { useSession } from "../../src/auth/SessionProvider";
import {
  listDownloads,
  prepareOfflinePlayback,
  removeDownload,
  formatBytes,
  validateOfflineAccess,
  type DownloadMetadata,
} from "../../src/downloads/downloads";

/** Aulas baixadas + gerenciamento de espaço (spec §8). */
export default function DownloadsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [items, setItems] = useState<DownloadMetadata[]>([]);

  async function refresh() {
    setItems(await listDownloads());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function playOffline(item: DownloadMetadata) {
    if (!user) return;
    const check = await validateOfflineAccess(item.lessonId);
    if (!check.ok) {
      Alert.alert("Indisponível", check.reason ?? "Baixe novamente.");
      await refresh();
      return;
    }
    try {
      const localUri = await prepareOfflinePlayback(user.id, item.lessonId);
      router.push({
        pathname: "/player/[lessonId]",
        params: { lessonId: item.lessonId, localUri, title: item.lessonTitle },
      });
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível abrir.");
    }
  }

  const totalBytes = items.reduce((s, d) => s + (d.sizeBytes ?? 0), 0);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Downloads</Text>
        <Text style={styles.storage}>Espaço usado: {formatBytes(totalBytes)}</Text>
        <FlatList
          data={items}
          keyExtractor={(d) => d.lessonId}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => void playOffline(item)}
            >
              <CourseThumb uri={item.thumbnailUrl} size={72} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.lessonTitle}
                </Text>
                <Text style={styles.sub}>
                  Expira em {new Date(item.expiresAt).toLocaleDateString("pt-BR")} · tocar para assistir
                </Text>
              </View>
              <Pressable
                onPress={async () => {
                  await removeDownload(item.lessonId);
                  await refresh();
                }}
              >
                <Text style={styles.remove}>Remover</Text>
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhum download ainda. Baixe aulas do player para assistir offline.
            </Text>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: "700", fontFamily: typography.bodyFamily },
  storage: { color: colors.textSecondary, fontSize: 12, marginVertical: 8, fontFamily: typography.bodyFamily },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  info: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 13, fontFamily: typography.bodyFamily },
  sub: { color: colors.textSecondary, fontSize: 11, marginTop: 2, fontFamily: typography.bodyFamily },
  remove: { color: colors.primaryWarm, fontSize: 12, fontFamily: typography.bodyFamily },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 32, lineHeight: 20, fontFamily: typography.bodyFamily },
});
