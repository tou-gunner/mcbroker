import { InsuranceResponse } from "@/app/interfaces";
import { prisma } from "@/app/lib/prisma";

const pickMetadata = (
    metadata: { locale: string; key: string; value: string }[],
    locale: string,
    key: string,
): string =>
    metadata.find((m) => m.locale === locale && m.key === key)?.value
    ?? metadata.find((m) => m.locale === 'en' && m.key === key)?.value
    ?? '';

export const getInsurancesByCompanyId = async (
    companyId: string,
    locale: string = 'en',
): Promise<InsuranceResponse[]> => {
    const insurances = await prisma.insurance.findMany({
        where: { companyId, status: 'PUBLISHED', company: { isActive: true } },
        include: {
            category: { include: { metadata: { where: { key: 'name' } } } },
            metadata: true,
        },
        orderBy: [
            { featured: 'desc' },
            { priority: 'desc' },
            { createdAt: 'desc' },
        ],
    });

    return insurances.map((insurance) => ({
        id: insurance.id,
        name: pickMetadata(insurance.metadata, locale, 'name'),
        description: pickMetadata(insurance.metadata, locale, 'description'),
        category: insurance.category.slug,
        companyId: insurance.companyId,
        thumbnail: insurance.thumbnail ?? undefined,
        createdAt: insurance.createdAt,
        updatedAt: insurance.updatedAt,
    }));
};

export { getInsuranceById } from './insurance-detail';
