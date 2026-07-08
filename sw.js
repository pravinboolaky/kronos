// sw.js

const staticSite = 'kronos';
const assets = [
	'/kronos/',
	'/kronos/index.html',
	'/kronos/style.css',
	'/kronos/app.js'
];

self.addEventListener('install', (installEvent) => {
	installEvent.waitUntil(
		caches.open(staticSite).then((cache) => {
			cache.addAll(assets);
		})
	);
});

self.addEventListener('fetch', (fetchEvent) => {
	fetchEvent.respondWith(
		caches.match(fetchEvent.request).then((res) => {
			return res || fetch(fetchEvent.request);
		})
	);
});
