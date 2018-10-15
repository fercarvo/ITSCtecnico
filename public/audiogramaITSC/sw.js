/**
 * Service worker para audiograma ITSC
 * 
 * Edgar Carvajal efcu03@gmail.com
 */

const CACHE_NAME = 'audiogramaITSC-v1'

self.addEventListener('install', function (event) {
    event.waitUntil(async function() {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll([ //Files to be cached
            '/audiogramaITSC/index.html',
            '/audiogramaITSC/',
            '/audiogramaITSC/media/css/style.css',
            '/audiogramaITSC/media/img/audiogram/left.air.masked.response.png',
            '/audiogramaITSC/media/img/audiogram/left.air.unmasked.response.png',
            '/audiogramaITSC/media/img/audiogram/left.bone.masked.response.png',
            '/audiogramaITSC/media/img/audiogram/left.bone.unmasked.response.png',
            '/audiogramaITSC/media/img/audiogram/right.air.masked.response.png',
            '/audiogramaITSC/media/img/audiogram/right.air.unmasked.response.png',
            '/audiogramaITSC/media/img/audiogram/right.bone.masked.response.png',
            '/audiogramaITSC/media/img/audiogram/right.bone.unmasked.response.png',
            '/audiogramaITSC/media/img/audiogram/soundfield.aided.response.png',
            '/audiogramaITSC/media/img/audiogram/soundfield.ci.response.png',
            '/audiogramaITSC/media/img/audiogram/soundfield.unaided.response.png',
            '/audiogramaITSC/media/js/audiograma.js',
            '/audiogramaITSC/media/js/ba-debug.min.js',
            '/audiogramaITSC/media/js/jquery.audiogram.js',
            '/audiogramaITSC/media/js/jquery.js',
            '/audiogramaITSC/sw.js'
        ])
    }())
})

self.addEventListener('fetch', function(event) {
    event.respondWith(async function () {
        var response = await caches.match(event.request, {ignoreSearch: true, cacheName: CACHE_NAME})
        // Cache hit - return response

        if (response) return response;

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response
        var fetchRequest = event.request.clone();

        response = await fetch(fetchRequest)
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have 2 stream.
        var responseToCache = response.clone();

        caches.open(CACHE_NAME)
            .then(function(cache) {
                cache.put(event.request, responseToCache);
            })

        return response
    }());
})