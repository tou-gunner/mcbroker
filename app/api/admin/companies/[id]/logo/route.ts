import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionAdmin } from '@/app/lib/session';
import { deleteObjects, keyFromPublicUrl } from '@/app/lib/s3';

// DELETE /api/admin/companies/[id]/logo - Clear logo and remove S3 object
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    if (!company.logo) {
      return NextResponse.json({ success: true, data: { removed: false, keyDeleted: null } });
    }

    const key = keyFromPublicUrl(company.logo);

    let keyDeleted: string | null = null;
    if (key && key.startsWith('companies/')) {
      await deleteObjects([key]);
      keyDeleted = key;
    }

    const admin = await getSessionAdmin();
    await prisma.company.update({
      where: { id },
      data: {
        logo: null,
        updatedBy: admin?.id ?? company.updatedBy,
      },
    });

    return NextResponse.json({ success: true, data: { removed: true, keyDeleted } });
  } catch (error) {
    console.error('Error deleting company logo:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete logo',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
