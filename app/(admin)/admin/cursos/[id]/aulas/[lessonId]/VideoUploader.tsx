"use client";
import { useState } from "react";
import * as UpChunk from "@mux/upchunk";

export function VideoUploader({ lessonId }: { lessonId: string }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "ready">("idle");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    const res = await fetch(`/api/admin/lessons/${lessonId}/upload`, { method: "POST" });
    const { uploadUrl } = await res.json();
    const upload = UpChunk.createUpload({ endpoint: uploadUrl, file, chunkSize: 5120 });
    upload.on("progress", (ev) => setProgress(Math.round((ev as CustomEvent).detail as number)));
    upload.on("success", () => setStatus("processing"));
    upload.on("error", (err) => {
      console.error(err);
      setStatus("idle");
    });
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center">
      {status === "idle" && <input type="file" accept="video/*" onChange={handleFileChange} />}
      {status === "uploading" && <p>Enviando... {progress}%</p>}
      {status === "processing" && <p>Vídeo enviado! Processando no servidor...</p>}
      {status === "ready" && <p className="text-green-600">✓ Vídeo pronto</p>}
    </div>
  );
}
