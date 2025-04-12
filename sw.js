const CACHE_NAME = 'histoquiz-cache-v2';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './script.js',
  './questions.js',
  './assets/favicon/favicon.ico',
  './assets/favicon/favicon-16x16.png',
  './assets/favicon/favicon-32x32.png',
  './assets/favicon/apple-touch-icon.png',
  './assets/favicon/android-chrome-192x192.png',
  './assets/favicon/android-chrome-512x512.png',
  './assets/favicon/site.webmanifest'
];

// Cài đặt Service Worker - Cache các tài nguyên
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Mở cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Kích hoạt Service Worker - Xóa cache cũ
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Xóa cache cũ:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Xử lý các request - Cache-first strategy
self.addEventListener('fetch', function(event) {
  // Bỏ qua các URL không phải HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Trả về từ cache nếu có
        if (response) {
          return response;
        }
        
        // Clone request vì nó chỉ có thể được sử dụng một lần
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          function(response) {
            // Kiểm tra nếu nhận được response hợp lệ
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Chỉ cache các request HTTP/HTTPS
            if (fetchRequest.url.startsWith('http')) {
              // Clone response vì nó chỉ có thể được sử dụng một lần
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                })
                .catch(function(error) {
                  console.error('Cache error:', error);
                });
            }
            
            return response;
          }
        ).catch(function(error) {
          console.error('Fetch error:', error);
          // Trả về phản hồi lỗi nếu fetch thất bại
          return new Response('Network error', {
            status: 408,
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
}); 