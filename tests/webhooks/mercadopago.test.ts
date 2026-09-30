import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/webhooks/mercadopago/route";
import { mpPaymentClient } from "@/lib/mercadopago";

vi.mock("@/lib/queue/producers/email", () => ({
  queueWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("webhook Mercado Pago", () => {
  it("só libera acesso quando o status do pagamento é 'approved'", async () => {
    const user = await prisma.user.create({ data: { name: "Aluno MP", email: "mp@test.com" } });
    const instructor = await prisma.user.create({ data: { name: "Prof MP", email: "profmp@test.com", role: "INSTRUCTOR" } });
    const course = await prisma.course.create({
      data: { title: "Curso MP", slug: "curso-mp", description: "descricao", priceCents: 3000, instructorId: instructor.id },
    });

    vi.spyOn(mpPaymentClient, "get").mockResolvedValue({
      id: 987654,
      status: "pending",
      transaction_amount: 30,
      payment_type_id: "pix",
      metadata: { userId: user.id, courseId: course.id },
    } as never);

    const req = new Request("http://localhost/api/webhooks/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "payment", data: { id: "987654" } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    });
    expect(enrollment).toBeNull();
  });
});
