import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/tags - Get all tags
export async function GET(request: NextRequest) {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        insurances: {
          select: {
            insuranceId: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      insuranceCount: tag.insurances.length,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedTags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tags',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/admin/tags - Create new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Tag name is required'
      }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-')
      }
    });

    return NextResponse.json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create tag',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

