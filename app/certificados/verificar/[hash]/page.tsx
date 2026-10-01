export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { StudentNav } from "@/components/streaming";

export default async function VerifyCertificatePage({ params }: { params: { hash: string } }) {
  const certificate = await prisma.certificate.findUnique({
    where: { verificationHash: params.hash },
    include: { user: true, course: true },
  });

  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <StudentNav />
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        {!certificate ? (
          <p className="text-sm text-st-dim">
            Certificado não encontrado. Verifique o código informado.
          </p>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#46D369]">✓ Certificado Válido</h1>
            <p className="mt-4 text-sm text-st-text">
              <strong>{certificate.user.name}</strong> concluiu o curso{" "}
              <strong>{certificate.course.title}</strong>
            </p>
            <p className="mt-2 text-xs text-st-dim">
              Emitido em {certificate.issuedAt.toLocaleDateString("pt-BR")}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
