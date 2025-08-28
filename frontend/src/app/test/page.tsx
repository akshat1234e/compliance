export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 RBI Compliance Platform
        </h1>
        <p className="text-gray-600 mb-6">
          Test page to verify the frontend is working correctly.
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-800 font-medium">✅ Frontend Status</h3>
            <p className="text-green-600 text-sm">Next.js application is running</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-medium">🎨 Tailwind CSS</h3>
            <p className="text-blue-600 text-sm">Styling system is working</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
            <h3 className="text-purple-800 font-medium">⚡ TypeScript</h3>
            <p className="text-purple-600 text-sm">Type checking is enabled</p>
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <a 
            href="/" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Home
          </a>
          <a 
            href="/dashboard" 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
