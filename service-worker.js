// Nombre del caché y lista de activos que queremos almacenar en caché
const cacheName = 'todo-cache-v1';
const assets = [
  '/', // Página de inicio
  '/index.html', // Archivo HTML principal
  '/style.css', // Estilos CSS
  '/app.js', // Archivo JavaScript principal
  '/manifest.json', // Archivo de manifest de la aplicación
  '/images/icon-192.png', // Ícono de 192px para dispositivos
  '/images/icon-512.png' // Ícono de 512px para dispositivos
];
// Evento de instalación: ocurre la primera vez que el Service Worker se registra
self.addEventListener('install', e => {
  // Espera hasta que todos los archivos estén en caché antes de completar la instalación
  e.waitUntil(
    caches.open(cacheName) // Abre (o crea) el caché con el nombre especificado
      .then(cache => {
        // Agrega todos los archivos en `assets` al caché
        return cache.addAll(assets)
          .then(() => self.skipWaiting()); // Fuerza al SW a activarse inmediatamente después de instalarse
      })
      .catch(err => console.log('Falló registro de caché', err)) // Log de errores en caso de que falle
  );
});
// Evento de activación: se ejecuta después de que el SW se instala y toma el control de la aplicación
self.addEventListener('activate', e => {
    // Lista de cachés permitidos (whitelist) que queremos conservar
    const cacheWhitelist = [cacheName];

    // Elimina cachés antiguos que no están en la lista de permitidos
    e.waitUntil(
        caches.keys() // Obtiene todos los nombres de caché actuales
        .then(cacheNames => {
            // Mapea y elimina cachés que no están en la whitelist
            return Promise.all(
                cacheNames.map(cName => {
                    // Si el caché actual no está en la whitelist, elimínalo
                    if (!cacheWhitelist.includes(cName)) {
                        return caches.delete(cName); // Elimina el caché obsoleto
                    }
                })
            );
        })
    ).then(() => self.clients.claim());
});
// Evento de fetch: se ejecuta cada vez que la aplicación solicita un recurso (ej., archivos, datos)
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request) // Verifica si el recurso solicitado está en caché
        .then(response => {
            // Si el recurso está en caché, lo devuelve
            if (response) {
                return response;
            }

            // Si el recurso no está en caché, lo solicita de la red
            return fetch(e.request).then(networkResponse => {
                // Verifica si la respuesta es válida
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Clona la respuesta de la red para almacenarla en caché
                const responseToCache = networkResponse.clone();

                caches.open(cacheName) // Abre el caché con el nombre especificado
                .then(cache => {
                    cache.put(e.request, responseToCache); // Almacena en caché la respuesta clonada
                });

                return networkResponse;
            });
        })
    );
});
