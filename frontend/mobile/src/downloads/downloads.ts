import * as FileSystem from "expo-file-system";
import * as Application from "expo-application";
import { Platform } from "react-native";
import { AES, SHA256, Utf8 } from "crypto-es";
import { api } from "../api/client";

export interface DownloadMetadata {
  lessonId: string;
  lessonTitle: string;
  thumbnailUrl?: string | null;
  localUri: string;
  sizeBytes?: number | null;
  downloadedAt: string;
  expiresAt: string;
}

const DIR = `${FileSystem.documentDirectory}downloads/`;
const INDEX = `${DIR}index.json`;
const TTL_DAYS = 30;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

async function readIndex(): Promise<DownloadMetadata[]> {
  try {
    const raw = await FileSystem.readAsStringAsync(INDEX);
    return JSON.parse(raw) as DownloadMetadata[];
  } catch {
    return [];
  }
}

async function writeIndex(items: DownloadMetadata[]): Promise<void> {
  await ensureDir();
  await FileSystem.writeAsStringAsync(INDEX, JSON.stringify(items));
}

/**
 * Baixa o mp4 estático da aula p/ assistir offline (spec §8).
 * Expira em 30 dias; a validade do acesso é rechecada ao abrir o app.
 */
export async function downloadLesson(
  userId: string,
  lessonId: string,
  lessonTitle: string,
  staticRenditionUrl: string,
  thumbnailUrl?: string | null,
  onProgress?: (percent: number) => void
): Promise<DownloadMetadata> {
  await ensureDir();
  const localUri = `${DIR}${lessonId}.mp4`;
  const resumable = FileSystem.createDownloadResumable(
    staticRenditionUrl,
    localUri,
    {},
    (progress) => {
      if (progress.totalBytesExpectedToWrite > 0) {
        onProgress?.(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
      }
    }
  );
  const result = await resumable.downloadAsync();
  // Criptografa em repouso: sem a chave do device, o mp4 é ilegível.
  await encryptFile(result?.uri ?? localUri, await deriveKey(userId));
  const info = await FileSystem.getInfoAsync(result?.uri ?? localUri);

  const meta: DownloadMetadata = {
    lessonId,
    lessonTitle,
    thumbnailUrl,
    localUri: result?.uri ?? localUri,
    sizeBytes: info.exists && "size" in info ? (info.size as number) : null,
    downloadedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
  const items = (await readIndex()).filter((d) => d.lessonId !== lessonId);
  await writeIndex([...items, meta]);
  return meta;
}

export async function listDownloads(): Promise<DownloadMetadata[]> {
  const items = await readIndex();
  const now = Date.now();
  const valid = items.filter((d) => new Date(d.expiresAt).getTime() > now);
  if (valid.length !== items.length) {
    // Limpa expirados do índice (e do disco na próxima abertura).
    await writeIndex(valid);
    for (const expired of items.filter((d) => new Date(d.expiresAt).getTime() <= now)) {
      await FileSystem.deleteAsync(expired.localUri, { idempotent: true }).catch(() => {});
    }
  }
  return valid;
}

export async function removeDownload(lessonId: string): Promise<void> {
  const items = await readIndex();
  const target = items.find((d) => d.lessonId === lessonId);
  if (target) {
    await FileSystem.deleteAsync(target.localUri, { idempotent: true }).catch(() => {});
  }
  await writeIndex(items.filter((d) => d.lessonId !== lessonId));
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

/**
 * Chave AES derivada de userId + deviceId (spec §8): o mp4 não fica legível
 * copiando o arquivo do storage. NOTE: crypto-es é puro-JS — ok p/ aulas
 * típicas, mas arquivos muito grandes (>200MB) pedem lib nativa
 * (ex.: react-native-aes-crypto, fora do Expo Go).
 */
async function deriveKey(userId: string): Promise<string> {
  const deviceId =
    Platform.OS === "android"
      ? ((await Application.getAndroidId()) ?? "android")
      : ((await Application.getIosIdForVendorAsync()) ?? "ios");
  return SHA256(`${userId}:${deviceId}:plataforma-drm`).toString();
}

async function encryptFile(uri: string, key: string): Promise<void> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const encrypted = AES.encrypt(base64, key).toString();
  await FileSystem.writeAsStringAsync(uri, encrypted);
}

async function decryptToTemp(uri: string, key: string, lessonId: string): Promise<string> {
  const encrypted = await FileSystem.readAsStringAsync(uri);
  const base64 = AES.decrypt(encrypted, key).toString(Utf8);
  if (!base64) throw new Error("Falha ao decriptar — arquivo corrompido ou outro device");
  const tmp = `${FileSystem.cacheDirectory}play-${lessonId}.mp4`;
  await FileSystem.writeAsStringAsync(tmp, base64, { encoding: FileSystem.EncodingType.Base64 });
  return tmp;
}

export async function cleanupTempPlayback(lessonId: string): Promise<void> {
  await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}play-${lessonId}.mp4`, {
    idempotent: true,
  }).catch(() => {});
}

/**
 * Revalida o acesso antes de reproduzir offline: expiração local + acesso
 * no servidor (assinatura cancelada corta o offline). Requer rede; sem rede,
 * vale a expiração local de 30 dias.
 */
export async function validateOfflineAccess(
  lessonId: string
): Promise<{ ok: boolean; reason?: string }> {
  const items = await readIndex();
  const meta = items.find((d) => d.lessonId === lessonId);
  if (!meta) return { ok: false, reason: "Download não encontrado" };
  if (new Date(meta.expiresAt).getTime() <= Date.now()) {
    await removeDownload(lessonId);
    return { ok: false, reason: "Download expirado — baixe novamente" };
  }
  try {
    const access = await api.get<{ hasAccess: boolean; isFreePreview: boolean }>(
      `/api/mobile/lessons/${lessonId}/access`
    );
    if (!access.hasAccess && !access.isFreePreview) {
      await removeDownload(lessonId);
      return { ok: false, reason: "Você perdeu acesso a esta aula" };
    }
  } catch {
    // Offline total: mantém o que a expiração local permite.
  }
  return { ok: true };
}

/** Prepara o arquivo p/ reprodução offline (decripta p/ cache temporário). */
export async function prepareOfflinePlayback(
  userId: string,
  lessonId: string
): Promise<string> {
  const items = await readIndex();
  const meta = items.find((d) => d.lessonId === lessonId);
  if (!meta) throw new Error("Download não encontrado");
  const key = await deriveKey(userId);
  return decryptToTemp(meta.localUri, key, lessonId);
}
