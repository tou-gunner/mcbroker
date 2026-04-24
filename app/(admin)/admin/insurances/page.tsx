'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const confirm = useConfirm();
  const tableRef = useRef<DataTableHandle>(null);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete insurance?',
      description: 'This action cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    try {
      const response = await fetch(`/api/admin/insurances/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Insurance deleted successfully');
        tableRef.current?.reload();
      } else {
        toast.error(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting insurance:', error);
      toast.error('Error deleting insurance');
    }
  };

  const columns: DataColumn<Insurance>[] = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug', sortable: true },
    {
      key: 'status',
      label: 'Status',
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
    { key: 'featured', label: 'Featured', sortable: true },
    { key: 'category', label: 'Category' },
    { key: 'company', label: 'Company' },
    { key: 'createdAt', label: 'Created At', sortable: true },
    { key: 'updatedAt', label: 'Updated At', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Insurance Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage insurance content and details
        </p>
      </div>

      <DataTable<Insurance>
        ref={tableRef}
        fetchUrl="/api/admin/insurances"
        staticParams={{ locale: 'en' }}
        keyColumn="id"
        columns={columns}
        search={{ placeholder: 'Search insurances...' }}
        filters={[
          {
            key: 'status',
            label: 'Status',
            defaultValue: 'ALL',
            options: [
              { value: 'ALL', label: 'All Status' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ARCHIVED', label: 'Archived' },
              { value: 'UNDER_REVIEW', label: 'Under Review' },
            ],
          },
        ]}
        pagination={{ perPage: 20 }}
        onCreate={() => router.push('/admin/insurances/create')}
        createLabel="Create Insurance"
        urlSync
        actions={(i) => (
          <>
            <button
              onClick={() => router.push(`/admin/insurances/${i.id}`)}
              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
              title="Edit"
            >
              <MdEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(i.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <MdDelete className="w-4 h-4" />
            </button>
          </>
        )}
      />
    </div>
  );
}
