"use client";

import { useState } from "react";
import { VideoUploader } from "@/app/(admin)/admin/cursos/[id]/aulas/[lessonId]/VideoUploader";
import { VideoPreviewWithReplace } from "@/components/admin/VideoPreviewWithReplace";
import { EditableTitle } from "@/components/admin/EditableTitle";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { handleAction } from "@/lib/admin/action-feedback";
import {
  updateLessonTitle,
  toggleFreePreview,
} from "@/app/(admin)/admin/cursos/[id]/actions";

export function LessonEditorForm({
  lesson,
}: {
  lesson: { id: string; title: string; videoAssetId: string | null; isFreePreview: boolean };
}) {
  const [freePreview, setFreePreview] = useState(lesson.isFreePreview);

  return (
    <div className="space-y-6">
      <div>
        <Label>Título da aula</Label>
        <div className="mt-1">
          <EditableTitle value={lesson.title} onSave={(title) => updateLessonTitle(lesson.id, title)} />
        </div>
      </div>

      <div>
        <Label>Vídeo</Label>
        <div className="mt-1">
          {lesson.videoAssetId ? (
            <VideoPreviewWithReplace lessonId={lesson.id} />
          ) : (
            <VideoUploader lessonId={lesson.id} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={freePreview}
          onCheckedChange={(v) => {
            setFreePreview(v);
            handleAction(() => toggleFreePreview(lesson.id, v), "Preview atualizado");
          }}
        />
        <Label>Disponibilizar como aula gratuita (preview)</Label>
      </div>
    </div>
  );
}
