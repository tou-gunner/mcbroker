'use client';

import { useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const confirm = useConfirm();
  const tableRef = useRef<DataTableHandle>(null);

  const handleHardDelete = async (company: Company) => {
    if (company.insuranceCount > 0) {
      toast.error(
        t('companies.cannotDelete', { count: company.insuranceCount })
      );
      return;
    }

    const ok = await confirm({
      title: t('companies.deleteConfirmTitle', { name: company.name }),
      description: t('companies.deleteConfirmDescription'),
      variant: 'danger',
      confirmLabel: t('companies.deleteConfirmLabel'),
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t('companies.deleteSuccess'));
        tableRef.current?.reload();
      } else {
        toast.error(t('companies.deleteFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error(t('companies.deleteError'));
    }
  };

  const handleToggleActive = async (company: Company) => {
    const nextState = !company.isActive;
    const ok = await confirm({
      title: nextState
        ? t('companies.activateConfirmTitle')
        : t('companies.archiveConfirmTitle'),
      description: nextState
        ? t('companies.activateDescription')
        : t('companies.archiveDescription'),
      variant: nextState ? 'default' : 'danger',
      confirmLabel: nextState ? t('companies.activate') : t('companies.archive'),
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
        toast.success(
          nextState ? t('companies.activated') : t('companies.archived')
        );
        tableRef.current?.reload();
      } else {
        toast.error(t('companies.deleteFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error(t('companies.statusUpdateError'));
    }
  };

  const columns: DataColumn<Company>[] = useMemo(
    () => [
      {
        key: 'logo',
        label: t('companies.columns.logo'),
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
      { key: 'name', label: t('companies.columns.name') },
      { key: 'slug', label: t('companies.columns.slug'), sortable: true },
      { key: 'insuranceCount', label: t('companies.columns.insurances') },
      {
        key: 'isActive',
        label: t('companies.columns.status'),
        sortable: true,
        render: (c) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              c.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {c.isActive ? t('companies.active') : t('companies.archived')}
          </span>
        ),
      },
      { key: 'updatedAt', label: t('companies.columns.updated'), sortable: true },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('companies.title')}</h1>
        <p className="text-gray-600 mt-1">{t('companies.subtitle')}</p>
      </div>

      <DataTable<Company>
        ref={tableRef}
        fetchUrl="/api/admin/companies"
        staticParams={{ locale: i18n.language }}
        keyColumn="id"
        columns={columns}
        search={{ placeholder: t('companies.searchPlaceholder') }}
        filters={[
          {
            key: 'isActive',
            label: t('companies.columns.status'),
            defaultValue: '',
            options: [
              { value: '', label: t('companies.filters.all') },
              { value: 'true', label: t('companies.filters.active') },
              { value: 'false', label: t('companies.filters.archived') },
            ],
          },
        ]}
        pagination={{ perPage: 20 }}
        defaultSort={{ key: 'slug', order: 'asc' }}
        onCreate={() => router.push('/admin/companies/create')}
        createLabel={t('companies.createLabel')}
        urlSync
        actions={(c) => (
          <>
            <button
              onClick={() => router.push(`/admin/companies/${c.id}`)}
              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
              title={t('common.edit')}
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
              title={c.isActive ? t('companies.archive') : t('companies.restore')}
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
                title={t('companies.deletePermanently')}
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
