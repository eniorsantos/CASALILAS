-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN');
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'TEXT', 'QUIZ');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED');
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'PIX', 'BOLETO');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'MERCADO_PAGO');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- Users
CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT,
  "role" "Role" NOT NULL DEFAULT 'STUDENT',
  "avatar_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

-- Courses
CREATE TABLE "courses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "price_cents" INTEGER NOT NULL,
  "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
  "instructor_id" TEXT NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- Modules
CREATE TABLE "modules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "course_id" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL
);
CREATE INDEX "modules_course_id_idx" ON "modules"("course_id");

-- Lessons
CREATE TABLE "lessons" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "module_id" TEXT NOT NULL REFERENCES "modules"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "type" "LessonType" NOT NULL DEFAULT 'VIDEO',
  "video_asset_id" TEXT,
  "duration_secs" INTEGER,
  "content" TEXT,
  "order" INTEGER NOT NULL,
  "is_free_preview" BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX "lessons_module_id_idx" ON "lessons"("module_id");

-- Enrollments
CREATE TABLE "enrollments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "course_id" TEXT NOT NULL REFERENCES "courses"("id"),
  "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  CONSTRAINT "enrollments_user_id_course_id_key" UNIQUE ("user_id", "course_id")
);
CREATE INDEX "enrollments_user_id_idx" ON "enrollments"("user_id");

-- LessonProgress
CREATE TABLE "lesson_progress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "lesson_id" TEXT NOT NULL REFERENCES "lessons"("id"),
  "watched_seconds" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lesson_progress_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id")
);

-- Coupons
CREATE TABLE "coupons" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "discount_percent" INTEGER NOT NULL,
  "course_id" TEXT REFERENCES "courses"("id"),
  "valid_until" TIMESTAMP(3),
  "max_uses" INTEGER,
  "used_count" INTEGER NOT NULL DEFAULT 0
);

-- Payments
CREATE TABLE "payments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "course_id" TEXT NOT NULL REFERENCES "courses"("id"),
  "amount_cents" INTEGER NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "gateway" "PaymentGateway" NOT NULL,
  "gateway_charge_id" TEXT NOT NULL UNIQUE,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "coupon_id" TEXT REFERENCES "coupons"("id"),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMP(3)
);
CREATE INDEX "payments_gateway_charge_id_idx" ON "payments"("gateway_charge_id");
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- Certificates
CREATE TABLE "certificates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "course_id" TEXT NOT NULL REFERENCES "courses"("id"),
  "certificate_url" TEXT NOT NULL,
  "verification_hash" TEXT NOT NULL UNIQUE,
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "certificates_user_id_course_id_key" UNIQUE ("user_id", "course_id")
);

-- Plans
CREATE TABLE "plans" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
  "stripe_price_id" TEXT,
  "mp_preapproval_plan_id" TEXT,
  "is_all_courses" BOOLEAN NOT NULL DEFAULT true
);

-- PlanCourses
CREATE TABLE "plan_courses" (
  "plan_id" TEXT NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
  "course_id" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  CONSTRAINT "plan_courses_pkey" PRIMARY KEY ("plan_id", "course_id")
);

-- Subscriptions
CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "plan_id" TEXT NOT NULL REFERENCES "plans"("id"),
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "gateway" "PaymentGateway" NOT NULL,
  "gateway_subscription_id" TEXT NOT NULL UNIQUE,
  "current_period_end" TIMESTAMP(3) NOT NULL,
  "canceled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- PasswordResetTokens
CREATE TABLE "password_reset_tokens" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3)
);

-- FailedJobs
CREATE TABLE "failed_jobs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "queue_name" TEXT NOT NULL,
  "job_name" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "error" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved" BOOLEAN NOT NULL DEFAULT false
);
