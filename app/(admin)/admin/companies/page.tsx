'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MdEdit,
  MdArchive,
  MdUnarchive,
  MdDeleteForever,
} from 'react-icons/md';
import { toast } from 'sonner';
import DataTable, {
  DataColumn,
  DataTableHandle,
} from '../components/DataTable';
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
  const tableRef = useRef<DataTableHandle>(null);

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
        tableRef.current?.reload();
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
        tableRef.current?.reload();
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('Error updating status');
    }
  };

  const columns: DataColumn<Company>[] = [
    {
      key: 'logo',
      label: 'Logo',
      render: (c) =>
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
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'insuranceCount', label: 'Insurances' },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (c) => (
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
    { key: 'updatedAt', label: 'Updated', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
        <p className="text-gray-600 mt-1">
          Manage insurance providers. Archived companies are hidden on the
          public site.
        </p>
      </div>

      <DataTable<Company>
        ref={tableRef}
        fetchUrl="/api/admin/companies"
        staticParams={{ locale: 'en' }}
        keyColumn="id"
        columns={columns}
        search={{ placeholder: 'Search by name or slug...' }}
        filters={[
          {
            key: 'isActive',
            label: 'Status',
            defaultValue: '',
            options: [
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Archived' },
            ],
          },
        ]}
        pagination={{ perPage: 20 }}
        defaultSort={{ key: 'slug', order: 'asc' }}
        onCreate={() => router.push('/admin/companies/create')}
        createLabel="Create Company"
        urlSync
        actions={(c) => (
          <>
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
          </>
        )}
      />
    </div>
  );
}
