import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx'

interface StatsCardProps {
  name: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  change?: string
  changeType?: 'positive' | 'negative'
}

const colorClasses = {
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  red: 'bg-red-500 text-white',
  purple: 'bg-purple-500 text-white',
  indigo: 'bg-indigo-500 text-white',
}

export function StatsCard({ name, value, icon: Icon, color, change, changeType }: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={clsx('p-3 rounded-md', colorClasses[color])}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{name}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div
                    className={clsx(
                      'ml-2 flex items-baseline text-sm font-semibold',
                      changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {changeType === 'positive' ? (
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                    )}
                    <span className="sr-only">
                      {changeType === 'positive' ? 'Increased' : 'Decreased'} by
                    </span>
                    {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
