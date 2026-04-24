export interface InsuranceResponse {
    id: string;
    name: string;
    category: string;
    description: string;
    companyId: string;
    thumbnail?: string;
    contentHtml?: string;
    contentJson?: any;
    contentText?: string;
    createdAt: Date;
    updatedAt: Date;
}