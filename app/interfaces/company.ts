export interface CompanyResponse {
    id: string;
    name: string;
    logo: string;
    description: string;
    available_insurances: string[];
    createdAt: Date;
    updatedAt: Date;
}