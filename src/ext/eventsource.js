///=========================================================================
/// This module provides the EventSource (SSE) feature for hyperscript
///=========================================================================

import { Feature } from '../parsetree/base.js';

export class EventSourceFeature extends Feature {
	static keyword = "eventsource";

	constructor(eventSourceName, nameSpace, stub) {
		super();
		this.eventSourceName = eventSourceName;
		this.nameSpace = nameSpace;
		this.stub = stub;
	}

	install(target, source, args, runtime) {
		this.runtime = runtime;
		runtime.assignToNamespace(target, this.nameSpace, this.eventSourceName, this.stub);
	}

	/**
	 * @param {import('../../src/core/parser.js').Parser} parser
	 * @returns {EventSourceFeature | undefined}
	 */
	static parse(parser) {
		if (!parser.matchToken("eventsource")) return;

		var urlElement;
		var withCredentials = false;

		// Get the name we'll assign to this EventSource in the hyperscript context
		var name = parser.requireElement("dotOrColonPath");
		var qualifiedName = name.evaluate();
		var nameSpace = qualifiedName.split(".");
		var eventSourceName = nameSpace.pop();

		// Get the URL of the EventSource
		if (parser.matchToken("from")) {
			urlElement = parser.requireElement("stringLike");
		}

		// Get option to connect with/without credentials
		if (parser.matchToken("with")) {
			if (parser.matchToken("credentials")) {
				withCredentials = true;
			}
		}

		var stub = {
			eventSource: null,
			listeners: [],
			retryCount: 0,
			open: function (url) {
				if (url == undefined) {
					if (stub.eventSource != null && stub.eventSource.url != undefined) {
						url = stub.eventSource.url;
					} else {
						throw "no url defined for EventSource.";
					}
				}

				// Guard multiple opens on the same EventSource
				if (stub.eventSource != null) {
					if (url != stub.eventSource.url) {
						stub.eventSource.close();
					} else if (stub.eventSource.readyState != EventSource.CLOSED) {
						return;
					}
				}

				stub.eventSource = new EventSource(url, {
					withCredentials: withCredentials,
				});

				// On successful connection, reset retry count
				stub.eventSource.addEventListener("open", function (event) {
					stub.retryCount = 0;
				});

				// On connection error, use exponential backoff to retry
				stub.eventSource.addEventListener("error", function (event) {
					if (stub.eventSource.readyState == EventSource.CLOSED) {
						stub.retryCount = Math.min(7, stub.retryCount + 1);
						var timeout = Math.random() * (2 ^ stub.retryCount) * 500;
						window.setTimeout(stub.open, timeout);
					}
				});

				// Add event listeners
				for (var index = 0; index < stub.listeners.length; index++) {
					var item = stub.listeners[index];
					stub.eventSource.addEventListener(item.type, item.handler, item.options);
				}
			},
			close: function () {
				if (stub.eventSource != undefined) {
					stub.eventSource.close();
				}
				stub.retryCount = 0;
			},
			addEventListener: function (type, handler, options) {
				stub.listeners.push({
					type: type,
					handler: handler,
					options: options,
				});

				if (stub.eventSource != null) {
					stub.eventSource.addEventListener(type, handler, options);
				}
			},
		};

		var feature = new EventSourceFeature(eventSourceName, nameSpace, stub);

		// Parse each event listener and add it into the list
		while (parser.matchToken("on")) {
			var eventName = parser.requireElement("stringLike").evaluate();

			// default encoding is "" (autodetect)
			var encoding = "";

			// look for alternate encoding
			if (parser.matchToken("as")) {
				encoding = parser.requireElement("stringLike").evaluate();
			}

			var commandList = parser.requireElement("commandList");
			parser.ensureTerminated(commandList);
			parser.requireToken("end");

			stub.listeners.push({
				type: eventName,
				handler: makeHandler(encoding, commandList, stub, feature),
			});
		}

		parser.requireToken("end");

		// If we have a URL element, connect to the remote server now
		if (urlElement != undefined) {
			stub.open(urlElement.evaluate());
		}

		return feature;
	}
}

/**
 * Makes an event handler function that executes the correct hyperscript commands.
 *
 * @param {string} encoding
 * @param {*} commandList
 * @param {*} stub
 * @param {EventSourceFeature} feature
 * @returns {(event: Event) => void}
 */
function makeHandler(encoding, commandList, stub, feature) {
	return function (evt) {
		var data = decode(evt["data"], encoding);
		var context = feature.runtime.makeContext(stub, feature, stub);
		context.event = evt;
		context.result = data;
		commandList.execute(context);
	};
}

/**
 * Decodes/Unmarshals a string based on the selected encoding.
 *
 * @param {string} data
 * @param {string} encoding
 * @returns {string|object}
 */
function decode(data, encoding) {
	if (encoding == "json") {
		return JSON.parse(data);
	}
	return data;
}

/**
 * @param {import('../dist/_hyperscript').Hyperscript} _hyperscript
 */
export default function eventsourcePlugin(_hyperscript) {
	_hyperscript.addFeature(EventSourceFeature.keyword, EventSourceFeature.parse.bind(EventSourceFeature));
}

// Auto-register when imported
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(eventsourcePlugin);
}
