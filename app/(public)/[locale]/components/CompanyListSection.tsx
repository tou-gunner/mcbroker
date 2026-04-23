'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { useAppContext } from '@/app/contexts'
import { CompanyResponse } from '@/app/interfaces/company'

export default function CompanyListSection() {
    const { 
        selectedFilter, 
        setSelectedFilter, 
        isLoading, 
        fetchCompanies,
        getFilteredCompanies 
    } = useAppContext()

    useEffect(() => {
        fetchCompanies()
    }, [fetchCompanies])

    const filterOptions = [
        { label: "ທັງໝົດ", value: "all" },
        { label: "ປະກັນຊີວິດ", value: "life" },
        { label: "ປະກັນອຸບັດຕິເຫດ", value: "accident" },
        { label: "ປະກັນສຸຂະພາບ", value: "health" },
    ]

    const filteredCompanies = getFilteredCompanies()
    
    return (
        <div className="w-full min-h-[500px] px-[10%] bg-linear-to-b from-white via-blue-600 to-black flex flex-col items-center justify-start gap-8 p-12">
            <h1 className="text-primary text-5xl font-bold text-center">ບໍລິສັດປະກັນໄພ</h1>
            <div className="flex items-center justify-center gap-4 flex-wrap">
                {filterOptions.map((option) => (
                    <button 
                        key={option.value} 
                        onClick={() => setSelectedFilter(option.value)}
                        className={`${selectedFilter === option.value ? "bg-primary text-white" : "bg-white text-primary"} text-sm px-4 py-2 rounded cursor-pointer`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full max-w-6xl">
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    filteredCompanies.map((company) => (
                        <CompanyCard key={company.id} company={company} />
                    ))
                )}
            </div>
        </div>
    );
}

function CompanyCard({ company }: { company: CompanyResponse }) {
    return (
        <div className="flex justify-center">
            <Link href={`/company/${company.id}`} className="w-[200px] bg-white p-4 rounded-lg shadow-lg flex flex-col items-center justify-center cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300">
                <img src={company.logo || ''} alt={company.name || ''} className="object-contain" />
            </Link>
        </div>
    )
}