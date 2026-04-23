'use client';

import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { FaBars, FaTimes, FaChevronDown } from "react-icons/fa";
import LocaleSwitcher from "./LocaleSwitcher";
import { useAppContext } from "@/app/contexts";
import Image from "next/image";

interface MenuItem {
    label: string;
    href?: string;
    active?: boolean;
    items?: MenuItem[];
}
    
export default function NavigationBar() {
    const { companies, fetchCompanies } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        // Fetch companies if not already loaded
        if (companies.length === 0) {
            fetchCompanies();
        }
    }, [companies.length, fetchCompanies]);

    const menuItems: MenuItem[] = [
        { label: "ໜ້າຫຼັກ", href: "/", active: true },
        { 
            label: "ບໍລິສັດປະກັນໄພ", 
            items: companies.map(company => ({
                label: company.name,
                href: `/company/${company.id}`
            }))
        },
    ];
    
    const toggleMenu = () => {
        setIsOpen(!isOpen);
        if (isOpen) {
            setMobileOpenDropdown(null);
        }
    };
    
    const toggleDropdown = (label: string) => {
        setOpenDropdown(openDropdown === label ? null : label);
    };
    
    const toggleMobileDropdown = (label: string) => {
        setMobileOpenDropdown(mobileOpenDropdown === label ? null : label);
    };
    
    return (
        <div className="sticky top-0 z-100">
            <div className="w-full h-[60px] text-lg bg-white shadow-md flex items-center justify-between px-8">
                <Link href="/" className="-ms-8 mt-3"><img src="/logo/logo.png" alt="MC" className="h-[75px]" /></Link>
                <div className="md:flex hidden items-center justify-center gap-6">
                    {menuItems.map((item, index) => (
                        <div key={item.href || index} className="relative group">
                            {item.items ? (
                                <>
                                    <button 
                                        onClick={() => toggleDropdown(item.label)}
                                        className={`flex items-center gap-1 ${item.active ? "text-primary" : ""} hover:text-primary transition-colors`}
                                    >
                                        {item.label}
                                        <FaChevronDown className={`text-xs transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                                    </button>
                                    {openDropdown === item.label && (
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg rounded-md py-2 z-50">
                                            {item.items.map((subItem) => (
                                                <Link
                                                    key={subItem.href}
                                                    href={subItem.href || ""}
                                                    className="block px-4 py-2 hover:bg-gray-50 hover:text-primary transition-colors"
                                                    onClick={() => setOpenDropdown(null)}
                                                >
                                                    {subItem.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link href={item.href || ""} className={item.active ? "text-primary" : ""}>{item.label}</Link>
                            )}
                        </div>
                    ))}
                    <LocaleSwitcher />
                </div>
                <div className="md:hidden flex items-center justify-center gap-6">
                    <LocaleSwitcher />
                    {isOpen ? (
                        <FaTimes className="text-2xl text-primary cursor-pointer" onClick={toggleMenu} />
                    ) : (
                        <FaBars className="text-2xl text-primary cursor-pointer" onClick={toggleMenu} />
                    )}
                </div>
            </div>
            
            {/* Mobile Dropdown Menu */}
            {isOpen && (
                <div className="md:hidden w-full bg-white shadow-lg">
                    <div className="flex flex-col">
                        {menuItems.map((item, index) => (
                            <div key={item.href || index}>
                                {item.items ? (
                                    <>
                                        <button
                                            onClick={() => toggleMobileDropdown(item.label)}
                                            className={`w-full text-left px-8 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between ${item.active ? "text-primary font-semibold" : "text-gray-700"}`}
                                        >
                                            {item.label}
                                            <FaChevronDown className={`text-xs transition-transform ${mobileOpenDropdown === item.label ? "rotate-180" : ""}`} />
                                        </button>
                                        {mobileOpenDropdown === item.label && (
                                            <div className="bg-gray-50">
                                                {item.items.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href || ""}
                                                        className="block px-12 py-3 border-b border-gray-100 hover:bg-gray-100 transition-colors text-gray-600"
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            setMobileOpenDropdown(null);
                                                        }}
                                                    >
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link 
                                        href={item.href || ""} 
                                        className={`px-8 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.active ? "text-primary font-semibold" : "text-gray-700"}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}