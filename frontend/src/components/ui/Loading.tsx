import { cn } from '@/lib/utils';
import React from 'react';

export const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600', className)} />
);
