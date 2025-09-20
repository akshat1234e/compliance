'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const quickNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheckIcon },
  { name: 'Risk', href: '/dashboard/risk', icon: ExclamationTriangleIcon },
  { name: 'Documents', href: '/dashboard/documents', icon: DocumentTextIcon },
  { name: 'Connectors', href: '/dashboard/connectors', icon: Cog6ToothIcon },
  { name: 'Workflows', href: '/dashboard/workflows', icon: ArrowPathIcon },
]

export function QuickNav() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-2 z-40">
      <div className="flex space-x-1">
        {quickNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-brand-100 text-brand-600' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              title={item.name}
            >
              <item.icon className="h-5 w-5" />
            </button>
          )
        })}
      </div>
    </div>
  )
}