-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('pending', 'submitted', 'reviewed', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('new', 'contacted', 'qualified', 'dropped', 'converted');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'check', 'bank_transfer', 'online', 'other');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'manager', 'trainer', 'student');

-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "subdomain" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" VARCHAR(20),
    "specialization" VARCHAR(100),
    "bio" TEXT,
    "status" VARCHAR(20) DEFAULT 'active',
    "tenant_id" INTEGER,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL,
    "status" "lead_status" NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "assigned_to" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "course" VARCHAR(100),
    "tenant_id" INTEGER,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "follow_up_date" DATE NOT NULL,
    "comments" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "assigned_to" INTEGER,
    "created_by" INTEGER,
    "is_completed" BOOLEAN DEFAULT false,
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(50) NOT NULL DEFAULT 'Call',
    "next_follow_up_date" DATE,
    "tenant_id" INTEGER,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_comments" (
    "id" SERIAL NOT NULL,
    "follow_up_id" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(6) NOT NULL,
    "end_date" TIMESTAMP(6) NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "trainer_id" INTEGER,
    "capacity" INTEGER,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" INTEGER,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" INTEGER,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "parent_mobile" TEXT,
    "batch_id" INTEGER NOT NULL,
    "enrollment_date" TIMESTAMP(6) NOT NULL,
    "total_fee" DECIMAL(10,2) NOT NULL,
    "fee_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fee_due" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "converted_from_lead_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" INTEGER,
    "user_id" INTEGER,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" TIMESTAMP(6) NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "receipt_number" TEXT,
    "transaction_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT DEFAULT '',
    "next_payment_due_date" DATE,
    "tenant_id" INTEGER,
    "status" VARCHAR(20) DEFAULT 'Completed',

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "course_id" INTEGER,
    "due_date" DATE NOT NULL,
    "max_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_snippets" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "language" VARCHAR(50) NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "user_id" INTEGER,
    "course_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_snippets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "tenant_id" INTEGER,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_unique" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "settings_tenant_id_key_key" ON "settings"("tenant_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "students_phone_key" ON "students"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "sessions"("expire");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_assigned_toTousers" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_created_byTousers" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "follow_up_comments" ADD CONSTRAINT "follow_up_comments_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "follow_ups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "follow_up_comments" ADD CONSTRAINT "follow_up_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_trainer_id_users_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;