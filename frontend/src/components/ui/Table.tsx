/**
 * Table Component
 * Comprehensive table component with sorting, filtering, and pagination
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const tableVariants = cva(
  'w-full caption-bottom text-sm',
  {
    variants: {
      variant: {
        default: '',
        striped: '[&_tbody_tr:nth-child(odd)]:bg-gray-50',
        bordered: 'border border-gray-200',
      },
      size: {
        default: '',
        sm: 'text-xs',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(tableVariants({ variant, size, className }))}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-gray-50/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    clickable?: boolean
  }
>(({ className, clickable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50',
      clickable && 'cursor-pointer',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean
    sortDirection?: 'asc' | 'desc' | null
    onSort?: () => void
  }
>(({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0',
      sortable && 'cursor-pointer select-none hover:text-gray-700',
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center gap-2">
      {children}
      {sortable && (
        <div className="flex flex-col">
          <svg
            className={cn(
              'h-3 w-3',
              sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg
            className={cn(
              'h-3 w-3 -mt-1',
              sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  </th>
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-gray-500', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

// Data Table Component with built-in features
export interface Column<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  width?: string
  render?: (value: any, record: T, index: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
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
    getCheckboxProps?: (record: T) => { disabled?: boolean }
  }
  onRow?: (record: T, index: number) => {
    onClick?: () => void
    onDoubleClick?: () => void
  }
  emptyText?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  rowSelection,
  onRow,
  emptyText = 'No data available',
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const handleSelectAll = (checked: boolean) => {
    if (!rowSelection) return

    if (checked) {
      const allKeys = data.map((_, index) => index.toString())
      rowSelection.onChange(allKeys, data)
    } else {
      rowSelection.onChange([], [])
    }
  }

  const handleSelectRow = (record: T, index: number, checked: boolean) => {
    if (!rowSelection) return

    const key = index.toString()
    let newSelectedKeys = [...rowSelection.selectedRowKeys]
    let newSelectedRows: T[] = []

    if (checked) {
      newSelectedKeys.push(key)
    } else {
      newSelectedKeys = newSelectedKeys.filter(k => k !== key)
    }

    newSelectedRows = data.filter((_, i) => newSelectedKeys.includes(i.toString()))
    rowSelection.onChange(newSelectedKeys, newSelectedRows)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Table variant="striped">
        <TableHeader>
          <TableRow>
            {rowSelection && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={rowSelection.selectedRowKeys.length === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key as string}
                sortable={column.sortable}
                sortDirection={
                  sortConfig?.key === column.key ? sortConfig.direction : null
                }
                onSort={() => column.sortable && handleSort(column.key as string)}
                style={{ width: column.width }}
                className={cn(
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
              >
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (rowSelection ? 1 : 0)}
                className="text-center py-8 text-gray-500"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((record, index) => {
              const rowProps = onRow?.(record, index)
              const isSelected = rowSelection?.selectedRowKeys.includes(index.toString())

              return (
                <TableRow
                  key={index}
                  clickable={!!rowProps?.onClick}
                  onClick={rowProps?.onClick}
                  onDoubleClick={rowProps?.onDoubleClick}
                  data-state={isSelected ? 'selected' : undefined}
                >
                  {rowSelection && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(record, index, e.target.checked)}
                        disabled={rowSelection.getCheckboxProps?.(record)?.disabled}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const value = record[column.key]
                    const content = column.render
                      ? column.render(value, record, index)
                      : value

                    return (
                      <TableCell
                        key={column.key as string}
                        className={cn(
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {content}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
