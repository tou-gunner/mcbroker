import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';

interface InsuranceDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

// Helper to get locale-specific value from metadata
function getMetadataValue(metadata: any[], locale: string, key: string, fallbackLocale = 'en'): string {
  const value = metadata.find((m: any) => m.locale === locale && m.key === key)?.value;
  if (value) return value;
  
  // Fallback to default locale
  const fallbackValue = metadata.find((m: any) => m.locale === fallbackLocale && m.key === key)?.value;
  return fallbackValue || '';
}

export default async function InsuranceDetailPage({ params }: InsuranceDetailPageProps) {
  const { id, locale } = await params;
  
  // Fetch insurance directly from database
  const insuranceData = await prisma.insurance.findUnique({
    where: { 
      id,
      status: 'PUBLISHED' // Only show published insurances
    },
    include: {
      category: {
        include: {
          metadata: true,
        },
      },
      company: {
        include: {
          metadata: true,
        },
      },
      metadata: true,
      content: {
        where: {
          locale,
        },
      },
    },
  });

  if (!insuranceData) {
    notFound();
  }

  // Get locale-specific content
  const content = insuranceData.content[0] || null;

  // Format insurance data
  const insurance = {
    id: insuranceData.id,
    name: getMetadataValue(insuranceData.metadata, locale, 'name'),
    description: getMetadataValue(insuranceData.metadata, locale, 'description'),
    category: getMetadataValue(insuranceData.category.metadata, locale, 'name'),
    contentHtml: content?.contentHtml || null,
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-244px)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {insurance.name}
          </h1>
          <p className="text-lg text-gray-600">
            {insurance.description}
          </p>
        </div>

        {/* Category Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {insurance.category}
          </span>
        </div>

        {/* Rich Content */}
        {insurance.contentHtml && (
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: insurance.contentHtml }}
          />
        )}

        {/* Fallback if no HTML content */}
        {!insurance.contentHtml && insurance.description && (
          <div className="prose prose-lg max-w-none">
            <p>{insurance.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

