import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { emailQueue, certificateQueue, videoQueue, pushQueue } from "@/lib/queue/queues";

const app = express();
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue as never) as never,
    new BullMQAdapter(certificateQueue as never) as never,
    new BullMQAdapter(videoQueue as never) as never,
    new BullMQAdapter(pushQueue as never) as never,
  ],
  serverAdapter,
});

// TODO: proteger com basic auth / sessão de admin antes de expor em produção
app.use("/admin/queues", serverAdapter.getRouter());
app.listen(3001, () => console.log("Bull Board em http://localhost:3001/admin/queues"));
