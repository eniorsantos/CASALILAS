"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Título editável inline (módulos e aulas). */
export function EditableTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (title: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button
        className="font-medium text-textPrimary hover:text-accent text-left"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </button>
    );
  }

  return (
    <Input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={async () => {
        setEditing(false);
        if (draft.trim() && draft !== value) await onSave(draft.trim());
      }}
      onKeyDown={async (e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
      }}
      className="max-w-xs"
    />
  );
}
