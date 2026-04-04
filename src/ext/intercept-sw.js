///=========================================================================
/// Service worker runtime for the hyperscript intercept feature.
/// This file is registered as a service worker by intercept.js.
/// It receives configuration via postMessage and handles caching.
///=========================================================================

'use strict';

var config = null;

self.addEventListener('message', function (e) {
	if (e.data && e.data.type === 'hs:intercept:config') {
		config = e.data.config;
	}
});

self.addEventListener('install', function (e) {
	if (!config || !config.precache || !config.precache.urls.length) return;
	e.waitUntil(
		caches.open(config.precache.version || 'hs-v1').then(function (cache) {
			return cache.addAll(config.precache.urls);
		})
	);
});

self.addEventListener('activate', function (e) {
	if (!config || !config.precache) return;
	var currentVersion = config.precache.version || 'hs-v1';
	e.waitUntil(
		caches.keys().then(function (names) {
			return Promise.all(
				names.filter(function (n) { return n !== currentVersion; })
					.map(function (n) { return caches.delete(n); })
			);
		})
	);
});

self.addEventListener('fetch', function (e) {
	if (!config || e.request.method !== 'GET') return;

	var path = new URL(e.request.url).pathname;
	var route = null;
	if (config.routes) {
		for (var i = 0; i < config.routes.length; i++) {
			var r = config.routes[i];
			for (var j = 0; j < r.patterns.length; j++) {
				var p = r.patterns[j];
				if (p === '*' || (p.startsWith('*.') && path.endsWith(p.slice(1))) ||
					(p.endsWith('/*') && path.startsWith(p.slice(0, -1))) || p === path) {
					route = r;
					break;
				}
			}
			if (route) break;
		}
	}
	if (!route) return;

	var cacheName = (config.precache && config.precache.version) || 'hs-v1';

	var fallback = function () {
		if (config.offlineFallback) {
			return caches.match(config.offlineFallback).then(function (r) {
				return r || new Response('Offline', { status: 503 });
			});
		}
		return new Response('Offline', { status: 503 });
	};

	// helper: only cache 2xx responses
	var fetchOk = function () {
		return fetch(e.request).then(function (resp) {
			if (!resp.ok) throw new Error('non-ok response: ' + resp.status);
			return resp;
		});
	};

	if (route.strategy === 'cache-first') {
		e.respondWith(
			caches.match(e.request).then(function (cached) {
				if (cached) return cached;
				return fetchOk().then(function (resp) {
					caches.open(cacheName).then(function (c) { c.put(e.request, resp.clone()); });
					return resp;
				});
			}).catch(fallback)
		);
	} else if (route.strategy === 'network-first') {
		e.respondWith(
			fetchOk().then(function (resp) {
				caches.open(cacheName).then(function (c) { c.put(e.request, resp.clone()); });
				return resp;
			}).catch(function () {
				return caches.match(e.request).then(function (c) { return c || fallback(); });
			})
		);
	} else if (route.strategy === 'stale-while-revalidate') {
		e.respondWith(
			caches.match(e.request).then(function (cached) {
				var fetched = fetchOk().then(function (resp) {
					caches.open(cacheName).then(function (c) { c.put(e.request, resp.clone()); });
					return resp;
				}).catch(function () { return cached || fallback(); });
				return cached || fetched;
			})
		);
	} else if (route.strategy === 'cache-only') {
		e.respondWith(caches.match(e.request).then(function (c) { return c || fallback(); }));
	}
	// network-only: don't intercept
});
