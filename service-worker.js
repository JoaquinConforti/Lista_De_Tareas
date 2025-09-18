self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('todo-cache').then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
