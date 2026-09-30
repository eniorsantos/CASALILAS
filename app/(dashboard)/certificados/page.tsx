export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CertificatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const certs = await prisma.certificate.findMany({
    where: { userId: (user as { id: string }).id },
    include: { course: true },
  });
  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold">Meus certificados</h1>
      <ul className="mt-4 space-y-2">
        {certs.map((c) => (
          <li key={c.id} className="border rounded p-3 bg-white">
            {c.course.title} — <a className="underline" href={`/certificados/verificar/${c.verificationHash}`}>verificar</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
