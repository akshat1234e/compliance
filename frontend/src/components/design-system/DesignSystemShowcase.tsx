/**
 * Design System Showcase
 * Comprehensive showcase of all design system components
 */

import React from 'react'
import { 
  Button, 
  ButtonGroup, 
  IconButton,
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  StatCard,
  MetricCard,
  AlertCard,
  Input, 
  SearchInput, 
  PasswordInput,
  Badge, 
  ComplianceBadge, 
  RiskBadge, 
  PriorityBadge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  DataTable,
  Modal,
  LoadingSpinner,
  LoadingDots,
  LoadingSkeleton,
  Toast,
  ToastProvider
} from '@/components/ui'

export const DesignSystemShowcase: React.FC = () => {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [selectedTab, setSelectedTab] = React.useState('buttons')

  // Sample data for table
  const sampleData = [
    { id: 1, name: 'RBI Circular 2024-01', status: 'compliant', risk: 'low', priority: 'medium', date: '2024-01-15' },
    { id: 2, name: 'SEBI Guidelines Update', status: 'non-compliant', risk: 'high', priority: 'urgent', date: '2024-01-10' },
    { id: 3, name: 'NPCI Framework', status: 'partially-compliant', risk: 'medium', priority: 'high', date: '2024-01-08' },
  ]

  const tableColumns = [
    { key: 'name', title: 'Document Name', sortable: true },
    { 
      key: 'status', 
      title: 'Compliance Status', 
      render: (value: string) => <ComplianceBadge status={value as any} />
    },
    { 
      key: 'risk', 
      title: 'Risk Level', 
      render: (value: string) => <RiskBadge level={value as any} />
    },
    { 
      key: 'priority', 
      title: 'Priority', 
      render: (value: string) => <PriorityBadge priority={value as any} />
    },
    { key: 'date', title: 'Date', sortable: true },
  ]

  const tabs = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'cards', label: 'Cards' },
    { id: 'badges', label: 'Badges' },
    { id: 'tables', label: 'Tables' },
    { id: 'loading', label: 'Loading' },
    { id: 'colors', label: 'Colors' },
  ]

  const renderButtons = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Button Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Button Sizes</h3>
        <div className="flex items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Button States</h3>
        <div className="flex gap-4">
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Button Group</h3>
        <ButtonGroup>
          <Button variant="outline">Left</Button>
          <Button variant="outline">Center</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Icon Buttons</h3>
        <div className="flex gap-4">
          <IconButton
            icon={<span>+</span>}
            aria-label="Add"
          />
          <IconButton
            variant="outline"
            icon={<span>×</span>}
            aria-label="Close"
          />
          <IconButton
            variant="ghost"
            icon={<span>⚙</span>}
            aria-label="Settings"
          />
        </div>
      </div>
    </div>
  )

  const renderInputs = () => (
    <div className="space-y-8 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-4">Input Variants</h3>
        <div className="space-y-4">
          <Input label="Default Input" placeholder="Enter text..." />
          <Input label="Required Input" placeholder="Required field" required />
          <Input label="Input with Error" placeholder="Invalid input" error="This field is required" />
          <Input label="Input with Helper Text" placeholder="Helper text example" helperText="This is helper text" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Input Sizes</h3>
        <div className="space-y-4">
          <Input size="sm" placeholder="Small input" />
          <Input size="default" placeholder="Default input" />
          <Input size="lg" placeholder="Large input" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Specialized Inputs</h3>
        <div className="space-y-4">
          <SearchInput placeholder="Search documents..." />
          <PasswordInput label="Password" placeholder="Enter password" />
        </div>
      </div>
    </div>
  )

  const renderCards = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This is a basic card with default styling.</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card has elevated shadow styling.</p>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Outlined Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card has a prominent border.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Stat Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Compliance Items"
            value="1,234"
            change={{ value: 12, type: 'increase', period: 'last month' }}
            icon={<span>📊</span>}
          />
          <StatCard
            title="Pending Reviews"
            value="56"
            change={{ value: 8, type: 'decrease', period: 'last week' }}
            icon={<span>⏳</span>}
          />
          <StatCard
            title="Risk Score"
            value="7.2/10"
            icon={<span>⚠️</span>}
          />
          <StatCard
            title="Compliance Rate"
            value="94.5%"
            change={{ value: 2.1, type: 'increase', period: 'this quarter' }}
            icon={<span>✅</span>}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Alert Cards</h3>
        <div className="space-y-4">
          <AlertCard
            type="info"
            title="Information"
            description="This is an informational alert card."
          />
          <AlertCard
            type="success"
            title="Success"
            description="Operation completed successfully."
            dismissible
          />
          <AlertCard
            type="warning"
            title="Warning"
            description="Please review the compliance requirements."
          />
          <AlertCard
            type="error"
            title="Error"
            description="Failed to process the regulatory document."
          />
        </div>
      </div>
    </div>
  )

  const renderBadges = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Compliance Badges</h3>
        <div className="flex flex-wrap gap-2">
          <ComplianceBadge status="compliant" />
          <ComplianceBadge status="non-compliant" />
          <ComplianceBadge status="partially-compliant" />
          <ComplianceBadge status="pending" />
          <ComplianceBadge status="overdue" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Risk Badges</h3>
        <div className="flex flex-wrap gap-2">
          <RiskBadge level="low" />
          <RiskBadge level="medium" />
          <RiskBadge level="high" />
          <RiskBadge level="critical" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Priority Badges</h3>
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority="low" />
          <PriorityBadge priority="medium" />
          <PriorityBadge priority="high" />
          <PriorityBadge priority="urgent" />
        </div>
      </div>
    </div>
  )

  const renderTables = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Data Table</h3>
        <DataTable
          data={sampleData}
          columns={tableColumns}
          pagination={{
            current: 1,
            pageSize: 10,
            total: 3,
            onChange: () => {},
          }}
        />
      </div>
    </div>
  )

  const renderLoading = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Spinners</h3>
        <div className="flex items-center gap-4">
          <LoadingSpinner size="xs" />
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="default" />
          <LoadingSpinner size="lg" />
          <LoadingSpinner size="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Dots</h3>
        <div className="flex items-center gap-4">
          <LoadingDots size="sm" />
          <LoadingDots size="default" />
          <LoadingDots size="lg" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Skeletons</h3>
        <div className="space-y-4">
          <LoadingSkeleton lines={3} />
          <LoadingSkeleton width={200} height={20} />
          <LoadingSkeleton width={40} height={40} circle />
        </div>
      </div>
    </div>
  )

  const renderColors = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Brand Colors</h3>
        <div className="grid grid-cols-5 gap-2">
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
            <div key={shade} className="text-center">
              <div className={`h-16 w-full rounded bg-brand-${shade} border`} />
              <p className="text-xs mt-1">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <h4 className="font-medium mb-2">Success</h4>
            <div className="grid grid-cols-3 gap-1">
              {[400, 500, 600].map(shade => (
                <div key={shade} className={`h-12 rounded bg-success-${shade}`} />
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Warning</h4>
            <div className="grid grid-cols-3 gap-1">
              {[400, 500, 600].map(shade => (
                <div key={shade} className={`h-12 rounded bg-warning-${shade}`} />
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Error</h4>
            <div className="grid grid-cols-3 gap-1">
              {[400, 500, 600].map(shade => (
                <div key={shade} className={`h-12 rounded bg-error-${shade}`} />
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Gray</h4>
            <div className="grid grid-cols-3 gap-1">
              {[400, 500, 600].map(shade => (
                <div key={shade} className={`h-12 rounded bg-gray-${shade}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (selectedTab) {
      case 'buttons': return renderButtons()
      case 'inputs': return renderInputs()
      case 'cards': return renderCards()
      case 'badges': return renderBadges()
      case 'tables': return renderTables()
      case 'loading': return renderLoading()
      case 'colors': return renderColors()
      default: return renderButtons()
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              RegTech Design System
            </h1>
            <p className="text-lg text-gray-600">
              Comprehensive UI components for regulatory compliance platforms
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === tab.id
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            {renderContent()}
          </div>

          {/* Modal Demo */}
          <div className="mt-8">
            <Button onClick={() => setModalOpen(true)}>
              Open Modal Demo
            </Button>
          </div>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Modal Demo"
            description="This is a demonstration of the modal component."
          >
            <div className="space-y-4">
              <p>This modal demonstrates the design system's modal component with proper focus management and accessibility features.</p>
              <div className="flex gap-2">
                <Button onClick={() => setModalOpen(false)}>Close</Button>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </ToastProvider>
  )
}
