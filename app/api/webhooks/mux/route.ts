import { videoQueue } from "@/lib/queue/queues";

export async function POST(req: Request) {
  const event = await req.json();
  await videoQueue.add("mux-event", event, { attempts: 5 });
  return new Response("ok", { status: 200 });
}
