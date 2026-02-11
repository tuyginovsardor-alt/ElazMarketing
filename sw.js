
const CACHE_NAME = 'elaz-market-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://ncbbjlduisavvxyscxbk.supabase.co/storage/v1/object/public/products/app_icon.png',
    badge: 'https://ncbbjlduisavvxyscxbk.supabase.co/storage/v1/object/public/products/app_icon.png'
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
