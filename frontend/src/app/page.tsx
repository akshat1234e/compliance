import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRightIcon, ShieldCheckIcon, ChartBarIcon, DocumentTextIcon, BellIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Enterprise RBI Compliance Management Platform - AI-powered regulatory intelligence and risk assessment',
}

const features = [
  {
    name: 'Regulatory Intelligence',
    description: 'AI-powered monitoring and analysis of RBI circulars, notifications, and regulatory changes with real-time impact assessment.',
    icon: BellIcon,
    href: '/regulatory',
  },
  {
    name: 'Compliance Orchestration',
    description: 'Automated workflow management for compliance processes with intelligent task routing and approval workflows.',
    icon: ShieldCheckIcon,
    href: '/compliance',
  },
  {
    name: 'Risk Assessment',
    description: 'Machine learning-based risk scoring and prediction models for proactive compliance risk management.',
    icon: ChartBarIcon,
    href: '/risk',
  },
  {
    name: 'Document Management',
    description: 'Intelligent document processing with OCR, classification, and automated compliance evidence collection.',
    icon: DocumentTextIcon,
    href: '/documents',
  },
]

const stats = [
  { name: 'Regulatory Changes Tracked', value: '2,500+' },
  { name: 'Compliance Tasks Automated', value: '15,000+' },
  { name: 'Risk Assessments Completed', value: '5,000+' },
  { name: 'Documents Processed', value: '100,000+' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Enterprise RBI
              <span className="text-brand-600"> Compliance</span>
              <br />
              Management Platform
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              AI-powered regulatory intelligence and compliance orchestration platform designed for Banks, NBFCs, and Financial Institutions. 
              Stay ahead of regulatory changes with intelligent automation and real-time risk assessment.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/dashboard"
                className="rounded-md bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Get Started
              </Link>
              <Link
                href="/demo"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-brand-600"
              >
                View Demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Comprehensive Compliance Solution
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Everything you need to manage regulatory compliance in one integrated platform
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <feature.icon className="h-5 w-5 flex-none text-brand-600" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                    <p className="mt-6">
                      <Link
                        href={feature.href}
                        className="text-sm font-semibold leading-6 text-brand-600 hover:text-brand-500"
                      >
                        Learn more <span aria-hidden="true">→</span>
                      </Link>
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by Financial Institutions
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Powering compliance operations across the financial services industry
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="flex flex-col bg-gray-400/5 p-8">
                  <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
                  <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your compliance operations?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-brand-200">
              Join leading financial institutions using our platform to stay ahead of regulatory changes and reduce compliance risk.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/contact"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Contact Sales
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-semibold leading-6 text-white hover:text-brand-200"
              >
                Start Free Trial <ArrowRightIcon className="ml-1 h-4 w-4 inline" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-xs leading-5 text-gray-500">
              &copy; 2024 RBI Compliance Platform. All rights reserved.
            </p>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              Enterprise regulatory compliance and risk management platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
