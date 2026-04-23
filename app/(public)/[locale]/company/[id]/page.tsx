import { getCompany, getInsurancesByCompanyId } from "@/app/services";
import { getInsuranceLogo } from "@/app/utils";
import Image from "next/image";

export default async function CompanyPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const company = await getCompany(id, locale);
  const insurances = await getInsurancesByCompanyId(id, locale);

  if (!company) {
    return <div>Company not found</div>;
  }

  return <div>
    <div className="w-full min-h-[100px] md:px-[10%] bg-[#2d3538] flex flex-col items-center justify-end p-6">
        <div className="flex items-center gap-2 mb-6">
            <Image src={company.logo} alt={company.name} width={100} height={100} />
        </div>
        <h1 className="text-primary text-4xl font-bold mb-6">{company.name}</h1>
        <p className="text-white text-sm">{company.description}</p>
    </div>
    <div className="min-h-[300px] p-6 bg-linear-to-b from-white via-blue-600 to-black">
        <div className="grid grid-cols-[repeat(1,max-content)] md:grid-cols-[repeat(2,max-content)] lg:grid-cols-[repeat(3,max-content)] gap-6 justify-center">
        {insurances.map((insurance) => {
            const IconComponent = getInsuranceLogo(insurance.category);
            return (
            <div key={insurance.id} className="cursor-pointer hover:scale-105 transition-all duration-300 flex flex-col items-center justify-between bg-white rounded w-80 h-50">
                <div className="grow flex items-center justify-center w-full bg-[#f8f2ea] rounded-t">
                <IconComponent className="text-6xl text-primary" />
                </div>
                <h4 className="text-secondary text-2xl font-bold p-6">{insurance.name}</h4>
            </div>
            );
        })}
        </div>
    </div>
  </div>;
}