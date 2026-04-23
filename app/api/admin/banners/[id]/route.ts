import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const banner = await prisma.banner.findUnique({ where: { id } });

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch banner',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { imageUrl, linkUrl, priority, isActive } = body;

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 },
      );
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(typeof imageUrl === 'string' && imageUrl && { imageUrl }),
        ...(typeof linkUrl !== 'undefined' && { linkUrl: linkUrl || null }),
        ...(typeof priority === 'number' && { priority }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: banner,
      message: 'Banner updated successfully',
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update banner',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 },
      );
    }

    await prisma.banner.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete banner',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
