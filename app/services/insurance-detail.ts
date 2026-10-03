import { prisma } from '@/app/lib/prisma';
import { hasArticleHtml } from '@/app/lib/article-html';
import type { InsuranceDetail } from '@/app/interfaces/insurance-detail';

type Metadata = { locale: string; key: string; value: string };
export interface DetailRecord {
  id: string; status: string; categoryId: string; companyId: string;
  slug: string | null; featured: boolean; priority: number; createdAt: Date; updatedAt: Date;
  metadata: Metadata[];
  company: { isActive: boolean; logo: string | null; metadata: Metadata[] };
  category: { slug: string; metadata: Metadata[] };
  content: { locale: string; isPublished: boolean; contentHtml: string | null; contentJson: unknown; contentText: string | null; images: string[] }[];
}

const metadataValue = (metadata: Metadata[], locale: string, key: string) =>
  metadata.find(row => row.locale === locale && row.key === key)?.value.trim()
  || metadata.find(row => row.locale === 'en' && row.key === key)?.value.trim()
  || '';

export function formatInsuranceDetail(record: DetailRecord | null, locale: string): InsuranceDetail | undefined {
  if (!record || record.status !== 'PUBLISHED' || !record.company.isActive) return undefined;
  const content = [...new Set([locale, 'en'])].map(language => record.content.find(row =>
    row.locale === language && row.isPublished && (hasArticleHtml(row.contentHtml) || Boolean(row.contentText?.trim()))
  )).find(Boolean);
  return {
    id: record.id,
    name: metadataValue(record.metadata, locale, 'name'),
    description: metadataValue(record.metadata, locale, 'description'),
    category: metadataValue(record.category.metadata, locale, 'name'),
    categoryId: record.categoryId,
    categorySlug: record.category.slug,
    company: metadataValue(record.company.metadata, locale, 'name'),
    companyId: record.companyId,
    companyLogo: record.company.logo || '',
    slug: record.slug,
    featured: record.featured,
    priority: record.priority,
    contentHtml: content?.contentHtml || null,
    contentJson: content?.contentJson ?? null,
    contentText: content?.contentText || null,
    images: content?.images ?? [],
    contentLocale: content?.locale ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getInsuranceById(id: string, locale = 'en'): Promise<InsuranceDetail | undefined> {
  const languages = [...new Set([locale, 'en'])];
  const record = await prisma.insurance.findFirst({
    where: { id, status: 'PUBLISHED', company: { isActive: true } },
    include: {
      metadata: { where: { locale: { in: languages } } },
      category: { include: { metadata: { where: { locale: { in: languages } } } } },
      company: { include: { metadata: { where: { locale: { in: languages } } } } },
      content: { where: { locale: { in: languages }, isPublished: true } },
    },
  });
  return formatInsuranceDetail(record, locale);
}

/** Keep the established public API fields; presentation-only context stays internal. */
export function insuranceApiResponse(insurance: InsuranceDetail) {
  return {
    id: insurance.id, name: insurance.name, description: insurance.description,
    category: insurance.category, categoryId: insurance.categoryId,
    company: insurance.company, companyId: insurance.companyId,
    slug: insurance.slug, featured: insurance.featured, priority: insurance.priority,
    contentHtml: insurance.contentHtml, contentJson: insurance.contentJson,
    contentText: insurance.contentText, images: insurance.images,
    createdAt: insurance.createdAt, updatedAt: insurance.updatedAt,
  };
}
