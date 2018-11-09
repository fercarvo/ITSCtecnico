/**
 * Service worker para ITSC
 * 
 * 15/10/2018
 * Edgar Carvajal efcu03@gmail.com
 * 
 * Este SW servira para incrementar el performance y reducir el trafico de los aplicativos usados en ITSC
 */

const CACHE_NAME = 'Static-ITSCwebapps-v1.1'

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
        //await cache.addAll([...audiograma, ...calendario, ...qr, ...tablaGenerica])
        await cache.addAll(['/audiogramaITSC/', '/tablaGenerica/', '/qrGEN/', '/calendarioAPP/'])
    }())
})

self.addEventListener('activate', function(event) {

    event.waitUntil(async function () {
        var cacheNames = await caches.keys() //Todos los cache
        var toRemove = cacheNames.filter(c => c !== CACHE_NAME) //Se filtra todos los diferentes a CACHE_NAME
        console.log('[SW] Removiendo caches', toRemove)

        return await Promise.all(toRemove.map(c => caches.delete(c)))
    }())    
})

self.addEventListener('fetch', function(event) {
    const not_cache = [
        '/login',
        '/servidor',
        '/packin',
        '/terminal',
        '/terminal-connection',
        '/logout',
        '/'
    ]

    if ( not_cache.some(dir => RegExp(dir).test( event.request.url)) ) //Si alguno es igual al url del request, se ignora el fetchevent
        return;

    if (RegExp('/views/').test( event.request.url ))
        return event.respondWith( alwaysCache(event) );

    if (RegExp('/app.js').test( event.request.url ))
        return event.respondWith( cacheThenNetworkUpdate(event) );

    const destination = event.request.destination;

    switch (destination) {
        case 'style':
        case 'script':
        case 'document':
        case 'image':
        case 'font': {
            event.respondWith( alwaysCache(event) )
            return;
        }
        default: {
            event.respondWith( cacheThenNetworkUpdate(event) )  
            return;
        }
    }
})

async function cacheThenNetworkUpdate(event) {
    var cache = await caches.open(CACHE_NAME)
    var cacheResponse = await cache.match(event.request, {ignoreSearch: false})
    var requestToCache = event.request.clone()

    var fetchPromise = fetch(event.request).then(networkResponse => {
        
        //Si hay respuesta, pero no es 200 ok, se retorna y no se cachea
        if (networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
        }

        let responseToCache = networkResponse.clone()
        cache.put(requestToCache, responseToCache)
        console.log('[SW] Guardado en cache', event.request.url)

        return networkResponse;
    })

    return cacheResponse || fetchPromise
}

async function alwaysCache (event) {
    var response = await caches.match(event.request, {ignoreSearch: true, cacheName: CACHE_NAME})

    return response || fetch(event.request).then(networkResponse => {
        
        //Si hay respuesta, pero no es 200 ok, se retorna y no se cachea
        if (networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
        }
        
        let responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
            console.log('[SW] Guardado en cache', event.request.url)
        })

        return networkResponse;
    })
}