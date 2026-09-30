import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/mobile-auth";
import { GET as accessGet } from "@/app/api/mobile/lessons/[id]/access/route";
import { GET as nextGet } from "@/app/api/mobile/lessons/[id]/next/route";
import { POST as pushTokenPost } from "@/app/api/mobile/push-token/route";
import { POST as socialPost } from "@/app/api/mobile/social-login/route";
import { GET as homeGet } from "@/app/api/mobile/home/route";

function authHeaders(userId: string, role = "STUDENT") {
  return { Authorization: `Bearer ${signMobileToken({ id: userId, role })}` };
}

function get(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers });
}

function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function makeCourseWithLessons(slug: string, instructorId: string, category?: string) {
  const course = await prisma.course.create({
    data: {
      title: `Curso ${slug}`,
      slug,
      description: "Descricao valida com mais de 10 caracteres",
      priceCents: 1000,
      status: "PUBLISHED",
      instructorId,
      ...(category ? { category } : {}),
    },
  });
  const mod = await prisma.module.create({ data: { courseId: course.id, title: "M1", order: 0 } });
  const l1 = await prisma.lesson.create({ data: { moduleId: mod.id, title: "A1", type: "VIDEO", order: 0 } });
  const l2 = await prisma.lesson.create({ data: { moduleId: mod.id, title: "A2", type: "VIDEO", order: 1 } });
  return { course, l1, l2 };
}

describe("mobile access/next", () => {
  it("access=true com matrícula; false sem; 401 sem token", async () => {
    const instructor = await prisma.user.create({
      data: { name: "I", email: `acc-i-${Date.now()}@test.com`, role: "INSTRUCTOR" },
    });
    const { l1 } = await makeCourseWithLessons(`acc-${Date.now()}`, instructor.id);
    const student = await prisma.user.create({
      data: { name: "S", email: `acc-s-${Date.now()}@test.com`, role: "STUDENT" },
    });
    const outsider = await prisma.user.create({
      data: { name: "O", email: `acc-o-${Date.now()}@test.com`, role: "STUDENT" },
    });
    await prisma.enrollment.create({
      data: { userId: student.id, courseId: (await prisma.lesson.findUniqueOrThrow({ where: { id: l1.id }, include: { module: true } })).module.courseId, status: "ACTIVE" },
    });

    const okRes = await accessGet(
      get(`http://x/api/mobile/lessons/${l1.id}/access`, authHeaders(student.id)),
      { params: { id: l1.id } }
    );
    expect(okRes.status).toBe(200);
    expect(((await okRes.json()) as { hasAccess: boolean }).hasAccess).toBe(true);

    const deniedRes = await accessGet(
      get(`http://x/api/mobile/lessons/${l1.id}/access`, authHeaders(outsider.id)),
      { params: { id: l1.id } }
    );
    expect(((await deniedRes.json()) as { hasAccess: boolean }).hasAccess).toBe(false);

    const anon = await accessGet(get(`http://x/api/mobile/lessons/${l1.id}/access`), {
      params: { id: l1.id },
    });
    expect(anon.status).toBe(401);
  });

  it("next retorna a próxima aula e null na última", async () => {
    const instructor = await prisma.user.create({
      data: { name: "I", email: `nxt-i-${Date.now()}@test.com`, role: "INSTRUCTOR" },
    });
    const student = await prisma.user.create({
      data: { name: "S", email: `nxt-s-${Date.now()}@test.com`, role: "STUDENT" },
    });
    const { l1, l2 } = await makeCourseWithLessons(`nxt-${Date.now()}`, instructor.id);

    const first = await nextGet(get(`http://x/next`, authHeaders(student.id)), { params: { id: l1.id } });
    expect(((await first.json()) as { id: string } | null)?.id).toBe(l2.id);

    const last = await nextGet(get(`http://x/next`, authHeaders(student.id)), { params: { id: l2.id } });
    expect(await last.json()).toBeNull();
  });
});

describe("mobile push-token", () => {
  it("registra token; 400 sem token; 401 sem auth", async () => {
    const student = await prisma.user.create({
      data: { name: "S", email: `push-${Date.now()}@test.com`, role: "STUDENT" },
    });

    const ok = await pushTokenPost(
      post(`http://x/push-token`, { token: `ExponentPushToken[${Date.now()}]`, platform: "android" }, authHeaders(student.id))
    );
    expect(ok.status).toBe(200);
    expect(await prisma.pushToken.count({ where: { userId: student.id } })).toBe(1);

    const bad = await pushTokenPost(post(`http://x/push-token`, {}, authHeaders(student.id)));
    expect(bad.status).toBe(400);

    const anon = await pushTokenPost(post(`http://x/push-token`, { token: "x" }));
    expect(anon.status).toBe(401);
  });
});

describe("mobile social-login", () => {
  it("400 sem idToken; 400 com provedor inválido (sem rede)", async () => {
    const noToken = await socialPost(post(`http://x/social`, { provider: "google" }));
    expect(noToken.status).toBe(400);

    const badProvider = await socialPost(
      post(`http://x/social`, { provider: "facebook", idToken: "abc" })
    );
    expect(badProvider.status).toBe(400);
  });
});

describe("mobile home categorias", () => {
  it("cria seção por categoria preenchida", async () => {
    const instructor = await prisma.user.create({
      data: { name: "I", email: `cat-i-${Date.now()}@test.com`, role: "INSTRUCTOR" },
    });
    const student = await prisma.user.create({
      data: { name: "S", email: `cat-s-${Date.now()}@test.com`, role: "STUDENT" },
    });
    const tag = `Cat${Date.now().toString(36)}`;
    await makeCourseWithLessons(`cat-${Date.now()}`, instructor.id, tag);

    const res = await homeGet(get(`http://x/home`, authHeaders(student.id)));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sections: { title: string }[] };
    expect(body.sections.map((s) => s.title)).toContain(tag);
  });
});
