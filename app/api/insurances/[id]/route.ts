import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Helper to get locale-specific value from metadata
function getMetadataValue(metadata: any[], locale: string, key: string, fallbackLocale = 'en'): string {
  const value = metadata.find((m) => m.locale === locale && m.key === key)?.value;
  if (value) return value;
  
  // Fallback to default locale
  const fallbackValue = metadata.find((m) => m.locale === fallbackLocale && m.key === key)?.value;
  return fallbackValue || '';
}

// GET /api/insurances/[id] - Get a single insurance by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    const insurance = await prisma.insurance.findUnique({
      where: { 
        id,
        status: 'PUBLISHED' // Only show published insurances on public site
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

    if (!insurance) {
      return NextResponse.json(
        { success: false, error: 'Insurance not found' },
        { status: 404 }
      );
    }

    // Get locale-specific content
    const content = insurance.content[0] || null;

    // Format response
    const response = {
      id: insurance.id,
      name: getMetadataValue(insurance.metadata, locale, 'name'),
      description: getMetadataValue(insurance.metadata, locale, 'description'),
      category: getMetadataValue(insurance.category.metadata, locale, 'name'),
      categoryId: insurance.categoryId,
      company: getMetadataValue(insurance.company.metadata, locale, 'name'),
      companyId: insurance.companyId,
      slug: insurance.slug,
      featured: insurance.featured,
      priority: insurance.priority,
      contentHtml: content?.contentHtml || null,
      contentJson: content?.contentJson || null,
      contentText: content?.contentText || null,
      images: content?.images || [],
      createdAt: insurance.createdAt,
      updatedAt: insurance.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching insurance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insurance' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

