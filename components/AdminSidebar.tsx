"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  DollarSign,
  Package,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN", "INSTRUCTOR"] },
  { label: "Cursos", href: "/admin/cursos", icon: BookOpen, roles: ["ADMIN", "INSTRUCTOR"] },
  { label: "Alunos", href: "/admin/alunos", icon: Users, roles: ["ADMIN"] },
  { label: "Financeiro", href: "/admin/financeiro", icon: DollarSign, roles: ["ADMIN"] },
  { label: "Planos", href: "/admin/planos", icon: Package, roles: ["ADMIN"] },
  { label: "Configurações", href: "/admin/config", icon: Settings, roles: ["ADMIN"] },
];

/** Sidebar filtra por role, espelhando o requireRole do backend. */
export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-60 shrink-0 border-r border-adminBorder bg-surface flex flex-col max-md:hidden">
      <div className="p-4 font-bold text-lg text-textPrimary">Painel</div>
      <nav className="flex-1 px-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1",
                active
                  ? "bg-accentMuted text-accent font-medium"
                  : "text-textSecondary hover:bg-surfaceMuted"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link href="/" className="p-4 text-sm text-textSecondary hover:underline">
        ← Ver site
      </Link>
    </aside>
  );
}
