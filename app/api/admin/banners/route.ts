import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, linkUrl, priority, isActive } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'imageUrl is required' },
        { status: 400 },
      );
    }

    const banner = await prisma.banner.create({
      data: {
        imageUrl,
        linkUrl: linkUrl || null,
        priority: typeof priority === 'number' ? priority : 0,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
    });

    return NextResponse.json(
      { success: true, data: banner, message: 'Banner created successfully' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create banner',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
