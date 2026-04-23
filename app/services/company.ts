import { CompanyResponse } from "@/app/interfaces";
import { prisma } from "@/app/lib/prisma";

type MetadataRow = { locale: string; key: string; value: string };

const pickMetadata = (metadata: MetadataRow[], locale: string, key: string): string =>
    metadata.find((m) => m.locale === locale && m.key === key)?.value
    ?? metadata.find((m) => m.locale === 'en' && m.key === key)?.value
    ?? '';

type CompanyWithRelations = {
    id: string;
    logo: string | null;
    createdAt: Date;
    updatedAt: Date;
    metadata: MetadataRow[];
    insurances: { category: { slug: string } }[];
};

const toResponse = (company: CompanyWithRelations, locale: string): CompanyResponse => ({
    id: company.id,
    name: pickMetadata(company.metadata, locale, 'name'),
    description: pickMetadata(company.metadata, locale, 'description'),
    logo: company.logo ?? '',
    available_insurances: Array.from(
        new Set(company.insurances.map((i) => i.category.slug)),
    ),
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
});

export const getCompanyList = async (locale: string = 'en'): Promise<CompanyResponse[]> => {
    const companies = await prisma.company.findMany({
        where: { isActive: true },
        include: {
            metadata: true,
            insurances: {
                where: { status: 'PUBLISHED' },
                select: { category: { select: { slug: true } } },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return companies.map((c) => toResponse(c, locale));
};

export const getCompany = async (
    id: string,
    locale: string = 'en',
): Promise<CompanyResponse | undefined> => {
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            metadata: true,
            insurances: {
                where: { status: 'PUBLISHED' },
                select: { category: { select: { slug: true } } },
            },
        },
    });

    if (!company || !company.isActive) return undefined;
    return toResponse(company, locale);
};
