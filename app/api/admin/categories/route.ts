import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/categories - Get all insurance categories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'en';

    const categories = await prisma.insuranceCategory.findMany({
      include: {
        metadata: {
          where: { locale }
        },
        insurances: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        slug: 'asc'
      }
    });

    const formattedCategories = categories.map(category => ({
      id: category.id,
      slug: category.slug,
      description: category.description,
      name: category.metadata.find(m => m.key === 'name')?.value || category.slug,
      insuranceCount: category.insurances.length,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, description, metadata } = body;

    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Slug is required'
      }, { status: 400 });
    }

    if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Metadata is required with at least one locale'
      }, { status: 400 });
    }

    // Create category with metadata
    const category = await prisma.insuranceCategory.create({
      data: {
        slug,
        description: description || null,
        metadata: {
          create: metadata.map((meta: any) => ({
            locale: meta.locale,
            key: meta.key,
            value: meta.value
          }))
        }
      },
      include: {
        metadata: true
      }
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create category',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

