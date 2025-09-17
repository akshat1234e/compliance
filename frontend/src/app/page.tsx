import Link from 'next/link'
import { ArrowRightIcon, ShieldCheckIcon, ChartBarIcon, DocumentTextIcon, BellIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Enterprise RBI Compliance Platform
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              AI-powered regulatory intelligence and compliance management
            </p>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <BellIcon className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Regulatory Intelligence</h3>
              <p className="text-gray-600">AI-powered monitoring of RBI circulars and notifications</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Compliance Management</h3>
              <p className="text-gray-600">Automated workflow management and task routing</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
              <p className="text-gray-600">ML-based risk scoring and prediction models</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Document Management</h3>
              <p className="text-gray-600">Intelligent document processing with OCR</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">2,500+</div>
              <div className="text-gray-600">Regulatory Changes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">15,000+</div>
              <div className="text-gray-600">Tasks Automated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">5,000+</div>
              <div className="text-gray-600">Risk Assessments</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">100,000+</div>
              <div className="text-gray-600">Documents Processed</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}