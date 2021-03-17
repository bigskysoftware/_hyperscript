///=========================================================================
/// This module provides the EventSource (SSE) feature for hyperscript
///=========================================================================

// QUESTION: Is it OK to pack additional data into the "Feature" struct that's returned?
// TODO: Add methods for EventSourceFeature.connect() and EventSourceFeature.close()

/**
 * @typedef {object} EventSourceFeature
 * @property {string} name
 * @property {EventSourceStub} object
 * @property {() => void} install
 * 
 * @typedef {object} EventSourceStub
 * @property {EventSource} eventSource
 * @property {Object.<string, EventHandlerNonNull>} listeners
 * @property {number} retryCount
 * @property {() => void} open
 * @property {() => void} close
 * @property {(type: keyof HTMLElementEventMap, listener:(event: Event) => any, options?: boolean | AddEventListenerOptions) => void} addEventListener
 * 
 */

(function () {

	 _hyperscript.addFeature("eventsource", function(parser, runtime, tokens) {

		if (tokens.matchToken('eventsource')) {

			// Get the name we'll assign to this EventSource in the hyperscript context

			/** @type {string} */ 
			var name = parser.requireElement("dotOrColonPath", tokens).evaluate();

			var nameSpace = name.split(".");
			var eventSourceName = nameSpace.pop();

			// Get the URL of the EventSource
			var url = parser.requireElement("stringLike", tokens);

			// Get option to connect with/without credentials
			var withCredentials = false;

			if (tokens.matchToken("with")) {
				if (tokens.matchToken("credentials")) {
					withCredentials = true;
				}
			}

			/** @type EventSourceStub */
			var stub = {
				eventSource: null,
				listeners: {},
				retryCount: 0,
				open: function () {

					// Guard ensures that EventSource is empty, or already closed.
					if (stub.eventSource != null) {
						if (stub.eventSource.readyState != EventSource.CLOSED) {
							return;
						}
					}
	
					// Open the EventSource and get ready to populate event handlers
					stub.eventSource = new EventSource(url.evaluate(), {withCredentials:withCredentials});
	
					// On successful connection.  Reset retry count.
					stub.eventSource.addEventListener("open", function(event) {
						stub.retryCount = 0;
					})
	
					// On connection error, use exponential backoff to retry (random values from 1 second to 2^7 (128) seconds
					stub.eventSource.addEventListener("error", function(event) {

						// If the EventSource is closed, then try to reopen
						if (stub.eventSource.readyState == EventSource.CLOSED) {
							stub.retryCount = Math.min(7, stub.retryCount + 1);
							var timeout = Math.random() * (2 ^ stub.retryCount) * 500;
							window.setTimeout(stub.open, timeout);
						}
					})
	
					// Add event listeners
					for (var key in stub.listeners) {
						stub.eventSource.addEventListener(key, stub.listeners[key]);
					}
				},
				close: function() {
					stub.eventSource.close();
					stub.retryCount = 0;
				},
				addEventListener: function(type, listener, options) {
					return stub.eventSource.addEventListener(type, listener, options);
				}
			}

			// Create the "feature" that will be returned by this function.

			/** @type {EventSourceFeature} */
			var feature = {
				name: eventSourceName,
				object: stub,
				install: function () {
					runtime.assignToNamespace(nameSpace, eventSourceName, stub);
				}
			};

			// Parse each event listener and add it into the list
			while (tokens.matchToken("on")) {
				
				// get event name
				var eventName = parser.requireElement("stringLike", tokens, "Expected event name").evaluate();  // OK to evaluate this in real-time?

				// default encoding is "" (autodetect)
				var encoding = "";

				// look for alternate encoding
				if (tokens.matchToken("as")) {
					encoding = parser.requireElement("stringLike", tokens, "Expected encoding type").evaluate(); // Ok to evaluate this in real time?
				}

				// get command list for this event handler
				var commandList = parser.requireElement("commandList", tokens);
				addImplicitReturnToCommandList(commandList);
				tokens.requireToken("end");

				// Save the event listener into the feature.  This lets us
				// connect listeners to new EventSources if we have to reconnect.
				stub.listeners[eventName] = makeListener(encoding, commandList);
			}

			tokens.requireToken("end");

			// Connect to the remote server
			stub.open();

			// Success!
			return feature;


			////////////////////////////////////////////
			// ADDITIONAL HELPER FUNCTIONS HERE...
			////////////////////////////////////////////

			/**
			 * Makes an eventListener funtion that can execute the correct hyperscript commands
			 * This is outside of the main loop so that closures don't cause us to run the wrong commands.
			 * 
			 * @param {string} encoding 
			 * @param {*} commandList 
			 * @returns {EventHandlerNonNull}
			 */
			function makeListener(encoding, commandList) {
				return function(evt) {
					var data = decode(evt['data'], encoding);
					var context = runtime.makeContext(stub, feature, stub);
					context.event = evt;
					context.result = data;
					commandList.execute(context);    
				}
			}

			/**
			 * Decodes/Unmarshals a string based on the selected encoding.  If the 
			 * encoding is not recognized, attempts to auto-detect based on its content
			 * 
			 * @param {string} data - The original data to be decoded
			 * @param {string} encoding - The method that the data is currently encoded ("string", "json", or unknown)
			 * @returns {string} - The decoded data
			 */
			function decode(data, encoding) {

				// Force JSON encoding
				if (encoding == "json") {
					return JSON.parse(data);
				}

				// Otherwise, return the data without modification
				return data
			}

			/**
			 * Adds a "HALT" command to the commandList.
			 * TODO: This seems like something that could be optimized:
			 * maybe the parser could do automatically,
			 * or could be a public function in the parser available to everyone,
			 * or the command-executer-thingy could just handle nulls implicitly.
			 * 
			 * @param {*} commandList 
			 * @returns void
			 */
			function addImplicitReturnToCommandList(commandList) {

				if (commandList.next) {
					return addImplicitReturnToCommandList(commandList.next);
				}

				commandList.next = {
					type: "implicitReturn",
					op: function (_context) {
						return runtime.HALT;
					},
					execute: function (_context) {
						// do nothing
					}
				}
			}				
		}
	})
})()