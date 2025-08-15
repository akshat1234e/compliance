import { BellIcon } from '@heroicons/react/24/outline'

export function NotificationCenter() {
  return (
    <div className="relative">
      <button className="relative p-2 text-gray-400 hover:text-gray-600">
        <BellIcon className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          2
        </span>
      </button>
    </div>
  )
}