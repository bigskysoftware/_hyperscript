///=========================================================================
/// This module provides the intercept feature for hyperscript.
///
/// Parses `intercept` declarations and registers a companion service
/// worker (intercept-sw.js) to handle caching and request interception.
///=========================================================================

'use strict';

import { Feature } from '../parsetree/base.js';

// Resolve the companion service worker URL relative to this file
var swUrl = new URL('intercept-sw.js', import.meta.url).href;

function consumeNakedPath(parser) {
	var cur = parser.currentToken();
	if (cur.type === "STRING") return parser.consumeToken().value;
	if (cur.value === "/" || cur.value === "*") {
		// consume until whitespace or comma
		var result = "";
		while (parser.hasMore() && parser.currentToken().value !== ",") {
			result += parser.consumeToken().value;
			// check if whitespace followed the token we just consumed
			if (parser.lastWhitespace()) break;
		}
		return result;
	}
	parser.raiseError("Expected a path (e.g. / or /app or *.css)");
}

function consumeStringOrPath(parser) {
	if (parser.currentToken().type === "STRING") return parser.consumeToken().value;
	return consumeNakedPath(parser);
}

function consumeStrategy(parser) {
	var name = parser.requireTokenType("IDENTIFIER").value;
	if (parser.matchOpToken("-")) name += "-" + parser.requireTokenType("IDENTIFIER").value;
	if (parser.matchOpToken("-")) name += "-" + parser.requireTokenType("IDENTIFIER").value;
	var valid = ['cache-first', 'network-first', 'stale-while-revalidate', 'network-only', 'cache-only'];
	if (valid.indexOf(name) === -1) {
		parser.raiseError("Unknown strategy: " + name + ". Expected: " + valid.join(", "));
	}
	return name;
}

class InterceptFeature extends Feature {
	static keyword = "intercept";

	constructor(config) {
		super();
		this.config = config;
	}

	static parse(parser) {
		if (!parser.matchToken("intercept")) return;

		var scope = consumeNakedPath(parser);
		var config = { scope: scope, precache: null, routes: [], offlineFallback: null };

		while (parser.hasMore() && parser.currentToken().value !== "end") {
			if (parser.matchToken("precache")) {
				var urls = [];
				do {
					urls.push(consumeStringOrPath(parser));
				} while (parser.matchOpToken(","));
				var version = null;
				if (parser.matchToken("as")) {
					version = parser.requireTokenType("STRING").value;
				}
				config.precache = { urls: urls, version: version };
			} else if (parser.matchToken("on")) {
				var patterns = [];
				do {
					patterns.push(consumeNakedPath(parser));
				} while (parser.matchOpToken(","));
				parser.requireToken("use");
				var strategy = consumeStrategy(parser);
				config.routes.push({ patterns: patterns, strategy: strategy });
			} else if (parser.matchToken("offline")) {
				parser.requireToken("fallback");
				config.offlineFallback = consumeStringOrPath(parser);
			} else {
				parser.raiseError("Expected precache, on, offline, or end");
			}
		}
		parser.requireToken("end");

		return new InterceptFeature(config);
	}

	install(target, source, args, runtime) {
		if (!('serviceWorker' in navigator)) {
			console.warn("hyperscript: intercept requires service worker support");
			return;
		}

		if (InterceptFeature.installed) {
			console.warn("hyperscript: only one intercept declaration is allowed per app — ignoring subsequent declarations");
			return;
		}
		InterceptFeature.installed = true;

		var config = this.config;

		navigator.serviceWorker.register(swUrl, { scope: config.scope })
			.then(function (registration) {
				var sw = registration.installing || registration.waiting || registration.active;
				if (sw) {
					if (sw.state === 'activated') {
						sw.postMessage({ type: 'hs:intercept:config', config: config });
					} else {
						sw.addEventListener('statechange', function () {
							if (sw.state === 'activated') {
								sw.postMessage({ type: 'hs:intercept:config', config: config });
							}
						});
					}
				}
			})
			.catch(function (err) {
				if (err.name === 'SecurityError') {
					console.error(
						"hyperscript: intercept scope '" + config.scope + "' is wider than " +
						"the service worker's directory. Either:\n" +
						"  1. Serve intercept-sw.js from the site root\n" +
						"  2. Add the header: Service-Worker-Allowed: " + config.scope
					);
				} else {
					console.error("hyperscript: intercept registration failed:", err);
				}
			});
	}
}

export default function interceptPlugin(_hyperscript) {
	_hyperscript.addFeature(InterceptFeature.keyword, InterceptFeature.parse.bind(InterceptFeature));
}

// Auto-register when imported
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(interceptPlugin);
}
