export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function VerifyCertificatePage({ params }: { params: { hash: string } }) {
  const certificate = await prisma.certificate.findUnique({
    where: { verificationHash: params.hash },
    include: { user: true, course: true },
  });

  if (!certificate) {
    return <p className="text-center py-20">Certificado não encontrado. Verifique o código informado.</p>;
  }

  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <h1 className="text-2xl font-bold text-green-600">✓ Certificado Válido</h1>
      <p className="mt-4">
        <strong>{certificate.user.name}</strong> concluiu o curso <strong>{certificate.course.title}</strong>
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Emitido em {certificate.issuedAt.toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}
