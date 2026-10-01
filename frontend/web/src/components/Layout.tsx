import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/cursos", label: "Cursos" },
  { to: "/alunos", label: "Alunos" },
  { to: "/planos", label: "Planos" },
];

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen bg-st-bg text-st-text">
      <aside className="flex w-56 shrink-0 flex-col border-r border-st-border bg-st-surface">
        <h2 className="p-4 font-display text-2xl tracking-wide">PAINEL</h2>
        <nav className="flex-1 space-y-1 px-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? "bg-st-accent/20 font-medium text-st-accent-warm"
                    : "text-st-dim hover:bg-st-surface-2"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-sm text-st-dim">
          <p>{user?.name ?? user?.email}</p>
          <button onClick={logout} className="underline hover:text-st-text">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
