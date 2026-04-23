export interface InsuranceResponse {
    id: string;
    name: string;
    category: string;
    description: string;
    companyId: string;
    contentHtml?: string;
    contentJson?: any;
    contentText?: string;
    createdAt: Date;
    updatedAt: Date;
}