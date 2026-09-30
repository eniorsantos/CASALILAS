import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "INSTRUCTOR"].includes((user as { role: string }).role)) {
    redirect("/login?callbackUrl=/admin");
  }
  const role = (user as { role: string }).role;

  return (
    <div className="flex h-screen bg-adminBg">
      <AdminSidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar user={{ name: (user as { name?: string }).name, role }} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
