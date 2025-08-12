'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PerformanceChartProps {
  data?: any[]
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Mock data for demonstration
  const mockData = [
    { time: '00:00', responseTime: 120, errorRate: 0.5, throughput: 85 },
    { time: '04:00', responseTime: 110, errorRate: 0.3, throughput: 92 },
    { time: '08:00', responseTime: 150, errorRate: 1.2, throughput: 78 },
    { time: '12:00', responseTime: 180, errorRate: 2.1, throughput: 65 },
    { time: '16:00', responseTime: 140, errorRate: 0.8, throughput: 88 },
    { time: '20:00', responseTime: 125, errorRate: 0.4, throughput: 95 },
  ]

  const chartData = data || mockData

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Response Time (ms)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Error Rate (%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Throughput</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="responseTime" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="errorRate" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="throughput" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-semibold text-blue-600">
            {chartData[chartData.length - 1]?.responseTime || 0}ms
          </div>
          <div className="text-gray-500">Avg Response Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600">
            {chartData[chartData.length - 1]?.errorRate || 0}%
          </div>
          <div className="text-gray-500">Error Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-green-600">
            {chartData[chartData.length - 1]?.throughput || 0}
          </div>
          <div className="text-gray-500">Throughput</div>
        </div>
      </div>
    </div>
  )
}
