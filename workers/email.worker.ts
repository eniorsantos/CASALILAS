import { Worker } from "bullmq";
import { connection } from "@/lib/queue/connection";
import { resend } from "@/lib/resend";
import { prisma } from "@/lib/prisma";

export const emailWorker = new Worker(
  "email",
  async (job) => {
    if (job.name === "welcome-email") {
      const { userId, courseId } = job.data as { userId: string; courseId: string };
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });
      await resend.emails.send({
        from: "cursos@seusite.com",
        to: user.email,
        subject: `Bem-vindo(a) ao curso ${course.title}!`,
        html: `<p>Olá ${user.name}, seu acesso ao curso ${course.title} já está liberado...</p>`,
      });
    }

    if (job.name === "payment-failed-email") {
      const { userId } = job.data as { userId: string };
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      await resend.emails.send({
        from: "cursos@seusite.com",
        to: user.email,
        subject: "Houve um problema com seu pagamento",
        html: `<p>Não conseguimos processar a renovação da sua assinatura...</p>`,
      });
    }

    if (job.name === "password-reset-email") {
      const { email, resetUrl } = job.data as { email: string; resetUrl: string };
      await resend.emails.send({
        from: "cursos@seusite.com",
        to: email,
        subject: "Recuperação de senha",
        html: `<p>Clique <a href="${resetUrl}">aqui</a> para redefinir sua senha. O link expira em 30 minutos.</p>`,
      });
    }

    if (job.name === "certificate-issued-email") {
      const { userId, courseId } = job.data as { userId: string; courseId: string };
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });
      await resend.emails.send({
        from: "cursos@seusite.com",
        to: user.email,
        subject: `Certificado do curso ${course.title} disponível!`,
        html: `<p>Parabéns ${user.name}! Seu certificado já está disponível.</p>`,
      });
    }
  },
  { connection, concurrency: 10 }
);

emailWorker.on("failed", async (job, err) => {
  console.error(`Email job ${job?.id} falhou:`, err.message);
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await prisma.failedJob.create({
      data: {
        queueName: "email",
        jobName: job.name,
        payload: JSON.stringify(job.data),
        error: err.message,
      },
    });
  }
});
