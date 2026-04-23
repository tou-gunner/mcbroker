import { NextResponse, NextRequest } from "next/server";
import { CompanyResponse } from "@/app/interfaces";
import { getCompanyList } from "@/app/services/company";

export const GET = async (request: NextRequest) => {
    return NextResponse.json({
        success: true,
        data: await getCompanyList(),
    });
};