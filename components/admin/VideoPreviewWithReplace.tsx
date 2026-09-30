"use client";

import { useState } from "react";
import { VideoUploader } from "@/app/(admin)/admin/cursos/[id]/aulas/[lessonId]/VideoUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Mostra o estado do vídeo com opção de substituir (seção 6.3). */
export function VideoPreviewWithReplace({ lessonId }: { lessonId: string }) {
  const [replacing, setReplacing] = useState(false);

  if (replacing) return <VideoUploader lessonId={lessonId} />;

  return (
    <div className="rounded-lg border border-adminBorder bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="success">Vídeo anexado</Badge>
        <span className="text-xs text-textSecondary">
          O processamento é feito pelo Mux; a troca leva alguns minutos.
        </span>
      </div>
      <Button size="sm" variant="outline" onClick={() => setReplacing(true)}>
        Substituir vídeo
      </Button>
    </div>
  );
}
