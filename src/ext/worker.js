///=========================================================================
/// This module provides the worker feature for hyperscript
///=========================================================================

'use strict';

import { Feature } from '../parsetree/base.js';

var invocationIdCounter = 0;

var workerFunc = function (self) {
	self.onmessage = function (e) {
		switch (e.data.type) {
			case "init":
				self.importScripts(e.data._hyperscript);
				self.importScripts.apply(self, e.data.extraScripts);
				const _hyperscript = self['_hyperscript']
				var hyperscript = _hyperscript.parse(e.data.src);
				hyperscript.apply(self, self);
				postMessage({ type: "didInit" });
				break;
			case "call":
				try {
					var result = self['_hyperscript'].internals.runtime
						.getHyperscriptFeatures(self)[e.data.function]
						.apply(self, e.data.args);
					Promise.resolve(result)
						.then(function (value) {
							postMessage({
								type: "resolve",
								id: e.data.id,
								value: value,
							});
						})
						.catch(function (error) {
							postMessage({
								type: "reject",
								id: e.data.id,
								error: error.toString(),
							});
						});
				} catch (error) {
					postMessage({
						type: "reject",
						id: e.data.id,
						error: error.toString(),
					});
				}
				break;
		}
	};
};

var workerCode = "(" + workerFunc.toString() + ")(self)";
var blob = new Blob([workerCode], { type: "text/javascript" });
var workerUri = URL.createObjectURL(blob);

class WorkerFeature extends Feature {
	static keyword = "worker";

	constructor(workerName, nameSpace, worker, stubs) {
		super();
		this.workerName = workerName;
		this.name = workerName;
		this.nameSpace = nameSpace;
		this.worker = worker;
		this.stubs = stubs;
	}

	static parse(parser) {
		if (parser.matchToken("worker")) {
			var name = parser.requireElement("dotOrColonPath");
			var qualifiedName = name.evalStatically();
			var nameSpace = qualifiedName.split(".");
			var workerName = nameSpace.pop();

			// Parse extra scripts
			var extraScripts = [];
			if (parser.matchOpToken("(")) {
				if (parser.matchOpToken(")")) {
					// no external scripts
				} else {
					do {
						var extraScript = parser.requireTokenType("STRING").value;
						var absoluteUrl = new URL(extraScript, location.href).href;
						extraScripts.push(absoluteUrl);
					} while (parser.matchOpToken(","));
					parser.requireOpToken(")");
				}
			}

			// Consume worker methods

			var funcNames = [];
			var bodyStartIndex = parser.consumed.length;
			var bodyEndIndex = parser.consumed.length;
			do {
				var feature = parser.parseAnyOf(["defFeature", "jsFeature"]);
				if (feature) {
					if (feature.type === "defFeature") {
						funcNames.push(feature.name);
						bodyEndIndex = parser.consumed.length;
					} else {
						if (parser.hasMore()) continue;
					}
				} else break;
			} while (parser.matchToken("end") && parser.hasMore()); // worker end

			var bodyTokens = parser.consumed.slice(bodyStartIndex, bodyEndIndex + 1);
			var bodySrc = parser.source.substring(bodyTokens[0].start, bodyTokens[bodyTokens.length - 1].end);

			// Create worker

			var worker = new Worker(workerUri);

			// Send init message to worker

			worker.postMessage({
				type: "init",
				_hyperscript: document.currentScript?.src || '/dist/_hyperscript.js',
				extraScripts: extraScripts,
				src: bodySrc,
			});

			var workerPromise = new Promise(function (resolve, reject) {
				worker.addEventListener(
					"message",
					function (e) {
						if (e.data.type === "didInit") resolve();
					},
					{ once: true }
				);
			});

			// Create function stubs
			var stubs = {};
			funcNames.forEach(function (funcName) {
				stubs[funcName] = function () {
					var args = arguments;
					return new Promise(function (resolve, reject) {
						var id = invocationIdCounter++;
						worker.addEventListener("message", function returnListener(e) {
							if (e.data.id !== id) return;
							worker.removeEventListener("message", returnListener);
							if (e.data.type === "resolve") resolve(e.data.value);
							else reject(e.data.error);
						});
						workerPromise.then(function () {
							// Worker has been initialized, send invocation.
							worker.postMessage({
								type: "call",
								function: funcName,
								args: Array.from(args),
								id: id,
							});
						});
					});
				};
			});

			return new WorkerFeature(workerName, nameSpace, worker, stubs);
		}
	}

	install(target, source, args, runtime) {
		runtime.assignToNamespace(target, this.nameSpace, this.workerName, this.stubs);
	}
}

export default function workerPlugin(_hyperscript) {
	_hyperscript.addFeature(WorkerFeature.keyword, WorkerFeature.parse.bind(WorkerFeature));
}

// Auto-register when imported
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(workerPlugin);
}
