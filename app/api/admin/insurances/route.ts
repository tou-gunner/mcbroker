import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

const INSURANCE_SORT_KEYS = [
  'slug',
  'status',
  'featured',
  'priority',
  'createdAt',
  'updatedAt',
] as const;
type InsuranceSortKey = (typeof INSURANCE_SORT_KEYS)[number];

// GET /api/admin/insurances - Get all insurances with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const companyId = searchParams.get('companyId');
    const q = (searchParams.get('q') ?? searchParams.get('search'))?.trim() || '';
    const locale = searchParams.get('locale') || 'en';
    const sortParam = searchParams.get('sort');
    const orderParam = searchParams.get('order');
    const pageParam = searchParams.get('page');
    const perPageParam = searchParams.get('perPage');

    // Build where clause
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (q) {
      where.OR = [
        { slug: { contains: q, mode: 'insensitive' } },
        {
          metadata: {
            some: {
              locale,
              key: { in: ['name', 'description'] },
              value: { contains: q, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const sort = (INSURANCE_SORT_KEYS as readonly string[]).includes(sortParam ?? '')
      ? (sortParam as InsuranceSortKey)
      : null;
    const order = orderParam === 'desc' ? 'desc' : 'asc';
    const orderBy: any = sort
      ? [{ [sort]: order }]
      : [
          { featured: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ];

    const paginated = pageParam !== null || perPageParam !== null;
    const page = Math.max(1, Number(pageParam) || 1);
    const perPage = Math.max(1, Math.min(200, Number(perPageParam) || 20));

    const [insurances, total] = await Promise.all([
      prisma.insurance.findMany({
        where,
        include: {
          category: {
            include: {
              metadata: { where: { locale, key: 'name' } },
            },
          },
          company: {
            include: {
              metadata: { where: { locale, key: 'name' } },
            },
          },
          metadata: { where: { locale } },
          content: { where: { locale } },
          tags: { include: { tag: true } },
        },
        orderBy,
        ...(paginated
          ? { skip: (page - 1) * perPage, take: perPage }
          : {}),
      }),
      prisma.insurance.count({ where }),
    ]);

    // Format response
    const formattedInsurances = insurances.map((insurance) => ({
      id: insurance.id,
      slug: insurance.slug,
      status: insurance.status,
      featured: insurance.featured,
      priority: insurance.priority,
      name: insurance.metadata.find((m) => m.key === 'name')?.value || '',
      description:
        insurance.metadata.find((m) => m.key === 'description')?.value || '',
      category: {
        id: insurance.category.id,
        slug: insurance.category.slug,
        name:
          insurance.category.metadata[0]?.value || insurance.category.slug,
      },
      company: {
        id: insurance.company.id,
        slug: insurance.company.slug,
        logo: insurance.company.logo,
        name: insurance.company.metadata[0]?.value || insurance.company.slug,
      },
      content: insurance.content[0] || null,
      tags: insurance.tags.map((t) => t.tag),
      createdAt: insurance.createdAt,
      updatedAt: insurance.updatedAt,
      createdBy: insurance.createdBy,
      updatedBy: insurance.updatedBy,
    }));

    return NextResponse.json({
      success: true,
      data: formattedInsurances,
      total,
      count: formattedInsurances.length,
    });
  } catch (error) {
    console.error('Error fetching insurances:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch insurances',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/admin/insurances - Create new insurance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      categoryId,
      companyId,
      status = 'DRAFT',
      featured = false,
      priority = 0,
      slug,
      metadata, // Array of { locale, name, description }
      content,  // Array of { locale, contentJson, contentHtml, contentText, images }
      tags,     // Array of tag IDs
      createdBy
    } = body;

    // Validate required fields
    if (!categoryId || !companyId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: categoryId, companyId'
      }, { status: 400 });
    }

    if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Metadata is required with at least one locale'
      }, { status: 400 });
    }

    // Create insurance with relations
    const insurance = await prisma.insurance.create({
      data: {
        categoryId,
        companyId,
        status,
        featured,
        priority,
        slug: slug || `insurance-${Date.now()}`,
        createdBy,
        // Create metadata entries
        metadata: {
          create: metadata.map((meta: any) => ({
            locale: meta.locale,
            key: 'name',
            value: meta.name
          })).concat(
            metadata.map((meta: any) => ({
              locale: meta.locale,
              key: 'description',
              value: meta.description
            }))
          )
        },
        // Create content entries
        content: content && Array.isArray(content) ? {
          create: content.map((c: any) => ({
            locale: c.locale,
            contentJson: c.contentJson || {},
            contentHtml: c.contentHtml || '',
            contentText: c.contentText || '',
            images: c.images || [],
            isPublished: status === 'PUBLISHED'
          }))
        } : undefined,
        // Link tags
        tags: tags && Array.isArray(tags) ? {
          create: tags.map((tagId: string) => ({
            tagId
          }))
        } : undefined
      },
      include: {
        category: true,
        company: true,
        metadata: true,
        content: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: insurance,
      message: 'Insurance created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create insurance',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

