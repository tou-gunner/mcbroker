'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { CompanyResponse } from '@/app/interfaces'

interface AppContextType {
  // Company data
  companies: CompanyResponse[]
  setCompanies: (companies: CompanyResponse[]) => void
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  // Error handling
  error: string | null
  setError: (error: string | null) => void
  
  // Filters
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
  
  // Utility functions
  fetchCompanies: () => Promise<void>
  getFilteredCompanies: (filter?: string) => CompanyResponse[]
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const locale = useLocale()
  const [companies, setCompanies] = useState<CompanyResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState('all')

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies?locale=${locale}`)
      const data = await response.json()

      if (data.success) {
        setCompanies(data.data)
      } else {
        setError(data.message || 'Failed to fetch companies')
      }
    } catch (err) {
      setError('An error occurred while fetching companies')
      console.error('Error fetching companies:', err)
    } finally {
      setIsLoading(false)
    }
  }, [locale])

  const getFilteredCompanies = useCallback((filter?: string) => {
    const activeFilter = filter ?? selectedFilter
    
    if (activeFilter === 'all') {
      return companies
    }
    
    return companies.filter(company => 
      company.available_insurances.includes(activeFilter)
    )
  }, [companies, selectedFilter])

  const value: AppContextType = {
    companies,
    setCompanies,
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedFilter,
    setSelectedFilter,
    fetchCompanies,
    getFilteredCompanies,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  
  return context
}

