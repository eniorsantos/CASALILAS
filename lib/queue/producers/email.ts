import { emailQueue } from "../queues";

export async function queueWelcomeEmail(userId: string, courseId: string) {
  await emailQueue.add(
    "welcome-email",
    { userId, courseId },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

export async function queuePaymentFailedEmail(userId: string) {
  await emailQueue.add(
    "payment-failed-email",
    { userId },
    { attempts: 5, backoff: { type: "exponential", delay: 5000 } }
  );
}
