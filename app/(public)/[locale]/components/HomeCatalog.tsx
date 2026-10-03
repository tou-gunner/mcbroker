"use client";
import { AppProvider } from '@/app/contexts';
import CategoriesSection from './CategoriesSection';
import CompanyListSection from './CompanyListSection';
export default function HomeCatalog() {
  return <AppProvider><CategoriesSection /><CompanyListSection /></AppProvider>;
}
