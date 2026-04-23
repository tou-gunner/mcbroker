import { InsuranceResponse } from "@/app/interfaces";

const sampleInsurances: InsuranceResponse[] = [
    {
        id: "1",
        name: "Life Insurance",
        category: "life",
        description: "Life Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "2",
        name: "Health Insurance",
        category: "health",
        description: "Health Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "3",
        name: "Accident Insurance",
        category: "accident",
        description: "Accident Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "4",
        name: "Travel Insurance",
        category: "travel",
        description: "Travel Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "5",
        name: "Home Insurance",
        category: "home",
        description: "Home Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "6",
        name: "Car Insurance",
        category: "car",
        description: "Car Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "7",
        name: "Business Insurance",
        category: "business",
        description: "Business Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "3",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "8",
        name: "Life Insurance",
        category: "life",
        description: "Life Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "3",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "9",
        name: "Accident Insurance",
        category: "accident",
        description: "Accident Insurance is a type of insurance that provides a financial benefit to the insured's beneficiaries in the event of the insured's death.",
        companyId: "3",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

export const getInsurancesByCompanyId: (companyId: string) => Promise<InsuranceResponse[]> = (companyId: string) => new Promise((resolve) => {
    resolve(sampleInsurances.filter((insurance) => insurance.companyId === companyId));
});

export const getInsuranceById = async (id: string, locale: string = 'en'): Promise<InsuranceResponse | undefined> => {
    try {
        // Use absolute URL for server-side fetching
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
        const response = await fetch(`${baseUrl}/api/insurances/${id}?locale=${locale}`, {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            return undefined;
        }
        
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching insurance by ID:', error);
        return undefined;
    }
};