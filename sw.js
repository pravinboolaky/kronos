// sw.js

const staticSite = 'chrono-ffta';
const assets = [
	'/chrono-ffta/',
	'/chrono-ffta/index.html',
	'/chrono-ffta/style.css',
	'/chrono-ffta/app.js',
	'/chrono-ffta/assets/montserrat.ttf',
	'/chrono-ffta/assets/monofonto.otf',
	'/chrono-ffta/assets/btn-pause.png',
	'/chrono-ffta/assets/btn-play.png',
	'/chrono-ffta/assets/btn-replay.png',
	'/chrono-ffta/assets/buzzer1.mp3',
	'/chrono-ffta/assets/buzzer2.mp3'
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
