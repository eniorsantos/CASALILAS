import { Worker } from "bullmq";
import { connection } from "@/lib/queue/connection";
import { issueCertificateIfEligible } from "@/lib/certificates";
import { emailQueue } from "@/lib/queue/queues";

export const certificateWorker = new Worker(
  "certificate",
  async (job) => {
    const { userId, courseId } = job.data as { userId: string; courseId: string };
    const certificate = await issueCertificateIfEligible(userId, courseId);
    if (certificate) {
      await emailQueue.add("certificate-issued-email", { userId, courseId });
    }
  },
  { connection, concurrency: 3 }
);
