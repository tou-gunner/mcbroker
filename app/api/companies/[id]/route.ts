import { NextRequest, NextResponse } from "next/server";
import { getCompany } from "@/app/services/company";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return NextResponse.json({
        success: true,
        data: await getCompany(id),
    });
};