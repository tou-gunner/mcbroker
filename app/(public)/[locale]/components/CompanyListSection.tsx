'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useAppContext } from '@/app/contexts'
import { CompanyResponse } from '@/app/interfaces/company'

export default function CompanyListSection() {
    const t = useTranslations('companies')
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
        { label: t('filter.all'), value: 'all' },
        { label: t('filter.life'), value: 'life' },
        { label: t('filter.accident'), value: 'accident' },
        { label: t('filter.health'), value: 'health' },
    ]

    const filteredCompanies = getFilteredCompanies()

    return (
        <section id="company-list" className="w-full bg-slate-50 py-16 md:py-24 px-6 md:px-10 scroll-mt-20">
            <div className="max-w-6xl mx-auto flex flex-col items-center gap-8">
                <div className="text-center">
                    <div className="text-accent text-sm font-semibold tracking-[0.2em] uppercase mb-3">
                        {t('eyebrow')}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                        {t('title')}
                    </h2>
                </div>
                <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSelectedFilter(option.value)}
                            className={`${selectedFilter === option.value
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200'
                                } text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer transition-all duration-200`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5 w-full">
                    {isLoading ? (
                        <div className="col-span-full flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        filteredCompanies.map((company) => (
                            <CompanyCard key={company.id} company={company} />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}

function CompanyCard({ company }: { company: CompanyResponse }) {
    return (
        <Link
            href={`/company/${company.id}`}
            className="group bg-white rounded-2xl p-4 aspect-[4/3] flex items-center justify-center ring-1 ring-slate-200 hover:ring-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
            <img
                src={company.logo || ''}
                alt={company.name || ''}
                className="max-h-20 max-w-full object-contain"
            />
        </Link>
    )
}
