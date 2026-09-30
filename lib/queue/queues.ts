import { Queue } from "bullmq";
import { connection } from "./connection";

export const emailQueue = new Queue("email", { connection });
export const certificateQueue = new Queue("certificate", { connection });
export const videoQueue = new Queue("video-processing", { connection });
export const pushQueue = new Queue("push", { connection });
