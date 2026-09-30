import { certificateQueue } from "../queues";

export async function queueCertificateCheck(userId: string, courseId: string) {
  await certificateQueue.add(
    "check-and-issue",
    { userId, courseId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
      jobId: `cert-${userId}-${courseId}`,
    }
  );
}
