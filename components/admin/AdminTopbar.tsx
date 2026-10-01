"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Moon, Search, Sun, X } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";

export function AdminTopbar({ user }: { user: { name?: string | null; role: string } }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [light, setLight] = useState(false);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
  }

  return (
    <header className="flex items-center gap-3 border-b border-adminBorder bg-surface px-6 py-3">
      <button
        className="md:hidden text-textSecondary"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Abrir menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
        <input
          placeholder="Buscar cursos, alunos…"
          className="w-full rounded-md border border-adminBorder bg-adminBg pl-9 pr-3 py-1.5 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <button className="text-textSecondary hover:text-textPrimary" aria-label="Notificações">
        <Bell size={18} />
      </button>
      <button
        className="text-textSecondary hover:text-textPrimary"
        onClick={toggleTheme}
        aria-label="Alternar tema claro"
      >
        {light ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      <Link href="/meus-cursos" className="flex items-center gap-2 text-sm text-textPrimary">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accentMuted font-semibold text-accent">
          {(user.name ?? "?").charAt(0).toUpperCase()}
        </span>
      </Link>
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute left-0 top-0 h-full bg-surface shadow-lg" onClick={(e) => e.stopPropagation()}>
            <AdminSidebar role={user.role} />
          </div>
        </div>
      )}
    </header>
  );
}
