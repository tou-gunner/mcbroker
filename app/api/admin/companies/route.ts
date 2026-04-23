import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionAdmin } from '@/app/lib/session';

// GET /api/admin/companies - Get all insurance companies
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'en';

    const companies = await prisma.company.findMany({
      include: {
        metadata: {
          where: { locale }
        },
        insurances: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        slug: 'asc'
      }
    });

    const formattedCompanies = companies.map(company => ({
      id: company.id,
      slug: company.slug,
      logo: company.logo,
      isActive: company.isActive,
      name: company.metadata.find(m => m.key === 'name')?.value || company.slug,
      insuranceCount: company.insurances.length,
      createdBy: company.createdBy,
      updatedBy: company.updatedBy,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedCompanies
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch companies',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/admin/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, logo, metadata } = body;

    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Slug is required'
      }, { status: 400 });
    }

    if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Metadata is required with at least one locale'
      }, { status: 400 });
    }

    const admin = await getSessionAdmin();

    // Create company with metadata
    const company = await prisma.company.create({
      data: {
        slug,
        logo: logo || null,
        createdBy: admin?.id ?? null,
        updatedBy: admin?.id ?? null,
        metadata: {
          create: metadata.map((meta: any) => ({
            locale: meta.locale,
            key: meta.key,
            value: meta.value
          }))
        }
      },
      include: {
        metadata: true
      }
    });

    return NextResponse.json({
      success: true,
      data: company,
      message: 'Company created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create company',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

