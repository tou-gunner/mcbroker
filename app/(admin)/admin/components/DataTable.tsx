import { useState, useEffect } from "react";
import { MdFilterList, MdAdd, MdEdit, MdVisibility, MdDelete } from "react-icons/md";
import { useRouter } from "next/navigation";

export interface DataColumn {
    key: string;
    label: string;
    isId?: boolean;
    hidden?: boolean;
    render?: (item: any) => React.ReactNode;
    sortable?: boolean;
    searchable?: boolean;
    filterable?: boolean;
    filterOptions?: string[];
    filterValue?: string;
    filterOnChange?: (value: string) => void;
}

export interface DataTableProps {
    items: any[];
    onCreate?: () => void;
    actions?: React.ReactNode;
    columns: DataColumn[];
    searchKeys?: string[];
    searchTerm?: string;
}

export default function DataTable({ items, onCreate, actions, columns, searchKeys, searchTerm }: DataTableProps) {
    const idKey = columns.find(column => column.isId)?.key || 'id';
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {items.length === 0 ? (
            <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
                <MdFilterList className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">
                {searchTerm
                ? 'Try adjusting your filters' 
                : 'Get started by creating your first item'}
            </p>
            {!searchTerm && onCreate && (
                <button
                onClick={onCreate}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                <MdAdd className="w-5 h-5" />
                    <span>Create</span>
                </button>
            )}
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    {columns.filter(column => !column.hidden).map((column) => (
                        <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column.label}
                        </th>
                    ))}
                    {actions && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                    <tr key={item[idKey]} className="hover:bg-gray-50 transition-colors">
                        {columns.filter(column => !column.hidden).map((column) => {
                            let value = item[column.key];
                            
                            // If there's a render function, use it
                            if (column.render) {
                                value = column.render(item);
                            } else {
                                // Handle different value types
                                if (value === null || value === undefined) {
                                    value = '-';
                                } else if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('T')) {
                                    // Format ISO date strings
                                    value = new Date(value).toLocaleDateString();
                                } else if (typeof value === 'object' && value !== null) {
                                    // If it's an object, try to get name, title, or label property
                                    value = value.name || value.title || value.label || JSON.stringify(value);
                                } else if (typeof value === 'boolean') {
                                    value = value ? 'Yes' : 'No';
                                }
                            }
                            
                            return (
                                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                                    {value}
                                </td>
                            );
                        })}
                        {actions && <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                            {actions}
                            </div>
                        </td>}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        </div>
    );
}