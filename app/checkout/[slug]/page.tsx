export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutButton } from "@/components/CheckoutButton";
import { StudentNav } from "@/components/streaming";

export default async function CheckoutPage({ params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) notFound();
  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <StudentNav />
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-lg border border-st-border bg-st-surface p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-st-accent-warm">
            Checkout
          </p>
          <h1 className="mt-1 text-2xl font-bold text-st-text">{course.title}</h1>
          <p className="mt-2 font-display text-3xl text-st-accent-warm">
            R$ {(course.priceCents / 100).toFixed(2)}
          </p>
          <div className="mt-6">
            <CheckoutButton courseId={course.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
