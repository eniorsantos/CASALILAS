export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutButton } from "@/components/CheckoutButton";

export default async function CheckoutPage({ params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) notFound();
  return (
    <main className="max-w-lg mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold">{course.title}</h1>
      <p className="mt-2">R$ {(course.priceCents / 100).toFixed(2)}</p>
      <div className="mt-6">
        <CheckoutButton courseId={course.id} />
      </div>
    </main>
  );
}
