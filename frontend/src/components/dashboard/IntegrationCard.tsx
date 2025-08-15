interface IntegrationCardProps {
  integration: any
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-medium">{integration.name}</h3>
      <p className="text-sm text-gray-600">{integration.status}</p>
    </div>
  )
}