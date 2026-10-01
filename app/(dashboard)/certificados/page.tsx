export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentNav } from "@/components/streaming";

export default async function CertificatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const certs = await prisma.certificate.findMany({
    where: { userId: (user as { id: string }).id },
    include: { course: true },
  });
  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <StudentNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <h1 className="font-display text-3xl tracking-wide">MEUS CERTIFICADOS</h1>
        <ul className="mt-4 space-y-2">
          {certs.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-st-border bg-st-surface p-3 text-sm text-st-text"
            >
              {c.course.title} —{" "}
              <a
                className="text-st-accent-warm underline"
                href={`/certificados/verificar/${c.verificationHash}`}
              >
                verificar
              </a>
            </li>
          ))}
        </ul>
        {certs.length === 0 && (
          <p className="mt-4 text-sm text-st-dim">
            Conclua um curso para ganhar seu primeiro certificado.
          </p>
        )}
      </main>
    </div>
  );
}
