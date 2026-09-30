export const dynamic = "force-dynamic";

import Link from "next/link";
import { getLessonWithStatus } from "@/lib/admin/queries";
import { LessonEditorForm } from "@/components/admin/LessonEditorForm";

export default async function LessonEditorPage({
  params,
}: {
  params: { id: string; lessonId: string };
}) {
  const lesson = await getLessonWithStatus(params.lessonId);

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/cursos/${params.id}`}
        className="text-sm text-accent hover:underline"
      >
        ← Voltar ao curso
      </Link>
      <h1 className="text-lg font-bold text-textPrimary mt-2 mb-4">{lesson.title}</h1>
      <LessonEditorForm
        lesson={{
          id: lesson.id,
          title: lesson.title,
          videoAssetId: lesson.videoAssetId,
          isFreePreview: lesson.isFreePreview,
        }}
      />
    </div>
  );
}
