// =============================================
//  SERVICE WORKER - Botón de Pánico PWA
//  Caché de recursos para funcionamiento offline
//  y experiencia de instalación nativa.
// =============================================

// Nombre de la caché (cambiar versión para forzar actualización)
const CACHE_NAME = 'boton-panico-v9';

// Recursos a cachear para uso offline
const RECURSOS_A_CACHEAR = [
  './',
  './index.html',
  './styles.css?v=9',
  './app.js?v=9',
  './manifest.json'
];

// -----------------------------------------
//  EVENTO: INSTALL
//  Se ejecuta cuando el Service Worker se
//  instala por primera vez.
// -----------------------------------------
self.addEventListener('install', (evento) => {
  console.log('📦 Service Worker: Instalando...');

  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cacheando recursos...');
        return cache.addAll(RECURSOS_A_CACHEAR);
      })
      .then(() => {
        // Activar inmediatamente sin esperar a que se cierre la pestaña
        return self.skipWaiting();
      })
  );
});

// -----------------------------------------
//  EVENTO: ACTIVATE
//  Se ejecuta cuando el Service Worker se
//  activa. Limpia cachés antiguas.
// -----------------------------------------
self.addEventListener('activate', (evento) => {
  console.log('✅ Service Worker: Activado.');

  evento.waitUntil(
    caches.keys()
      .then((nombresDeCaches) => {
        return Promise.all(
          nombresDeCaches.map((nombreCache) => {
            // Eliminar cachés que no correspondan a la versión actual
            if (nombreCache !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Eliminando caché antigua:', nombreCache);
              return caches.delete(nombreCache);
            }
          })
        );
      })
      .then(() => {
        // Tomar control de todas las páginas abiertas inmediatamente
        return self.clients.claim();
      })
  );
});

// -----------------------------------------
//  EVENTO: FETCH
//  Estrategia: Network First, con fallback a caché.
//  Para la API de Telegram, siempre ir a la red.
// -----------------------------------------
self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);

  // Las peticiones a Telegram SIEMPRE van a la red (nunca cachear)
  if (url.hostname === 'api.telegram.org') {
    evento.respondWith(fetch(evento.request));
    return;
  }

  // Para el resto de recursos: Network First con fallback a caché
  evento.respondWith(
    fetch(evento.request)
      .then((respuestaRed) => {
        // Si la respuesta de red es válida, guardarla en caché
        if (respuestaRed && respuestaRed.status === 200) {
          const respuestaClonada = respuestaRed.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(evento.request, respuestaClonada);
            });
        }
        return respuestaRed;
      })
      .catch(() => {
        // Si la red falla, intentar desde la caché
        return caches.match(evento.request)
          .then((respuestaCache) => {
            if (respuestaCache) {
              return respuestaCache;
            }
            // Si tampoco está en caché, retornar la página principal
            // (útil para navegación offline)
            if (evento.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
