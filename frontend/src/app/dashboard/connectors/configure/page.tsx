'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface Connector {
  name: string
  status: 'connected' | 'disconnected'
  url: string
}

interface ConnectorsMap {
  [key: string]: Connector
}

export default function ConnectorConfigurePage() {
  const router = useRouter()
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('rbi')
  const [connectors, setConnectors] = useState<ConnectorsMap>({})
  const [isLoadingConnectors, setIsLoadingConnectors] = useState(true)

  useEffect(() => {
    const fetchConnectors = async () => {
      try {
        setIsLoadingConnectors(true)
        const response = await fetch('/api/connectors')
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        const data = await response.json()
        setConnectors(data)
      } catch (error) {
        console.error('Failed to fetch connectors:', error)
        setConnectors({})
        // Could add user notification here
      } finally {
        setIsLoadingConnectors(false)
      }
    }

    fetchConnectors()
  }, [])

  const handleTestConnection = async (connectorId: string) => {
    setIsTestingConnection(true)
    try {
      const response = await fetch(`/api/connectors/${connectorId}/test`)
      if (!response.ok) {
        throw new Error('Connection test failed')
      }
    } catch (error) {
      console.error('Connection test error:', error)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSaveConfiguration = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/connectors/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectors[activeTab])
      })
      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Save configuration error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connector Configuration</h1>
          <p className="text-sm text-gray-500">Manage banking system connections</p>
        </div>
      </div>

      {/* Connector Tabs */}
      {isLoadingConnectors ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-brand-600" />
        </div>
      ) : (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {Object.entries(connectors).map(([key, connector]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {connector.name}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Configuration Form */}
      {!isLoadingConnectors && connectors[activeTab] && (() => {
        const currentConnector = connectors[activeTab]
        return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{currentConnector.name} Configuration</h3>
          <div className="flex items-center space-x-2">
            {currentConnector.status === 'connected' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm ${
              currentConnector.status === 'connected'
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {currentConnector.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection URL
            </label>
            <input
              type="text"
              defaultValue={currentConnector.url}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              defaultValue="••••••••••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeout (seconds)
            </label>
            <input
              type="number"
              defaultValue="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retry Attempts
            </label>
            <input
              type="number"
              defaultValue="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => handleTestConnection(activeTab)}
            disabled={isTestingConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </button>
          <button 
            onClick={handleSaveConfiguration}
            disabled={isSaving}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
        )
      })()}

      {/* RBI Specific Configuration */}
      {!isLoadingConnectors && activeTab === 'rbi' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">RBI Portal Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">XBRL Portal</span>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Connected</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">COSMOS</span>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Connected</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">DAKSH</span>
                <XCircleIcon className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Setup Required</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
