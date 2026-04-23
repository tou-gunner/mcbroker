import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        imageUrl: true,
        linkUrl: true,
      },
    });

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    console.error('Error fetching public banners:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch banners',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
