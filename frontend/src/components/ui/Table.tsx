import { cn } from '@/lib/utils';
import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  ...props
}) => (
  <table className={cn('w-full border-collapse', className)} {...props} />
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead className={cn('bg-gray-50', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <tbody className={cn('divide-y divide-gray-200', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr className={cn('hover:bg-gray-50', className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <th className={cn('px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)} {...props} />
);
