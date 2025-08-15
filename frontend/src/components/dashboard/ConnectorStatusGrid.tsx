interface ConnectorStatusGridProps {
  connectors: any
}

export function ConnectorStatusGrid({ connectors }: ConnectorStatusGridProps) {
  if (!connectors) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(connectors).map(([name, status]: [string, any]) => (
        <div key={name} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold capitalize">{name}</h3>
            <div className={`h-3 w-3 rounded-full ${status.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={status.isConnected ? 'text-green-600' : 'text-red-600'}>
                {status.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Response Time:</span>
              <span>{status.responseTime}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Error Rate:</span>
              <span>{(status.errorRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}