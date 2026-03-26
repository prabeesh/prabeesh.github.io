const CACHE_NAME = 'prabeesh-blog-v2';
const STATIC_CACHE = 'static-v2';
const RUNTIME_CACHE = 'runtime-v2';

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  static: 7 * 24 * 60 * 60 * 1000,    // 7 days
  runtime: 24 * 60 * 60 * 1000,       // 1 day
  images: 30 * 24 * 60 * 60 * 1000     // 30 days
};

// Resources to cache on install
const urlsToCache = [
  '/',
  '/css/main.min.css',
  '/manifest.json',
  '/images/favicon.png'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clean expired entries
      cleanExpiredCaches()
    ]).then(() => self.clients.claim())
  );
});

// Clean expired cache entries
async function cleanExpiredCaches() {
  const cacheNames = [STATIC_CACHE, RUNTIME_CACHE];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const cacheDate = new Date(dateHeader);
            const now = new Date();
            const age = now.getTime() - cacheDate.getTime();
            
            // Check expiry based on resource type
            let maxAge = CACHE_EXPIRY.runtime;
            if (request.url.includes('/images/')) {
              maxAge = CACHE_EXPIRY.images;
            } else if (request.url.includes('/css/') || request.url.includes('/js/')) {
              maxAge = CACHE_EXPIRY.static;
            }
            
            if (age > maxAge) {
              await cache.delete(request);
            }
          }
        }
      }
    } catch (error) {
      console.log('Cache cleanup error:', error);
    }
  }
}

// Fetch event - optimized cache strategies
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Cache strategy based on request type
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    // Stale while revalidate for HTML pages
    event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
  } else if (url.pathname.includes('/css/') || url.pathname.includes('/js/')) {
    // Cache first with fallback for static assets
    event.respondWith(cacheFirstWithExpiry(event.request, STATIC_CACHE, CACHE_EXPIRY.static));
  } else if (url.pathname.includes('/images/')) {
    // Cache first with longer expiry for images
    event.respondWith(cacheFirstWithExpiry(event.request, STATIC_CACHE, CACHE_EXPIRY.images));
  } else {
    // Network first for other resources
    event.respondWith(networkFirstStrategy(event.request));
  }
});

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Cache first with expiry check
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still fresh
    const dateHeader = cachedResponse.headers.get('date');
    if (dateHeader) {
      const cacheDate = new Date(dateHeader);
      const age = new Date().getTime() - cacheDate.getTime();
      
      if (age < maxAge) {
        return cachedResponse;
      }
    } else {
      // No date header, assume fresh for now
      return cachedResponse;
    }
  }
  
  // Fetch fresh copy
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}
