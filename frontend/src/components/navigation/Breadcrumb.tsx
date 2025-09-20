'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const breadcrumbItems = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ')
    const isLast = index === segments.length - 1

    return { href, label, isLast }
  })

  if (breadcrumbItems.length <= 1) return null

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />}
            {item.isLast ? (
              <span className="text-gray-500 text-sm">{item.label}</span>
            ) : (
              <Link 
                href={item.href}
                className="text-brand-600 hover:text-brand-700 text-sm font-medium"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}