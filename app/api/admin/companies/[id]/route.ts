import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionAdmin } from '@/app/lib/session';

// GET /api/admin/companies/[id] - Get single company with all-locale metadata
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        metadata: true,
        insurances: { select: { id: true } },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    const metadataByLocale = company.metadata.reduce<Record<string, Record<string, string>>>(
      (acc, meta) => {
        if (!acc[meta.locale]) acc[meta.locale] = {};
        acc[meta.locale][meta.key] = meta.value;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      data: {
        id: company.id,
        slug: company.slug,
        logo: company.logo,
        isActive: company.isActive,
        createdBy: company.createdBy,
        updatedBy: company.updatedBy,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        metadata: metadataByLocale,
        insuranceCount: company.insurances.length,
      },
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch company',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/companies/[id] - Update slug / logo / metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { slug, logo, metadata } = body as {
      slug?: string;
      logo?: string | null;
      metadata?: { locale: string; key: string; value: string }[];
    };

    const admin = await getSessionAdmin();

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    try {
      await prisma.company.update({
        where: { id },
        data: {
          ...(slug !== undefined && { slug }),
          ...(logo !== undefined && { logo }),
          updatedBy: admin?.id ?? existing.updatedBy,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Slug already in use' },
          { status: 409 }
        );
      }
      throw err;
    }

    if (metadata && Array.isArray(metadata)) {
      await Promise.all(
        metadata.map((meta) =>
          prisma.companyMetadata.upsert({
            where: {
              companyId_locale_key: {
                companyId: id,
                locale: meta.locale,
                key: meta.key,
              },
            },
            create: {
              companyId: id,
              locale: meta.locale,
              key: meta.key,
              value: meta.value,
            },
            update: { value: meta.value },
          })
        )
      );
    }

    const refreshed = await prisma.company.findUnique({
      where: { id },
      include: { metadata: true },
    });

    return NextResponse.json({ success: true, data: refreshed });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update company',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/companies/[id] - Toggle isActive (soft delete / restore)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body as { isActive?: boolean };

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive (boolean) is required' },
        { status: 400 }
      );
    }

    const admin = await getSessionAdmin();

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        isActive,
        updatedBy: admin?.id ?? existing.updatedBy,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error patching company:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update company',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
