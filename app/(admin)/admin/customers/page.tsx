'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdVisibility,
  MdSearch,
  MdFilterList,
  MdEmail,
  MdPhone,
  MdPerson,
  MdDownload
} from 'react-icons/md';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  totalPolicies: number;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/customers');
      // const data = await response.json();
      // setCustomers(data);
      
      // Mock data for demonstration
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'ທ້າວ ສົມຊາຍ ພັນນະວົງ',
          email: 'somchai@example.com',
          phone: '020 5551234',
          dateOfBirth: '1985-03-15',
          gender: 'Male',
          address: '123 ຖະໜົນເສດຖາ',
          city: 'ນະຄອນຫຼວງວຽງຈັນ',
          status: 'ACTIVE',
          totalPolicies: 3,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-11-20T14:30:00Z'
        },
        {
          id: '2',
          name: 'ນາງ ບຸນມີ ລາວົງ',
          email: 'bounmee@example.com',
          phone: '020 7778888',
          dateOfBirth: '1990-07-22',
          gender: 'Female',
          address: '456 ຖະໜົນຊຽງຍືນ',
          city: 'ນະຄອນຫຼວງວຽງຈັນ',
          status: 'ACTIVE',
          totalPolicies: 2,
          createdAt: '2024-02-20T09:15:00Z',
          updatedAt: '2024-11-18T11:20:00Z'
        },
        {
          id: '3',
          name: 'ທ້າວ ວິໄລ ສຸກສາວາດ',
          email: 'vilai@example.com',
          phone: '020 9991111',
          status: 'PENDING',
          totalPolicies: 0,
          createdAt: '2024-11-21T08:00:00Z',
          updatedAt: '2024-11-21T08:00:00Z'
        }
      ];
      
      setCustomers(mockCustomers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລູກຄ້ານີ້?')) {
      return;
    }

    try {
      // TODO: Implement delete API
      // await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      setCustomers(customers.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon');
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    };
    
    const statusLabels = {
      ACTIVE: 'ໃຊ້ງານ',
      INACTIVE: 'ບໍ່ໃຊ້ງານ',
      PENDING: 'ລໍຖ້າ'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ຈັດການລູກຄ້າ</h1>
          <p className="text-sm text-gray-600 mt-0.5">ຄຸ້ມຄອງຂໍ້ມູນລູກຄ້າ ແລະ ປະຫວັດການຊື້ປະກັນໄພ</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <MdDownload className="w-4 h-4" />
            <span>ສົ່ງອອກ</span>
          </button>
          
          <button
            onClick={() => router.push('/admin/customer/create')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm shadow-sm"
          >
            <MdAdd className="w-4 h-4" />
            <span>ເພີ່ມລູກຄ້າ</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາລູກຄ້າ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="ALL">ທຸກສະຖານະ</option>
              <option value="ACTIVE">ໃຊ້ງານ</option>
              <option value="INACTIVE">ບໍ່ໃຊ້ງານ</option>
              <option value="PENDING">ລໍຖ້າ</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600">
              ສະແດງ <span className="font-semibold">{filteredCustomers.length}</span> ລູກຄ້າ
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-3 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
          </div>
        ) : currentCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-3">
              <MdPerson className="w-14 h-14 mx-auto" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1.5">ບໍ່ພົບລູກຄ້າ</h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'ລອງປັບການຄົ້ນຫາຂອງທ່ານ' 
                : 'ເລີ່ມຕົ້ນໂດຍການເພີ່ມລູກຄ້າຄົນທຳອິດ'}
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <button
                onClick={() => router.push('/admin/customer/create')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
              >
                <MdAdd className="w-4 h-4" />
                <span>ເພີ່ມລູກຄ້າ</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ລູກຄ້າ
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ຕິດຕໍ່
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ທີ່ຢູ່
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ສະຖານະ
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ປະກັນ
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ວັນທີສ້າງ
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ການປະຕິບັດ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-2.5">
                            <span className="text-primary font-medium text-sm">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            {customer.dateOfBirth && (
                              <div className="text-xs text-gray-500">
                                {new Date(customer.dateOfBirth).toLocaleDateString('lo-LA')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {customer.email && (
                            <div className="flex items-center text-xs text-gray-600">
                              <MdEmail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center text-xs text-gray-600">
                              <MdPhone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-900">
                          {customer.address && <div>{customer.address}</div>}
                          {customer.city && <div className="text-gray-500">{customer.city}</div>}
                          {!customer.address && !customer.city && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(customer.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {customer.totalPolicies}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">ກົດ</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString('lo-LA')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => router.push(`/admin/customer/${customer.id}`)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                            title="ແກ້ໄຂ"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/customer/${customer.id}/view`)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="ເບິ່ງ"
                          >
                            <MdVisibility className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-1.5 text-secondary hover:bg-secondary/10 rounded transition-colors"
                            title="ລຶບ"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
                <div className="text-gray-600">
                  ໜ້າ {currentPage} ຈາກ {totalPages} | ສະແດງ {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} ຈາກ {filteredCustomers.length}
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ກ່ອນໜ້າ
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-1.5 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 border rounded-md text-sm font-medium ${
                            currentPage === page
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ຖັດໄປ
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

