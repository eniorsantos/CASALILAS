import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "../../src/auth/SessionProvider";
import { cleanupTempPlayback, downloadLesson } from "../../src/downloads/downloads";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "../../src/components/Screen";
import { NextEpisodeOverlay } from "../../src/components/NextEpisodeOverlay";
import { api } from "../../src/api/client";
import { FRESH_QUERY } from "../../src/query/query-client";
import { colors, typography } from "../../src/theme/tokens";

/**
 * Tela 3 do mockup: player nativo (expo-av, o hls.js não roda no RN)
 * com a mesma URL assinada do backend + overlay "próxima aula".
 */
const RATE_KEY = "plataforma.playback_rate";
const RATES = [1, 1.25, 1.5, 2, 0.75];

export default function PlayerScreen() {
  const { lessonId, localUri, title, thumbnail } = useLocalSearchParams<{
    lessonId: string;
    localUri?: string;
    title?: string;
    thumbnail?: string;
  }>();
  const router = useRouter();
  const { user } = useSession();
  const videoRef = useRef<Video>(null);
  const [showNext, setShowNext] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [downloading, setDownloading] = useState(false);

  // Offline (download): usa o arquivo local, sem buscar URL assinada.
  const offline = typeof localUri === "string" && localUri.length > 0;

  // Limpa o temporário decriptado ao sair do player offline.
  useEffect(() => {
    return () => {
      if (typeof lessonId === "string") void cleanupTempPlayback(lessonId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDownload() {
    if (!user || downloading) return;
    setDownloading(true);
    try {
      const data = await api.get<{ url: string }>(`/api/mobile/lessons/${lessonId}/download-url`);
      await downloadLesson(
        user.id,
        lessonId,
        typeof title === "string" ? title : lessonId,
        data.url,
        typeof thumbnail === "string" ? thumbnail : null,
        () => {}
      );
      Alert.alert("Download concluído", "A aula está disponível em Downloads por 30 dias.");
    } catch (e) {
      Alert.alert("Download indisponível", e instanceof Error ? e.message : "Tente mais tarde.");
    } finally {
      setDownloading(false);
    }
  }

  // Landscape enquanto assiste; restaura retrato ao sair.
  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // Velocidade persistida no device.
  useEffect(() => {
    SecureStore.getItemAsync(RATE_KEY)
      .then((v) => {
        const n = Number(v);
        if (RATES.includes(n)) setRate(n);
      })
      .catch(() => {});
  }, []);

  async function cycleRate() {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    await SecureStore.setItemAsync(RATE_KEY, String(next)).catch(() => {});
    await videoRef.current?.setRateAsync(next, true).catch(() => {});
  }

  const { data, isLoading } = useQuery({
    queryKey: ["playback", lessonId],
    queryFn: () => api.get<{ url: string }>(`/api/lessons/${lessonId}/playback-url`),
    ...FRESH_QUERY,
    enabled: !offline,
  });

  // Próxima aula na ordem do curso (auto-play de verdade).
  const { data: nextLesson } = useQuery({
    queryKey: ["next-lesson", lessonId],
    queryFn: () =>
      api.get<{ id: string; title: string } | null>(`/api/mobile/lessons/${lessonId}/next`),
    ...FRESH_QUERY,
    enabled: !offline,
  });

  // Heartbeat de progresso a cada 15s (igual ao player web).
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await videoRef.current?.getStatusAsync().catch(() => null);
      if (status && "positionMillis" in status && status.isLoaded && !status.didJustFinish) {
        await api
          .post(`/api/lessons/${lessonId}/progress`, {
            watchedSeconds: Math.floor((status.positionMillis ?? 0) / 1000),
          })
          .catch(() => {});
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [lessonId]);

  function onStatus(status: AVPlaybackStatus) {
    if (!status.isLoaded || !("durationMillis" in status)) return;
    const remaining = (status.durationMillis ?? 0) - (status.positionMillis ?? 0);
    // Últimos 15s: mostra overlay estilo "próximo episódio".
    setShowNext((status.durationMillis ?? 0) > 0 && remaining < 15000 && !status.didJustFinish);
  }

  if (isLoading || (!data && !offline)) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const sourceUri = offline ? (localUri as string) : data!.url;

  return (
    <Screen>
      <View style={styles.videoWrap}>
        <Video
          ref={videoRef}
          source={{ uri: sourceUri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          shouldPlay={!paused}
          rate={rate}
          onPlaybackStatusUpdate={onStatus}
        />
        <Pressable style={styles.tapZone} onPress={() => setPaused((p) => !p)}>
          {paused && <Text style={styles.playIcon}>▶</Text>}
        </Pressable>
        <Pressable style={styles.rateButton} onPress={cycleRate}>
          <Text style={styles.rateText}>{rate}x</Text>
        </Pressable>
        {!offline && (
          <Pressable style={styles.dlButton} onPress={onDownload} disabled={downloading}>
            <Text style={styles.rateText}>{downloading ? "…" : "⬇"}</Text>
          </Pressable>
        )}
        <View style={styles.progressBar}>
          <PlayerProgress videoRef={videoRef} />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.lessonTitle}>Assistindo agora</Text>
        {showNext && nextLesson && (
          <NextEpisodeOverlay
            nextTitle={nextLesson.title}
            seconds={8}
            onPlay={() => {
              setShowNext(false);
              router.replace({
                pathname: "/player/[lessonId]",
                params: { lessonId: nextLesson.id },
              });
            }}
            onCancel={() => setShowNext(false)}
          />
        )}
      </View>
    </Screen>
  );
}

function PlayerProgress({ videoRef }: { videoRef: RefObject<Video | null> }) {
  const [, force] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await videoRef.current?.getStatusAsync().catch(() => null);
      if (status && "positionMillis" in status && status.isLoaded && status.durationMillis) {
        setPct((status.positionMillis ?? 0) / status.durationMillis);
        force((n) => n + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  videoWrap: { height: 220, backgroundColor: "#000", position: "relative" },
  video: { width: "100%", height: "100%" },
  tapZone: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  playIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    color: "#fff",
    textAlign: "center",
    lineHeight: 48,
    fontSize: 18,
  },
  progressBar: { position: "absolute", bottom: 14, left: 14, right: 14 },
  rateButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  dlButton: {
    position: "absolute",
    top: 10,
    right: 56,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  rateText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  track: { height: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 },
  fill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  info: { padding: 18 },
  lessonTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 16, fontFamily: typography.bodyFamily },
});
