import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/settings - Get all settings or by key
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const locale = searchParams.get('locale');

    const where: { key?: string; locale?: string } = {};
    if (key) where.key = key;
    if (locale) where.locale = locale;

    const settings = await prisma.setting.findMany({
      where,
      orderBy: [{ key: 'asc' }, { locale: 'asc' }]
    });

    // Group settings by key and locale for easier frontend usage
    const grouped: Record<string, Record<string, string>> = {};
    settings.forEach((setting) => {
      if (!grouped[setting.key]) {
        grouped[setting.key] = {};
      }
      grouped[setting.key][setting.locale] = setting.value;
    });

    return NextResponse.json({
      success: true,
      data: settings,
      grouped
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

// POST /api/admin/settings - Create or update settings (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({
        success: false,
        error: 'Settings array is required'
      }, { status: 400 });
    }

    // Upsert each setting
    const results = await Promise.all(
      settings.map(async (setting: { key: string; value: string; locale: string }) => {
        return prisma.setting.upsert({
          where: {
            key_locale: {
              key: setting.key,
              locale: setting.locale
            }
          },
          update: {
            value: setting.value
          },
          create: {
            key: setting.key,
            value: setting.value,
            locale: setting.locale
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

