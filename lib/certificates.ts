import crypto from "crypto";
import { prisma } from "./prisma";
import { generateCertificatePdf } from "./generate-certificate-pdf";
import { uploadToStorage } from "./storage";

export async function issueCertificateIfEligible(userId: string, courseId: string) {
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });
  if (totalLessons === 0) return null;

  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, completed: true, lesson: { module: { courseId } } },
  });

  if (completedLessons < totalLessons) return null;

  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) return existing;

  const verificationHash = crypto.randomBytes(16).toString("hex");

  const pdfBuffer = await generateCertificatePdf({ userId, courseId, verificationHash });
  const certificateUrl = await uploadToStorage(
    `certificates/${verificationHash}.pdf`,
    pdfBuffer
  );

  return prisma.certificate.create({
    data: { userId, courseId, certificateUrl, verificationHash },
  });
}
