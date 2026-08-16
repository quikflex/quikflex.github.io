const CACHE_NAME = "quikscan-v1";

const ASSETS = [
    "/",
    "/index.html",
    "/style.css",
    "/script.bundle.js",

    "/ocr/ppocr.js",

    "/ocr/ppocrv6-tiny-det.tar",
    "/ocr/ppocrv6-tiny-rec.tar",

    "/ocr/det/inference.onnx",
    "/ocr/det/inference.yml",

    "/ocr/rec/inference.onnx",
    "/ocr/rec/inference.yml",

    "/ocr/wasm/ort-wasm-simd-threaded.mjs",
    "/ocr/wasm/ort-wasm-simd-threaded.wasm",

    "/images/favicon-96x96.png",
    "/images/favicon.svg",
    "/images/favicon.ico",
    "/images/apple-touch-icon.png",
    "/images/site.webmanifest"
];


/* =========================
   INSTALL
   ========================= */

self.addEventListener(
    "install",
    event => {

        console.log(
            "QuikScan service worker installing..."
        );

        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(
                    cache =>
                        cache.addAll(ASSETS)
                )
        );

        self.skipWaiting();
    }
);


/* =========================
   ACTIVATE
   ========================= */

self.addEventListener(
    "activate",
    event => {

        console.log(
            "QuikScan service worker activated."
        );

        event.waitUntil(

            caches.keys()
                .then(
                    cacheNames =>

                        Promise.all(
                            cacheNames
                                .filter(
                                    name =>
                                        name !==
                                        CACHE_NAME
                                )
                                .map(
                                    name =>
                                        caches.delete(
                                            name
                                        )
                                )
                        )
                )
        );

        self.clients.claim();
    }
);


/* =========================
   FETCH
   ========================= */

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !==
            "GET"
        ) {
            return;
        }

        event.respondWith(

            caches.match(
                event.request
            )
            .then(
                cachedResponse => {

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(
                        event.request
                    )
                    .then(
                        response => {

                            if (
                                !response ||
                                response.status !== 200 ||
                                response.type ===
                                    "opaque"
                            ) {
                                return response;
                            }

                            const responseClone =
                                response.clone();

                            caches
                                .open(
                                    CACHE_NAME
                                )
                                .then(
                                    cache =>
                                        cache.put(
                                            event.request,
                                            responseClone
                                        )
                                );

                            return response;
                        }
                    );
                }
            )
        );
    }
);
