import { Link, Outlet } from "react-router-dom";
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
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <h2 className="font-bold mb-4">Painel</h2>
        <nav className="space-y-2">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="block hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 text-sm text-gray-500">
          <p>{user?.name ?? user?.email}</p>
          <button onClick={logout} className="underline">
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
