import { Worker } from "bullmq";
import { connection } from "@/lib/queue/connection";
import { prisma } from "@/lib/prisma";

export const videoWorker = new Worker(
  "video-processing",
  async (job) => {
    const event = job.data as { type: string; data: { playback_ids?: { id: string }[]; upload_id?: string; id?: string } };
    if (event.type === "video.asset.ready") {
      const playbackId = event.data.playback_ids?.[0]?.id;
      // Guarda asset id e playback id separados (nunca sobrescreve um com o outro).
      if (playbackId && event.data.upload_id) {
        await prisma.lesson.updateMany({
          where: { videoAssetId: event.data.upload_id },
          data: { videoAssetId: event.data.id ?? undefined, playbackId },
        });
      } else if (playbackId && event.data.id) {
        await prisma.lesson.updateMany({
          where: { videoAssetId: event.data.id },
          data: { playbackId },
        });
      }
    }
    if (event.type === "video.asset.errored") {
      console.error("Falha no processamento de vídeo:", event.data.id);
    }
  },
  { connection, concurrency: 5 }
);
