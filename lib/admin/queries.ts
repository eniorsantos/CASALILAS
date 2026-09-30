import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type CurrentUser = { id: string; role: string };

async function currentStaff(): Promise<CurrentUser> {
  const user = (await getCurrentUser()) as CurrentUser | null;
  if (!user || !["ADMIN", "INSTRUCTOR"].includes(user.role)) {
    throw new Error("Não autorizado");
  }
  return user;
}

/** Escopo de cursos visíveis: admin vê tudo, instrutor só os próprios. */
function courseScope(user: CurrentUser) {
  return user.role === "ADMIN" ? {} : { instructorId: user.id };
}

export interface DashboardStats {
  monthlyRevenueCents: number;
  revenueTrend: number;
  newStudents: number;
  studentsTrend: number;
  publishedCourses: number;
  revenueByDay: { date: string; revenueCents: number }[];
  topCourses: { id: string; title: string; revenueCents: number; enrollments: number }[];
}

/** Agrega Payment + Enrollment + Course para o dashboard (seção 4). */
export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await currentStaff();
  const scope = courseScope(user);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [monthly, prevMonthly, publishedCourses, newStudents, prevStudents] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: "PAID", paidAt: { gte: monthStart }, course: scope },
    }),
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: "PAID", paidAt: { gte: prevMonthStart, lt: monthStart }, course: scope },
    }),
    prisma.course.count({ where: { status: "PUBLISHED", ...scope } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: monthStart }, course: scope } }),
    prisma.enrollment.count({
      where: { enrolledAt: { gte: prevMonthStart, lt: monthStart }, course: scope },
    }),
  ]);

  const monthlyRevenueCents = monthly._sum.amountCents ?? 0;
  const prevRevenue = prevMonthly._sum.amountCents ?? 0;
  const revenueTrend = prevRevenue > 0 ? Math.round(((monthlyRevenueCents - prevRevenue) / prevRevenue) * 100) : 0;
  const studentsTrend =
    prevStudents > 0 ? Math.round(((newStudents - prevStudents) / prevStudents) * 100) : 0;

  const daily = await prisma.payment.groupBy({
    by: ["paidAt"],
    _sum: { amountCents: true },
    where: { status: "PAID", paidAt: { gte: day30 }, course: scope },
  });
  const byDay = new Map<string, number>();
  for (const row of daily) {
    if (!row.paidAt) continue;
    const key = row.paidAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + (row._sum.amountCents ?? 0));
  }
  const revenueByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    return { date: key.slice(5), revenueCents: byDay.get(key) ?? 0 };
  });

  const courses = await prisma.course.findMany({
    where: scope,
    select: {
      id: true,
      title: true,
      _count: { select: { enrollments: true } },
      payments: { where: { status: "PAID" }, select: { amountCents: true } },
    },
  });
  const topCourses = courses
    .map((c) => ({
      id: c.id,
      title: c.title,
      enrollments: c._count.enrollments,
      revenueCents: c.payments.reduce((s, p) => s + p.amountCents, 0),
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  return {
    monthlyRevenueCents,
    revenueTrend,
    newStudents,
    studentsTrend,
    publishedCourses,
    revenueByDay,
    topCourses,
  };
}

export interface AdminCourseRow {
  id: string;
  title: string;
  status: string;
  priceCents: number;
  thumbnailUrl: string | null;
  enrollmentCount: number;
}

/** Cursos do admin já filtrados por instrutor, com contagem de alunos. */
export async function getCoursesForAdmin(): Promise<AdminCourseRow[]> {
  const user = await currentStaff();
  const courses = await prisma.course.findMany({
    where: courseScope(user),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      priceCents: true,
      thumbnailUrl: true,
      _count: { select: { enrollments: true } },
    },
  });
  return courses.map((c) => ({ ...c, enrollmentCount: c._count.enrollments }));
}

export async function getCourseWithModules(courseId: string) {
  const user = await currentStaff();
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (user.role !== "ADMIN" && course.instructorId !== user.id) {
    throw new Error("Você não tem permissão para editar este curso");
  }
  return course;
}

export async function getLessonWithStatus(lessonId: string) {
  await currentStaff();
  return prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });
}

export interface AdminEnrollmentRow {
  id: string;
  status: string;
  enrolledAt: Date;
  progressPct: number;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string };
}

