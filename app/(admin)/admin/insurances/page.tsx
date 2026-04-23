'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdVisibility,
  MdSearch,
  MdFilterList
} from 'react-icons/md';
import DataTable, { DataColumn } from '../components/DataTable';

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
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchKeys, setSearchKeys] = useState(['name', 'company.name']);
  const [insurances, setInsurances] = useState<Insurance[]>([]);

  const columns: DataColumn[] = [
    { key: 'id', label: 'ID', isId: true, hidden: true },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (insurance: Insurance) => <span className={`text-sm font-medium ${insurance.status === 'PUBLISHED' ? 'text-green-600' : 'text-red-600'}`}>{insurance.status}</span> 
    },
    { key: 'featured', label: 'Featured' },
    { key: 'category', label: 'Category' },
    { key: 'company', label: 'Company' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
  ];

  useEffect(() => {
    fetchInsurances();
  }, [statusFilter]);

  const fetchInsurances = async () => {
    try {
      const params = new URLSearchParams({
        locale: 'en',
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      });
      
      const response = await fetch(`/api/admin/insurances?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setInsurances(result.data);
      } else {
        console.error('Failed to fetch insurances:', result.error);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching insurances:', error);
      setLoading(false);
    }
  };

  const filteredInsurances = insurances.filter(insurance => {
    const matchesSearch = 
      insurance.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insurance.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this insurance?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/insurances/${id}`, { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Insurance deleted successfully');
      fetchInsurances();
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting insurance:', error);
      alert('Error deleting insurance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insurance Management</h1>
          <p className="text-gray-600 mt-1">Manage insurance content and details</p>
        </div>
        
        <button
          onClick={() => router.push('/admin/insurances/create')}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
        >
          <MdAdd className="w-5 h-5" />
          <span>Create Insurance</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search insurances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
              <option value="UNDER_REVIEW">Under Review</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredInsurances.length}</span> insurance{filteredInsurances.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
            <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading items...</p>
            </div>
        ) : (
      <DataTable items={filteredInsurances} columns={columns} />
        )}
    </div>
  );
}

