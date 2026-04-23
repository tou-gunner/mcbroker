import { NextRequest, NextResponse } from "next/server";
import { getCompany } from "@/app/services/company";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const locale = request.nextUrl.searchParams.get('locale') || 'en';
    const data = await getCompany(id, locale);
    if (!data) {
        return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
};