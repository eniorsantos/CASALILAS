import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { POST } from "@/app/api/webhooks/stripe/route";

vi.mock("@/lib/queue/producers/email", () => ({
  queueWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("webhook Stripe - checkout.session.completed", () => {
  it("cria pagamento e matrícula quando o pagamento é confirmado", async () => {
    const user = await prisma.user.create({ data: { name: "Aluno", email: "aluno@test.com" } });
    const instructor = await prisma.user.create({ data: { name: "Prof", email: "prof@test.com", role: "INSTRUCTOR" } });
    const course = await prisma.course.create({
      data: { title: "Curso X", slug: "curso-x", description: "descricao", priceCents: 5000, instructorId: instructor.id },
    });

    const fakeEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          amount_total: 5000,
          mode: "payment",
          metadata: { userId: user.id, courseId: course.id },
        },
      },
    };

    vi.spyOn(stripe.webhooks, "constructEvent").mockReturnValue(fakeEvent as never);

    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify(fakeEvent),
      headers: { "stripe-signature": "fake-signature" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const payment = await prisma.payment.findUnique({ where: { gatewayChargeId: "cs_test_123" } });
    expect(payment?.status).toBe("PAID");

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    });
    expect(enrollment?.status).toBe("ACTIVE");
  });

  it("é idempotente — processar o mesmo evento duas vezes não duplica o pagamento", async () => {
    const user = await prisma.user.create({ data: { name: "Aluno2", email: "aluno2@test.com" } });
    const instructor = await prisma.user.create({ data: { name: "Prof2", email: "prof2@test.com", role: "INSTRUCTOR" } });
    const course = await prisma.course.create({
      data: { title: "Curso Y", slug: "curso-y", description: "descricao", priceCents: 5000, instructorId: instructor.id },
    });

    const fakeEvent = {
      type: "checkout.session.completed",
      data: {
        object: { id: "cs_test_456", amount_total: 5000, mode: "payment", metadata: { userId: user.id, courseId: course.id } },
      },
    };
    vi.spyOn(stripe.webhooks, "constructEvent").mockReturnValue(fakeEvent as never);

    const makeRequest = () =>
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify(fakeEvent),
        headers: { "stripe-signature": "fake-signature" },
      });

    await POST(makeRequest());
    await POST(makeRequest());

    const payments = await prisma.payment.findMany({ where: { gatewayChargeId: "cs_test_456" } });
    expect(payments).toHaveLength(1);
  });

  it("rejeita webhook com assinatura inválida", async () => {
    vi.spyOn(stripe.webhooks, "constructEvent").mockImplementation(() => {
      throw new Error("Assinatura inválida");
    });

    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "payload malicioso",
      headers: { "stripe-signature": "assinatura-forjada" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
