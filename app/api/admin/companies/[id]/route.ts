import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionAdmin } from '@/app/lib/session';
import { copyObject, deleteObjects, keyFromPublicUrl, publicUrl } from '@/app/lib/s3';

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

    // Slug change: if the company has a logo under companies/<old-slug>/,
    // rename it to companies/<new-slug>/ so the key stays aligned with the
    // slug. Callers can still override `logo` explicitly; their value wins.
    let effectiveLogo: string | null | undefined = logo;
    let renamedLogoKey: { from: string; to: string } | null = null;
    const slugChanging = slug !== undefined && slug !== existing.slug;

    if (slugChanging && existing.logo && logo === undefined) {
      const oldKey = keyFromPublicUrl(existing.logo);
      if (oldKey && oldKey.startsWith('companies/')) {
        const ext = oldKey.split('.').pop() ?? 'jpg';
        const newKey = `companies/${slug}/logo.${ext}`;
        if (oldKey !== newKey) {
          try {
            await copyObject(oldKey, newKey);
            effectiveLogo = publicUrl(newKey);
            renamedLogoKey = { from: oldKey, to: newKey };
          } catch (err) {
            console.error('Failed to copy logo during slug rename:', err);
            return NextResponse.json(
              { success: false, error: 'Failed to rename logo during slug change' },
              { status: 500 }
            );
          }
        }
      }
    }

    try {
      await prisma.company.update({
        where: { id },
        data: {
          ...(slug !== undefined && { slug }),
          ...(effectiveLogo !== undefined && { logo: effectiveLogo }),
          updatedBy: admin?.id ?? existing.updatedBy,
        },
      });
    } catch (err: any) {
      // DB update failed: if we already copied the logo, clean up the copy
      // so we don't leak an orphan at the new path.
      if (renamedLogoKey) {
        await deleteObjects([renamedLogoKey.to]).catch((e) =>
          console.error('Failed to clean up copied logo after DB error:', e)
        );
      }
      if (err?.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Slug already in use' },
          { status: 409 }
        );
      }
      throw err;
    }

    // Best-effort cleanup of the old logo object after a successful rename.
    if (renamedLogoKey) {
      await deleteObjects([renamedLogoKey.from]).catch((e) =>
        console.error('Failed to delete old logo after rename:', e)
      );
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

// DELETE /api/admin/companies/[id] - Hard delete; blocked if insurances linked
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { insurances: true } } },
    });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company._count.insurances > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Company has ${company._count.insurances} linked insurance${
            company._count.insurances === 1 ? '' : 's'
          }. Remove them first.`,
        },
        { status: 409 }
      );
    }

    if (company.logo) {
      const key = keyFromPublicUrl(company.logo);
      if (key && key.startsWith('companies/')) {
        await deleteObjects([key]);
      }
    }

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete company',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
