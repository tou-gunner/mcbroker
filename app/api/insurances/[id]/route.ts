import { NextRequest, NextResponse } from 'next/server';
import { getInsuranceById, insuranceApiResponse } from '@/app/services/insurance-detail';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const locale = request.nextUrl.searchParams.get('locale') || 'en';
    const insurance = await getInsuranceById(id, locale);
    if (!insurance) return NextResponse.json({ success: false, error: 'Insurance not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: insuranceApiResponse(insurance) });
  } catch {
    console.error('Public insurance detail could not be loaded');
    return NextResponse.json({ success: false, error: 'Failed to fetch insurance' }, { status: 500 });
  }
}
