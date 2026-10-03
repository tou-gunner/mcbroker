"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import type { CompanyResponse } from '@/app/interfaces/company';
import { categoryFilter, normalizeSearch, type CategoryFilter } from '@/app/utils/catalog';

interface CatalogState {
  companies: CompanyResponse[];
  filteredCompanies: CompanyResponse[];
  selectedFilter: CategoryFilter;
  query: string;
  status: 'loading' | 'ready' | 'error';
  setSelectedFilter: (filter: CategoryFilter) => void;
  setQuery: (query: string) => void;
  clearFilters: () => void;
  retry: () => void;
}
const AppContext = createContext<CatalogState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const selectedFilter = categoryFilter(searchParams.get('category'));
  const query = searchParams.get('q') ?? '';
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ locale: string; attempt: number; companies: CompanyResponse[]; status: 'ready' | 'error' } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/companies?locale=${locale}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Company request failed');
        const data = await response.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Invalid company response');
        if (!controller.signal.aborted) setResult({ locale, attempt, companies: data.data, status: 'ready' });
      } catch {
        if (!controller.signal.aborted) setResult({ locale, attempt, companies: [], status: 'error' });
      }
    }
    void load();
    return () => controller.abort();
  }, [locale, attempt]);

  const current = result?.locale === locale && result.attempt === attempt ? result : null;
  const companies = current?.companies ?? [];
  const needle = normalizeSearch(query);
  const filteredCompanies = companies.filter(company =>
    (selectedFilter === 'all' || company.available_insurances.includes(selectedFilter)) && normalizeSearch(company.name).includes(needle)
  );

  function updateUrl(changes: { category?: CategoryFilter; q?: string }, replace = false) {
    const url = new URL(window.location.href);
    if (changes.category !== undefined) {
      if (changes.category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', changes.category);
    }
    if (changes.q !== undefined) {
      if (changes.q) url.searchParams.set('q', changes.q);
      else url.searchParams.delete('q');
    }
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (replace) window.history.replaceState(null, '', next);
    else window.history.pushState(null, '', next);
  }

  return <AppContext.Provider value={{
    companies, filteredCompanies, query, selectedFilter, status: current?.status ?? 'loading',
    setSelectedFilter: category => updateUrl({ category }),
    setQuery: q => updateUrl({ q }, true),
    clearFilters: () => updateUrl({ category: 'all', q: '' }),
    retry: () => setAttempt(value => value + 1),
  }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('Catalog components require AppProvider');
  return context;
}
