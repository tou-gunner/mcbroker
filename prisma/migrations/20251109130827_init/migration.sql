-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'UNDER_REVIEW');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_metadata" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_category_metadata" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_category_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurances" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" "InsuranceStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "updated_by" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_metadata" (
    "id" TEXT NOT NULL,
    "insurance_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_content" (
    "id" TEXT NOT NULL,
    "insurance_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "content_json" JSONB NOT NULL,
    "content_html" TEXT,
    "content_text" TEXT,
    "images" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_tags" (
    "insurance_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_tags_pkey" PRIMARY KEY ("insurance_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_slug_idx" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "company_metadata_company_id_locale_idx" ON "company_metadata"("company_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "company_metadata_company_id_locale_key_key" ON "company_metadata"("company_id", "locale", "key");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_categories_slug_key" ON "insurance_categories"("slug");

-- CreateIndex
CREATE INDEX "insurance_categories_slug_idx" ON "insurance_categories"("slug");

-- CreateIndex
CREATE INDEX "insurance_category_metadata_category_id_locale_idx" ON "insurance_category_metadata"("category_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_category_metadata_category_id_locale_key_key" ON "insurance_category_metadata"("category_id", "locale", "key");

-- CreateIndex
CREATE UNIQUE INDEX "insurances_slug_key" ON "insurances"("slug");

-- CreateIndex
CREATE INDEX "insurances_category_id_status_idx" ON "insurances"("category_id", "status");

-- CreateIndex
CREATE INDEX "insurances_company_id_status_idx" ON "insurances"("company_id", "status");

-- CreateIndex
CREATE INDEX "insurances_status_featured_priority_idx" ON "insurances"("status", "featured", "priority");

-- CreateIndex
CREATE INDEX "insurances_slug_idx" ON "insurances"("slug");

-- CreateIndex
CREATE INDEX "insurance_metadata_insurance_id_locale_idx" ON "insurance_metadata"("insurance_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_metadata_insurance_id_locale_key_key" ON "insurance_metadata"("insurance_id", "locale", "key");

-- CreateIndex
CREATE INDEX "insurance_content_insurance_id_locale_is_published_idx" ON "insurance_content"("insurance_id", "locale", "is_published");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_content_insurance_id_locale_key" ON "insurance_content"("insurance_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "insurance_tags_insurance_id_idx" ON "insurance_tags"("insurance_id");

-- CreateIndex
CREATE INDEX "insurance_tags_tag_id_idx" ON "insurance_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "company_metadata" ADD CONSTRAINT "company_metadata_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_category_metadata" ADD CONSTRAINT "insurance_category_metadata_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "insurance_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "insurance_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_metadata" ADD CONSTRAINT "insurance_metadata_insurance_id_fkey" FOREIGN KEY ("insurance_id") REFERENCES "insurances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_content" ADD CONSTRAINT "insurance_content_insurance_id_fkey" FOREIGN KEY ("insurance_id") REFERENCES "insurances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_tags" ADD CONSTRAINT "insurance_tags_insurance_id_fkey" FOREIGN KEY ("insurance_id") REFERENCES "insurances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_tags" ADD CONSTRAINT "insurance_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
