import { NextResponse, NextRequest } from "next/server";
import { getCompanyList } from "@/app/services/company";

export const GET = async (request: NextRequest) => {
    const locale = request.nextUrl.searchParams.get('locale') || 'en';
    return NextResponse.json({
        success: true,
        data: await getCompanyList(locale),
    });
};