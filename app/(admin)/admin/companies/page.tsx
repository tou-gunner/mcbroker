'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MdAdd,
  MdEdit,
  MdArchive,
  MdUnarchive,
  MdDeleteForever,
  MdSearch,
  MdFilterList,
} from 'react-icons/md';
import { toast } from 'sonner';
import DataTable, { DataColumn } from '../components/DataTable';
import { useConfirm } from '../components/DialogProvider';

interface Company {
  id: string;
  slug: string;
  logo: string | null;
  isActive: boolean;
  name: string;
  insuranceCount: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CompanyListPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(
    'ALL'
  );
  const [companies, setCompanies] = useState<Company[]>([]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies?locale=en');
      const result = await res.json();
      if (result.success) {
        setCompanies(result.data);
      } else {
        console.error('Failed to fetch companies:', result.error);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleHardDelete = async (company: Company) => {
    if (company.insuranceCount > 0) {
      toast.error(
        `Cannot delete: ${company.insuranceCount} linked insurance${
          company.insuranceCount === 1 ? '' : 's'
        }.`
      );
      return;
    }

    const ok = await confirm({
      title: `Delete "${company.name}" permanently?`,
      description:
        'This cannot be undone. The company, its metadata, and its logo file will be removed.',
      variant: 'danger',
      confirmLabel: 'Delete permanently',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Company deleted');
        fetchCompanies();
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Error deleting company');
    }
  };

  const handleToggleActive = async (company: Company) => {
    const nextState = !company.isActive;
    const ok = await confirm({
      title: nextState ? 'Activate company?' : 'Archive company?',
      description: nextState
        ? 'Company will become visible on the public site.'
        : 'Company will be hidden from the public site. You can restore it later.',
      variant: nextState ? 'default' : 'danger',
      confirmLabel: nextState ? 'Activate' : 'Archive',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(nextState ? 'Activated' : 'Archived');
        fetchCompanies();
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('Error updating status');
    }
  };

  const columns: DataColumn[] = [
    { key: 'id', label: 'ID', isId: true, hidden: true },
    {
      key: 'logo',
      label: 'Logo',
      render: (c: Company) =>
        c.logo ? (
          <div className="relative w-12 h-12 bg-gray-50 border border-gray-200 rounded overflow-hidden">
            <Image
              src={c.logo}
              alt={c.name}
              fill
              className="object-contain p-1"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
            —
          </div>
        ),
    },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'insuranceCount', label: 'Insurances' },
    {
      key: 'isActive',
      label: 'Status',
      render: (c: Company) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            c.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {c.isActive ? 'Active' : 'Archived'}
        </span>
      ),
    },
    { key: 'updatedAt', label: 'Updated' },
    {
      key: 'actions',
      label: 'Actions',
      render: (c: Company) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => router.push(`/admin/companies/${c.id}`)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
            title="Edit"
          >
            <MdEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(c)}
            className={`p-1.5 rounded transition-colors ${
              c.isActive
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={c.isActive ? 'Archive' : 'Restore'}
          >
            {c.isActive ? (
              <MdArchive className="w-4 h-4" />
            ) : (
              <MdUnarchive className="w-4 h-4" />
            )}
          </button>
          {c.insuranceCount === 0 && (
            <button
              onClick={() => handleHardDelete(c)}
              className="p-1.5 text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Delete permanently"
            >
              <MdDeleteForever className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filtered = companies.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      c.name?.toLowerCase().includes(term) ||
      c.slug?.toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.isActive) ||
      (statusFilter === 'INACTIVE' && !c.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">
            Manage insurance providers. Archived companies are hidden on the
            public site.
          </p>
        </div>

        <button
          onClick={() => router.push('/admin/companies/create')}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
        >
          <MdAdd className="w-5 h-5" />
          <span>Create Company</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="relative">
            <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Archived</option>
            </select>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filtered.length}</span>{' '}
              compan{filtered.length === 1 ? 'y' : 'ies'}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading companies...</p>
        </div>
      ) : (
        <DataTable items={filtered} columns={columns} />
      )}
    </div>
  );
}
