import { pushQueue } from "../queues";

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Enfileira push (renovação, curso novo, "continue de onde parou"). */
export async function queuePush({ userId, title, body, data }: PushPayload) {
  await pushQueue.add(
    "send-push",
    { userId, title, body, data },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}
