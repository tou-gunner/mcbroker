import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/insurances/[id] - Get single insurance by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'en';

    const insurance = await prisma.insurance.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            metadata: {
              where: { locale, key: 'name' }
            }
          }
        },
        company: {
          include: {
            metadata: {
              where: { locale, key: 'name' }
            }
          }
        },
        metadata: true, // Get all metadata for editing
        content: true,  // Get all content for all locales
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!insurance) {
      return NextResponse.json({
        success: false,
        error: 'Insurance not found'
      }, { status: 404 });
    }

    // Format metadata by locale
    const metadataByLocale = insurance.metadata.reduce((acc: any, meta) => {
      if (!acc[meta.locale]) {
        acc[meta.locale] = {};
      }
      acc[meta.locale][meta.key] = meta.value;
      return acc;
    }, {});

    // Format content by locale
    const contentByLocale = insurance.content.reduce((acc: any, content) => {
      acc[content.locale] = {
        contentJson: content.contentJson,
        contentHtml: content.contentHtml,
        contentText: content.contentText,
        images: content.images,
        version: content.version,
        isPublished: content.isPublished,
        publishedAt: content.publishedAt
      };
      return acc;
    }, {});

    const formattedInsurance = {
      id: insurance.id,
      categoryId: insurance.categoryId,
      companyId: insurance.companyId,
      status: insurance.status,
      featured: insurance.featured,
      priority: insurance.priority,
      slug: insurance.slug,
      category: {
        id: insurance.category.id,
        slug: insurance.category.slug,
        name: insurance.category.metadata[0]?.value || insurance.category.slug
      },
      company: {
        id: insurance.company.id,
        slug: insurance.company.slug,
        logo: insurance.company.logo,
        name: insurance.company.metadata[0]?.value || insurance.company.slug
      },
      metadata: metadataByLocale,
      content: contentByLocale,
      tags: insurance.tags.map(t => t.tag),
      createdAt: insurance.createdAt,
      updatedAt: insurance.updatedAt,
      createdBy: insurance.createdBy,
      updatedBy: insurance.updatedBy
    };

    return NextResponse.json({
      success: true,
      data: formattedInsurance
    });
  } catch (error) {
    console.error('Error fetching insurance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch insurance',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/admin/insurances/[id] - Update insurance
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      categoryId,
      companyId,
      status,
      featured,
      priority,
      slug,
      metadata, // Array of { locale, name, description }
      content,  // Array of { locale, contentJson, contentHtml, contentText, images }
      tags,     // Array of tag IDs
      updatedBy
    } = body;

    // Check if insurance exists
    const existingInsurance = await prisma.insurance.findUnique({
      where: { id },
      include: {
        metadata: true,
        content: true,
        tags: true
      }
    });

    if (!existingInsurance) {
      return NextResponse.json({
        success: false,
        error: 'Insurance not found'
      }, { status: 404 });
    }

    // Update insurance
    const insurance = await prisma.insurance.update({
      where: { id },
      data: {
        ...(categoryId && { categoryId }),
        ...(companyId && { companyId }),
        ...(status && { status }),
        ...(typeof featured !== 'undefined' && { featured }),
        ...(typeof priority !== 'undefined' && { priority }),
        ...(slug && { slug }),
        ...(updatedBy && { updatedBy })
      }
    });

    // Update metadata if provided
    if (metadata && Array.isArray(metadata)) {
      // Delete existing metadata
      await prisma.insuranceMetadata.deleteMany({
        where: { insuranceId: id }
      });

      // Create new metadata
      await prisma.insuranceMetadata.createMany({
        data: metadata.flatMap((meta: any) => [
          {
            insuranceId: id,
            locale: meta.locale,
            key: 'name',
            value: meta.name
          },
          {
            insuranceId: id,
            locale: meta.locale,
            key: 'description',
            value: meta.description
          }
        ])
      });
    }

    // Update content if provided
    if (content && Array.isArray(content)) {
      for (const c of content) {
        await prisma.insuranceContent.upsert({
          where: {
            insuranceId_locale: {
              insuranceId: id,
              locale: c.locale
            }
          },
          update: {
            contentJson: c.contentJson,
            contentHtml: c.contentHtml,
            contentText: c.contentText,
            images: c.images || [],
            isPublished: status === 'PUBLISHED',
            ...(status === 'PUBLISHED' && { publishedAt: new Date() })
          },
          create: {
            insuranceId: id,
            locale: c.locale,
            contentJson: c.contentJson || {},
            contentHtml: c.contentHtml || '',
            contentText: c.contentText || '',
            images: c.images || [],
            isPublished: status === 'PUBLISHED',
            ...(status === 'PUBLISHED' && { publishedAt: new Date() })
          }
        });
      }
    }

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete existing tags
      await prisma.insuranceTag.deleteMany({
        where: { insuranceId: id }
      });

      // Create new tags
      if (tags.length > 0) {
        await prisma.insuranceTag.createMany({
          data: tags.map((tagId: string) => ({
            insuranceId: id,
            tagId
          }))
        });
      }
    }

    // Fetch updated insurance
    const updatedInsurance = await prisma.insurance.findUnique({
      where: { id },
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
      data: updatedInsurance,
      message: 'Insurance updated successfully'
    });
  } catch (error) {
    console.error('Error updating insurance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update insurance',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/admin/insurances/[id] - Delete insurance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if insurance exists
    const insurance = await prisma.insurance.findUnique({
      where: { id }
    });

    if (!insurance) {
      return NextResponse.json({
        success: false,
        error: 'Insurance not found'
      }, { status: 404 });
    }

    // Delete insurance (cascade will handle related records)
    await prisma.insurance.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Insurance deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting insurance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete insurance',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

