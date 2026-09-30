"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { formatCurrency } from "@/lib/admin/format";
import { handleAction } from "@/lib/admin/action-feedback";
import { publishCourse, deleteCourse } from "@/app/(admin)/admin/cursos/actions";
import type { AdminCourseRow } from "@/lib/admin/queries";

const columns: ColumnDef<AdminCourseRow>[] = [
  {
    accessorKey: "title",
    header: "Curso",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.original.thumbnailUrl ?? "/placeholder-course.png"}
          alt=""
          className="w-10 h-7 rounded object-cover"
        />
        <span className="font-medium text-textPrimary">{row.original.title}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "priceCents",
    header: "Preço",
    cell: ({ row }) => <span className="text-textPrimary">{formatCurrency(row.original.priceCents)}</span>,
  },
  { accessorKey: "enrollmentCount", header: "Alunos" },
  {
    id: "actions",
    cell: ({ row }) => <CourseRowActions course={row.original} />,
  },
];

export function CoursesTable({ courses }: { courses: AdminCourseRow[] }) {
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const table = useReactTable({
    data: courses,
    columns,
    state: { sorting },
    onSortingChange: (updater) =>
      setSorting(typeof updater === "function" ? updater(sorting) : updater),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-adminBorder">
      <table className="w-full text-sm bg-surface">
        <thead className="bg-surfaceMuted">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="text-left px-4 py-3 font-medium text-textSecondary cursor-pointer select-none"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-adminBorder hover:bg-surfaceMuted">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-textPrimary">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CourseRowActions({ course }: { course: AdminCourseRow }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="p-1 text-textSecondary hover:text-textPrimary">
          <MoreVertical size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/admin/cursos/${course.id}`}>Editar</Link>
          </DropdownMenuItem>
          {course.status === "DRAFT" && (
            <DropdownMenuItem
              onClick={() =>
                handleAction(() => publishCourse(course.id), "Curso publicado!").then(
                  (ok) => ok && router.refresh()
                )
              }
            >
              Publicar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-danger" onClick={() => setConfirmOpen(true)}>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDeleteDialog
        itemName={course.title}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={async () => {
          const ok = await handleAction(() => deleteCourse(course.id), "Curso excluído");
          if (ok) router.refresh();
        }}
      />
    </>
  );
}

export function NewCourseButton() {
  return (
    <Link href="/admin/cursos/novo">
      <Button variant="accent">
        <Plus size={16} /> Novo curso
      </Button>
    </Link>
  );
}
