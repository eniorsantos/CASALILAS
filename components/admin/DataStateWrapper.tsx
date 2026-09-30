import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Estado vazio é orientação: sempre com ação direta (seção 1.3/9).
 */
export function DataStateWrapper({
  loading,
  empty,
  emptyState,
  children,
}: {
  loading: boolean;
  empty: boolean;
  emptyState: { title: string; description: string; action?: React.ReactNode };
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-surfaceMuted" />
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="text-center py-16 border border-dashed border-adminBorder rounded-lg bg-surface">
        <p className="font-medium text-textPrimary">{emptyState.title}</p>
        <p className="text-sm text-textSecondary mt-1">{emptyState.description}</p>
        {emptyState.action && <div className="mt-4">{emptyState.action}</div>}
      </div>
    );
  }

  return <>{children}</>;
}

export function EmptyActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <Button variant="accent">{label}</Button>
    </Link>
  );
}
