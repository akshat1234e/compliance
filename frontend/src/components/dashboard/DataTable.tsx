'use client'

import { useState, useMemo } from 'react'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

export interface Column<T = any> {
  key: string
  title: string
  sortable?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  rowSelection?: {
    selectedRowKeys: string[]
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void
  }
  actions?: {
    view?: (record: T) => void
    edit?: (record: T) => void
    delete?: (record: T) => void
  }
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  className?: string
  rowKey?: string | ((record: T) => string)
}

type SortState = {
  key: string
  direction: 'asc' | 'desc'
} | null

export default function DataTable<T = any>({
  columns,
  data,
  loading = false,
  pagination,
  rowSelection,
  actions,
  onSort,
  className = '',
  rowKey = 'id'
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>(null)

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return (record as any)[rowKey] || index.toString()
  }

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    let newDirection: 'asc' | 'desc' = 'asc'
    
    if (sortState?.key === columnKey) {
      newDirection = sortState.direction === 'asc' ? 'desc' : 'asc'
    }

    const newSortState = { key: columnKey, direction: newDirection }
    setSortState(newSortState)
    onSort?.(columnKey, newDirection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (!rowSelection) return
    
    if (checked) {
      const allKeys = data.map((record, index) => getRowKey(record, index))
      rowSelection.onChange(allKeys, data)
    } else {
      rowSelection.onChange([], [])
    }
  }

  const handleSelectRow = (record: T, index: number, checked: boolean) => {
    if (!rowSelection) return
    
    const key = getRowKey(record, index)
    let newSelectedKeys = [...rowSelection.selectedRowKeys]
    let newSelectedRows = data.filter((item, idx) => 
      rowSelection.selectedRowKeys.includes(getRowKey(item, idx))
    )

    if (checked) {
      newSelectedKeys.push(key)
      newSelectedRows.push(record)
    } else {
      newSelectedKeys = newSelectedKeys.filter(k => k !== key)
      newSelectedRows = newSelectedRows.filter(item => getRowKey(item, 0) !== key)
    }

    rowSelection.onChange(newSelectedKeys, newSelectedRows)
  }

  const renderCell = (column: Column<T>, record: T, index: number) => {
    const value = (record as any)[column.key]
    
    if (column.render) {
      return column.render(value, record, index)
    }
    
    return value
  }

  const getSortIcon = (columnKey: string) => {
    if (sortState?.key !== columnKey) {
      return <ChevronUpIcon className="h-4 w-4 text-gray-300" />
    }
    
    return sortState.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-gray-600" />
      : <ChevronDownIcon className="h-4 w-4 text-gray-600" />
  }

  const hasActions = actions && (actions.view || actions.edit || actions.delete)
  const allSelected = rowSelection && data.length > 0 && 
    rowSelection.selectedRowKeys.length === data.length
  const someSelected = rowSelection && rowSelection.selectedRowKeys.length > 0

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 border-b border-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 bg-white"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {rowSelection && (
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected && !allSelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              
              {hasActions && (
                <th className="w-32 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record, index) => {
              const key = getRowKey(record, index)
              const isSelected = rowSelection?.selectedRowKeys.includes(key)
              
              return (
                <tr
                  key={key}
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}
                >
                  {rowSelection && (
                    <td className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(record, index, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                  )}
                  
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.align === 'center' ? 'text-center' : 
                        column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {renderCell(column, record, index)}
                    </td>
                  ))}
                  
                  {hasActions && (
                    <td className="w-32 px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {actions.view && (
                          <button
                            onClick={() => actions.view!(record)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        {actions.edit && (
                          <button
                            onClick={() => actions.edit!(record)}
                            className="text-warning-600 hover:text-warning-900 p-1 rounded"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {actions.delete && (
                          <button
                            onClick={() => actions.delete!(record)}
                            className="text-danger-600 hover:text-danger-900 p-1 rounded"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                disabled={pagination.current <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                disabled={pagination.current * pagination.pageSize >= pagination.total}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.current - 1) * pagination.pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current <= 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                
                <button
                  onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                  disabled={pagination.current * pagination.pageSize >= pagination.total}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
