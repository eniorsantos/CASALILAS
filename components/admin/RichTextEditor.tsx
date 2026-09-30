"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import { useEffect } from "react";

/** Editor rico básico: negrito, listas, links (seção 2 — Tiptap). */
export function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-32 rounded-md border border-adminBorder bg-surface px-3 py-2 text-sm text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) editor.commands.setContent(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-1.5 rounded hover:bg-surfaceMuted ${active ? "text-accent" : "text-textSecondary"}`;

  return (
    <div className="space-y-1">
      <div className="flex gap-1 rounded-md border border-adminBorder bg-surface p-1">
        <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Negrito">
          <Bold size={15} />
        </button>
        <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Lista">
          <List size={15} />
        </button>
        <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Lista numerada">
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("link"))}
          onClick={() => {
            const url = window.prompt("URL do link:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          aria-label="Link"
        >
          <LinkIcon size={15} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
