import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const complianceData = [
  { name: 'Compliant', value: 85, color: '#10b981' },
  { name: 'In Progress', value: 10, color: '#f59e0b' },
  { name: 'Overdue', value: 5, color: '#ef4444' }
]

const monthlyData = [
  { month: 'Jan', compliant: 82 },
  { month: 'Feb', compliant: 85 },
  { month: 'Mar', compliant: 88 },
  { month: 'Apr', compliant: 85 },
  { month: 'May', compliant: 90 },
  { month: 'Jun', compliant: 92 }
]

export function CompliancePieChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={complianceData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
          >
            {complianceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ComplianceTrendChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Compliance Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="compliant" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}