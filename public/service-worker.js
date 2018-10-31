/**
 * Service worker para ITSC
 * 
 * 15/10/2018
 * Edgar Carvajal efcu03@gmail.com
 * 
 * Este SW servira para incrementar el performance y reducir el trafico de los aplicativos usados en ITSC
 */

const CACHE_NAME = 'Static-ITSC-v1.0'

const audiograma = [
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
    '/audiogramaITSC/media/js/jquery.js'
]

const calendario = [
    '/calendarioAPP/index.html',
    '/calendarioAPP/',
    '/calendarioAPP/lib/jquery-ui.min.js',
    '/calendarioAPP/lib/jquery.min.js',
    '/calendarioAPP/lib/moment.min.js',
    '/calendarioAPP/locale/es.js',
    '/calendarioAPP/fullcalendar.css',
    '/calendarioAPP/fullcalendar.js',
    '/calendarioAPP/fullcalendar.min.css',
    '/calendarioAPP/fullcalendar.min.js',
    '/calendarioAPP/fullcalendar.print.css',
    '/calendarioAPP/fullcalendar.print.min.css',
    '/calendarioAPP/jquery.qtip.css',
    '/calendarioAPP/jquery.qtip.js',
    '/calendarioAPP/jquery.qtip.min.css',
    '/calendarioAPP/jquery.qtip.min.js',
    '/calendarioAPP/jquery.qtip.min.map'
]

const qr = [
    '/qrGEN/index.html',
    '/qrGEN/jquery.min.js',
    '/qrGEN/jquery.qrcode.js',
    '/qrGEN/qrcode.js',
    '/qrGEN/'
]

const tablaGenerica = [
    '/tablaGenerica/index.html',
    '/tablaGenerica/',
    '/tablaGenerica/buttons.dataTables.min.css',
    '/tablaGenerica/buttons.flash.min.js',
    '/tablaGenerica/buttons.html5.min.js',
    '/tablaGenerica/dataTables.buttons.min.js',
    '/tablaGenerica/dataTables.pageResize.min.js',
    '/tablaGenerica/jquery.dataTables.min.css',
    '/tablaGenerica/jquery.dataTables.min.js',
    '/tablaGenerica/jquery.js',
    '/tablaGenerica/jszip.min.js',
    '/tablaGenerica/images/sort_asc.png',
    '/tablaGenerica/images/sort_both.png',
    '/tablaGenerica/images/sort_desc.png'
]

self.addEventListener('install', function (event) {
    event.waitUntil(async function() {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll([...audiograma, ...calendario, ...qr, ...tablaGenerica])
    }())
})

self.addEventListener('fetch', function(event) {
    event.respondWith(async function () {
        var response = await caches.match(event.request, {ignoreSearch: true, cacheName: CACHE_NAME})
        // Cache hit - return response

        if (response) {
            return response
        } else {
            console.log("No existe cache de", event.request)
            return await fetch(event.request)
        }
        //console.log("No existe cache de", event.request.)

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response
        
        //var fetchRequest = event.request.clone();

        //response = await fetch(event.request)
        // Check if we received a valid response
        
        /*if (!response || response.status !== 200 || response.type !== 'basic') {
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
            })*/

        //return response
    }());
})