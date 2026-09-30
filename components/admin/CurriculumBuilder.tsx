"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditableTitle } from "@/components/admin/EditableTitle";
import { handleAction } from "@/lib/admin/action-feedback";
import {
  reorderModules,
  createModule,
  createLesson,
  updateModuleTitle,
} from "@/app/(admin)/admin/cursos/[id]/actions";

interface LessonItem {
  id: string;
  title: string;
  type: string;
  videoAssetId: string | null;
  moduleId: string;
}

interface ModuleItem {
  id: string;
  title: string;
  lessons: LessonItem[];
}

/** Árvore de currículo com drag-and-drop (seção 6.2). */
export function CurriculumBuilder({
  courseId,
  modules: initial,
}: {
  courseId: string;
  modules: ModuleItem[];
}) {
  const router = useRouter();

  function handleModuleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = initial.findIndex((m) => m.id === active.id);
    const newIndex = initial.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(initial, oldIndex, newIndex);
    handleAction(
      () => reorderModules(courseId, reordered.map((m) => m.id)),
      "Ordem atualizada"
    ).then((ok) => ok && router.refresh());
  }

  return (
    <div className="space-y-3">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
        <SortableContext items={initial.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {initial.map((module) => (
            <ModuleAccordion key={module.id} module={module} courseId={courseId} />
          ))}
        </SortableContext>
      </DndContext>
      <Button
        variant="outline"
        onClick={() =>
          handleAction(() => createModule(courseId, "Novo módulo"), "Módulo criado").then(
            (ok) => ok && router.refresh()
          )
        }
      >
        <Plus size={14} /> Adicionar módulo
      </Button>
    </div>
  );
}

function ModuleAccordion({ module, courseId }: { module: ModuleItem; courseId: string }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: module.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border border-adminBorder rounded-lg bg-surface"
    >
      <div className="flex items-center gap-2 p-3 bg-surfaceMuted rounded-t-lg">
        <span {...attributes} {...listeners} className="cursor-grab text-textSecondary">
          <GripVertical size={16} />
        </span>
        <EditableTitle
          value={module.title}
          onSave={(title) => updateModuleTitle(module.id, title)}
        />
        <span className="ml-auto text-xs text-textSecondary">
          {module.lessons.length} aula(s)
        </span>
      </div>
      <div className="p-2 space-y-1">
        {module.lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} courseId={courseId} />
        ))}
        <button
          className="text-xs text-accent p-2 hover:underline"
          onClick={() =>
            handleAction(() => createLesson(module.id, "Nova aula", "VIDEO"), "Aula criada").then(
              (ok) => ok && router.refresh()
            )
          }
        >
          + Adicionar aula
        </button>
      </div>
    </div>
  );
}

function LessonRow({ lesson, courseId }: { lesson: LessonItem; courseId: string }) {
  return (
    <Link
      href={`/admin/cursos/${courseId}/aulas/${lesson.id}`}
      className="flex items-center gap-2 p-2 rounded hover:bg-surfaceMuted text-sm text-textPrimary"
    >
      <GripVertical size={14} className="text-textSecondary" />
      {lesson.type === "VIDEO" ? <Video size={14} /> : <FileText size={14} />}
      <span className="flex-1">{lesson.title}</span>
      <VideoStatusBadge lesson={lesson} />
    </Link>
  );
}

function VideoStatusBadge({ lesson }: { lesson: LessonItem }) {
  if (lesson.type !== "VIDEO") return null;
  if (!lesson.videoAssetId) return <Badge variant="outline">Sem vídeo</Badge>;
  return <Badge variant="success">Pronto</Badge>;
}
