export interface InsuranceDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  categorySlug: string;
  company: string;
  companyId: string;
  companyLogo: string;
  slug: string | null;
  featured: boolean;
  priority: number;
  contentHtml: string | null;
  contentJson: unknown;
  contentText: string | null;
  images: string[];
  contentLocale: string | null;
  createdAt: Date;
  updatedAt: Date;
}
