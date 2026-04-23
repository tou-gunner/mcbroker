import { NextRequest, NextResponse } from "next/server";
import { getInsurancesByCompanyId } from "@/app/services/insurance";

export const GET = async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
        return NextResponse.json({
            success: false,
            error: 'companyId is required',
        }, { status: 400 });
    }
    
    return NextResponse.json({
        success: true,
        data: await getInsurancesByCompanyId(companyId),
    });
};