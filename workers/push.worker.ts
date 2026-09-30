import { Worker } from "bullmq";
import { connection } from "@/lib/queue/connection";
import { prisma } from "@/lib/prisma";

interface PushJob {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Dispara push via Expo Push API p/ todos os devices do usuário. */
export const pushWorker = new Worker(
  "push",
  async (job) => {
    const { userId, title, body, data } = job.data as PushJob;
    const tokens = await prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        tokens.map((t) => ({ to: t.token, title, body, data: data ?? {} }))
      ),
    });
    if (!res.ok) {
      throw new Error(`Expo Push falhou: HTTP ${res.status}`);
    }
  },
  { connection, concurrency: 10 }
);

pushWorker.on("failed", async (job, err) => {
  console.error(`Push job ${job?.id} falhou:`, err.message);
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await prisma.failedJob.create({
      data: {
        queueName: "push",
        jobName: job.name,
        payload: JSON.stringify(job.data),
        error: err.message,
      },
    });
  }
});
