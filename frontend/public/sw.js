// Service Worker for RBI Compliance Platform
const CACHE_NAME = 'rbi-compliance-v1.0.0'
const STATIC_CACHE = 'rbi-static-v1.0.0'
const DYNAMIC_CACHE = 'rbi-dynamic-v1.0.0'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/v1\/dashboard\/metrics/,
  /\/api\/v1\/regulatory\/categories/,
  /\/api\/v1\/compliance\/templates/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - cache strategy
    event.respondWith(handleApiRequest(request))
  } else if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Next.js static assets - cache first with long TTL
    event.respondWith(handleNextStaticAsset(request))
  } else {
    // Pages - network first with cache fallback
    event.respondWith(handlePageRequest(request))
  }
})

// Handle API requests with network first, cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses for specific endpoints
    if (networkResponse.ok && shouldCacheApiResponse(url.pathname)) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache')
    
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for critical endpoints
    if (url.pathname.includes('/dashboard/metrics')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Offline - cached data not available',
        data: getOfflineMetrics()
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw error
  }
}

// Handle static assets with cache first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Failed to fetch static asset', error)
    throw error
  }
}

// Handle Next.js static assets with cache first and long TTL
async function handleNextStaticAsset(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Failed to fetch Next.js static asset', error)
    throw error
  }
}

// Handle page requests with network first, cache fallback
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed for page request, trying cache')
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to offline page
    const offlinePage = await caches.match('/offline')
    if (offlinePage) {
      return offlinePage
    }
    
    // Last resort - basic offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - RBI Compliance Platform</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
            .offline { max-width: 400px; margin: 0 auto; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="offline">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Check if API response should be cached
function shouldCacheApiResponse(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname))
}

// Offline metrics fallback
function getOfflineMetrics() {
  return {
    complianceScore: { current: 0, trend: 'stable' },
    activeWorkflows: { count: 0 },
    pendingTasks: { count: 0 },
    riskLevel: { current: 'Unknown' }
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle any queued offline actions
  console.log('Service Worker: Performing background sync')
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New compliance update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('RBI Compliance Platform', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

console.log('Service Worker: Loaded successfully')