/** Matrículas com progresso; instrutor vê só as dos próprios cursos. */
export async function getEnrollmentsForAdmin(): Promise<AdminEnrollmentRow[]> {
  const user = await currentStaff();
  const enrollments = await prisma.enrollment.findMany({
    where: { course: courseScope(user) },
    include: { user: true, course: { include: { modules: { include: { lessons: true } } } } },
    orderBy: { enrolledAt: "desc" },
    take: 100,
  });

  return Promise.all(
    enrollments.map(async (e) => {
      const lessonIds = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
      const completed = lessonIds.length
        ? await prisma.lessonProgress.count({
            where: { userId: e.userId, lessonId: { in: lessonIds }, completed: true },
          })
        : 0;
      return {
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt,
        progressPct: lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0,
        user: { id: e.user.id, name: e.user.name, email: e.user.email },
        course: { id: e.course.id, title: e.course.title },
      };
    })
  );
}

export interface FinanceFilters {
  /** dias para trás (7/30/90); undefined = tudo */
  days?: number;
  gateway?: "STRIPE" | "MERCADO_PAGO";
}

export interface FinanceOverview {
  periodRevenueCents: number;
  totalRevenueCents: number;
  activeSubscriptions: number;
  pastDueSubscriptions: number;
  mrrCents: number;
  churnRate: number;
  recentPayments: {
    id: string;
    amountCents: number;
    gateway: string;
    method: string;
    status: string;
    paidAt: Date | null;
    userName: string;
    courseTitle: string;
  }[];
  subscriptions: {
    id: string;
    status: string;
    currentPeriodEnd: Date;
    gateway: string;
    userName: string;
    userEmail: string;
    planName: string;
  }[];
}

/** Agrega Payment + Subscription para o financeiro (seção 8, ADMIN). */
export async function getFinanceOverview(filters?: FinanceFilters): Promise<FinanceOverview> {
  const user = await currentStaff();
  if (user.role !== "ADMIN") throw new Error("Não autorizado");

  const since =
    filters?.days !== undefined
      ? new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000)
      : undefined;
  const paymentWhere = {
    status: "PAID" as const,
    ...(since ? { paidAt: { gte: since } } : {}),
    ...(filters?.gateway ? { gateway: filters.gateway } : {}),
  };

  const [period, total, activeSubs, pastDueSubs, canceledSubs, recent, subscriptions] =
    await Promise.all([
      prisma.payment.aggregate({ _sum: { amountCents: true }, where: paymentWhere }),
      prisma.payment.aggregate({
        _sum: { amountCents: true },
        where: { status: "PAID" },
      }),
      prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      }),
      prisma.subscription.count({ where: { status: "PAST_DUE" } }),
      prisma.subscription.count({ where: { status: { in: ["CANCELED", "EXPIRED"] } } }),
      prisma.payment.findMany({
        where: {
          ...(since ? { createdAt: { gte: since } } : {}),
          ...(filters?.gateway ? { gateway: filters.gateway } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: true, course: true },
      }),
      prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: true, plan: true },
      }),
    ]);

  const mrrCents = activeSubs.reduce((sum, s) => {
    const monthly =
      s.plan.interval === "YEARLY" ? Math.round(s.plan.priceCents / 12) : s.plan.priceCents;
    return sum + monthly;
  }, 0);
  const churnRate =
    activeSubs.length + canceledSubs > 0
      ? Math.round((canceledSubs / (activeSubs.length + canceledSubs)) * 100)
      : 0;

  return {
    periodRevenueCents: period._sum.amountCents ?? 0,
    totalRevenueCents: total._sum.amountCents ?? 0,
    activeSubscriptions: activeSubs.length,
    pastDueSubscriptions: pastDueSubs,
    mrrCents,
    churnRate,
    recentPayments: recent.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      gateway: p.gateway,
      method: p.method,
      status: p.status,
      paidAt: p.paidAt,
      userName: p.user.name,
      courseTitle: p.course.title,
    })),
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      status: s.status,
      currentPeriodEnd: s.currentPeriodEnd,
      gateway: s.gateway,
      userName: s.user.name,
      userEmail: s.user.email,
      planName: s.plan.name,
    })),
  };
}

export async function getPlansForAdmin() {
  const user = await currentStaff();
  if (user.role !== "ADMIN") throw new Error("Não autorizado");
  return prisma.plan.findMany({
    orderBy: { priceCents: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });
}
