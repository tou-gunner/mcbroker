'use client';

import { useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MdEdit, MdDelete } from 'react-icons/md';
import { toast } from 'sonner';
import DataTable, {
  DataColumn,
  DataTableHandle,
} from '../components/DataTable';
import { useConfirm } from '../components/DialogProvider';

interface Insurance {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function InsuranceListPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const confirm = useConfirm();
  const tableRef = useRef<DataTableHandle>(null);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('insurances.deleteConfirmTitle'),
      description: t('insurances.deleteConfirmDescription'),
      variant: 'danger',
      confirmLabel: t('common.delete'),
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/admin/insurances/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast.success(t('insurances.deleteSuccess'));
        tableRef.current?.reload();
      } else {
        toast.error(t('insurances.deleteFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error deleting insurance:', error);
      toast.error(t('insurances.deleteError'));
    }
  };

  const columns: DataColumn<Insurance>[] = useMemo(
    () => [
      { key: 'name', label: t('insurances.columns.name') },
      { key: 'slug', label: t('insurances.columns.slug'), sortable: true },
      {
        key: 'status',
        label: t('insurances.columns.status'),
        sortable: true,
        render: (i) => (
          <span
            className={`text-sm font-medium ${
              i.status === 'PUBLISHED' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {i.status}
          </span>
        ),
      },
      { key: 'featured', label: t('insurances.columns.featured'), sortable: true },
      { key: 'category', label: t('insurances.columns.category') },
      { key: 'company', label: t('insurances.columns.company') },
      { key: 'createdAt', label: t('insurances.columns.createdAt'), sortable: true },
      { key: 'updatedAt', label: t('insurances.columns.updatedAt'), sortable: true },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('insurances.title')}
        </h1>
        <p className="text-gray-600 mt-1">{t('insurances.subtitle')}</p>
      </div>

      <DataTable<Insurance>
        ref={tableRef}
        fetchUrl="/api/admin/insurances"
        staticParams={{ locale: i18n.language }}
        keyColumn="id"
        columns={columns}
        search={{ placeholder: t('insurances.searchPlaceholder') }}
        filters={[
          {
            key: 'status',
            label: t('insurances.columns.status'),
            defaultValue: 'ALL',
            options: [
              { value: 'ALL', label: t('insurances.status.all') },
              { value: 'DRAFT', label: t('insurances.status.draft') },
              { value: 'PUBLISHED', label: t('insurances.status.published') },
              { value: 'ARCHIVED', label: t('insurances.status.archived') },
              { value: 'UNDER_REVIEW', label: t('insurances.status.underReview') },
            ],
          },
        ]}
        pagination={{ perPage: 20 }}
        onCreate={() => router.push('/admin/insurances/create')}
        createLabel={t('insurances.createLabel')}
        urlSync
        actions={(i) => (
          <>
            <button
              onClick={() => router.push(`/admin/insurances/${i.id}`)}
              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
              title={t('common.edit')}
            >
              <MdEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(i.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title={t('common.delete')}
            >
              <MdDelete className="w-4 h-4" />
            </button>
          </>
        )}
      />
    </div>
  );
}
