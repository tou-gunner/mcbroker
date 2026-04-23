import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/settings - Get public settings by key prefix (e.g., hero_*)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix');
    const locale = searchParams.get('locale') || 'en';

    let settings;

    if (prefix) {
      settings = await prisma.setting.findMany({
        where: {
          key: { startsWith: prefix },
          locale
        },
        orderBy: { key: 'asc' }
      });
    } else {
      settings = await prisma.setting.findMany({
        where: { locale },
        orderBy: { key: 'asc' }
      });
    }

    // Convert to key-value object for easy consumption
    const data: Record<string, string> = {};
    settings.forEach((setting) => {
      data[setting.key] = setting.value;
    });

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

