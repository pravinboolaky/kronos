// sw.js

const staticSite = 'kronos';
const assets = [
	'/kronos/',
	'/kronos/index.html',
	'/kronos/style.css',
	'/kronos/app.js',
	'/kronos/assets/montserrat.ttf',
	'/kronos/assets/monofonto.otf',
	'/kronos/assets/btn-pause.png',
	'/kronos/assets/btn-play.png',
	'/kronos/assets/btn-replay.png',
	'/kronos/assets/buzzer1.mp3',
	'/kronos/assets/buzzer2.mp3'
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
