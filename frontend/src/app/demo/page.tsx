import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function DemoPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-500">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to homepage
          </Link>
        </div>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Platform Demo
          </h1>
          <p className="text-lg text-gray-600 mb-12">
            Experience the power of our RBI Compliance Management Platform
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Interactive Demo</h3>
              <p className="text-gray-600 mb-6">
                Explore our platform features with sample data and see how it can transform your compliance operations.
              </p>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
              >
                Launch Demo Dashboard
              </Link>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Key Features</h3>
              <ul className="space-y-3 text-gray-600 list-disc list-inside">
                <li>Real-time regulatory monitoring</li>
                <li>AI-powered risk assessment</li>
                <li>Automated compliance workflows</li>
                <li>Comprehensive reporting</li>
                <li>System integrations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}