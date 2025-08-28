'use client'

import { SecurityDashboard } from '@/components/security/SecurityDashboard'

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security & Access Control</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor authentication, authorization, and security events
        </p>
      </div>
      
      <SecurityDashboard />
    </div>
  )
}