/**
 * Tipos compartilhados entre web e mobile.
 * Espelham o schema Prisma (prisma/schema.prisma) — manter sincronizado.
 */

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type LessonType = "VIDEO" | "TEXT" | "QUIZ";
export type EnrollmentStatus = "ACTIVE" | "EXPIRED" | "CANCELED";
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
export type BillingInterval = "MONTHLY" | "YEARLY";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  priceCents: number;
  category?: string | null;
  status: CourseStatus;
  instructorId: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  durationSecs?: number | null;
  content?: string | null;
  order: number;
  isFreePreview: boolean;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  course?: Course;
}

export interface LessonProgress {
  lessonId: string;
  watchedSeconds: number;
  completed: boolean;
}

export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  interval: BillingInterval;
  isAllCourses: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  plan?: Plan;
}

export interface Certificate {
  id: string;
  courseId: string;
  certificateUrl: string;
  verificationHash: string;
  issuedAt: string;
  course?: Course;
}

export interface ApiError {
  message: string;
  status: number;
}
