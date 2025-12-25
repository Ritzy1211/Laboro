'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Check,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Checkbox from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface EnterpriseDataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  
  // Selection
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  
  // Pagination
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  
  // Search & Filter
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filterComponent?: React.ReactNode;
  
  // Actions
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  bulkActions?: React.ReactNode;
  
  // Export
  exportable?: boolean;
  onExport?: () => void;
  
  className?: string;
}

function EnterpriseDataTable<T extends { id: string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortBy,
  sortOrder,
  onSort,
  page = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  onPageSizeChange,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  filterComponent,
  onRowClick,
  rowActions,
  bulkActions,
  exportable = false,
  onExport,
  className,
}: EnterpriseDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((row) => row.id));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedRows.includes(id)) {
      onSelectionChange(selectedRows.filter((rowId) => rowId !== id));
    } else {
      onSelectionChange([...selectedRows, id]);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const getCellValue = (row: T, accessor: Column<T>['accessor']): unknown => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    return row[accessor];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {searchable && (
            <div className="relative w-64">
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                leftElement={<Search className="h-4 w-4" />}
                size="sm"
              />
            </div>
          )}
          {filterComponent}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && bulkActions && (
            <div className="flex items-center gap-2 pr-2 mr-2 border-r border-neutral-200 dark:border-neutral-700">
              <Badge variant="brand" size="sm">
                {selectedRows.length} selected
              </Badge>
              {bulkActions}
            </div>
          )}
          {exportable && onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                {selectable && (
                  <th className="w-12 px-4 py-3">
                    <Checkbox.Root
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      onCheckedChange={handleSelectAll}
                      className={cn(
                        'h-4 w-4 rounded border border-neutral-300 dark:border-neutral-600',
                        'data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600',
                        'data-[state=indeterminate]:bg-brand-600 data-[state=indeterminate]:border-brand-600',
                        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
                      )}
                    >
                      <Checkbox.Indicator>
                        <Check className="h-3 w-3 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      'px-4 py-3 text-left',
                      'text-xs font-semibold uppercase tracking-wider',
                      'text-neutral-500 dark:text-neutral-400',
                      'border-b border-neutral-200 dark:border-neutral-800',
                      column.sortable && 'cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && onSort?.(column.id)}
                  >
                    <div className={cn(
                      'flex items-center gap-1',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}>
                      {column.header}
                      {column.sortable && sortBy === column.id && (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && (
                  <th className="w-12 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800" />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {selectable && (
                      <td className="px-4 py-4">
                        <div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.id} className="px-4 py-4">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-4">
                        <div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                      </td>
                    )}
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      {emptyIcon && (
                        <div className="text-neutral-300 dark:text-neutral-600">
                          {emptyIcon}
                        </div>
                      )}
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {emptyMessage}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                data.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'bg-white dark:bg-neutral-900',
                      'transition-colors duration-150',
                      onRowClick && 'cursor-pointer',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                      selectedRows.includes(row.id) && 'bg-brand-50/50 dark:bg-brand-950/30'
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox.Root
                          checked={selectedRows.includes(row.id)}
                          onCheckedChange={() => handleSelectRow(row.id)}
                          className={cn(
                            'h-4 w-4 rounded border border-neutral-300 dark:border-neutral-600',
                            'data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600',
                            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
                          )}
                        >
                          <Checkbox.Indicator>
                            <Check className="h-3 w-3 text-white" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                      </td>
                    )}
                    {columns.map((column) => {
                      const value = getCellValue(row, column.accessor);
                      return (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 py-4 text-sm text-neutral-900 dark:text-neutral-100',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {column.render ? column.render(value, row) : String(value ?? '')}
                        </td>
                      );
                    })}
                    {rowActions && (
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              className={cn(
                                'min-w-[160px] p-1.5',
                                'bg-white dark:bg-neutral-900',
                                'border border-neutral-200 dark:border-neutral-800',
                                'rounded-lg shadow-lg',
                                'z-50'
                              )}
                              align="end"
                            >
                              {rowActions(row)}
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems !== undefined && totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className={cn(
                  'px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
                )}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="ml-4">
                {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalItems)} of {totalItems}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

EnterpriseDataTable.displayName = 'EnterpriseDataTable';

export { EnterpriseDataTable };
export type { Column as DataTableColumn };
