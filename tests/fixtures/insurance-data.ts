import type { DetailRecord } from '@/app/services/insurance-detail';

export function insuranceRecord(): DetailRecord {
  return {
    id: 'fixture-plan', status: 'PUBLISHED', categoryId: 'health', companyId: 'fixture-company',
    slug: 'fixture-plan', featured: false, priority: 0, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
    metadata: [{ locale: 'en', key: 'name', value: 'Family Health Plan' }, { locale: 'en', key: 'description', value: 'Cover for your family, with room to ask questions.' }],
    company: { isActive: true, logo: '', metadata: [{ locale: 'en', key: 'name', value: 'Example Insurance' }] },
    category: { slug: 'health', metadata: [{ locale: 'en', key: 'name', value: 'Health' }] },
    content: [{ locale: 'en', isPublished: true, contentHtml: '<h2>Cover at a glance</h2><p>Published English article.</p>', contentJson: { type: 'doc' }, contentText: 'Published English article.', images: ['https://example.test/article.png'] }],
  };
}
