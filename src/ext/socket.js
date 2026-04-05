
import { Feature } from '../parsetree/base.js';

function genUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		var r = (Math.random() * 16) | 0,
			v = c == "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

function parseUrl(url) {
	var finalUrl = url;
	if (finalUrl.startsWith("/")) {  // complete absolute paths without scheme only
		var basePart = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
		if (window.location.protocol === 'https:') {
			finalUrl = "wss://" + basePart + finalUrl;
		} else if (window.location.protocol === 'http:') {
			finalUrl = "ws://" + basePart + finalUrl;
		}
	}
	return finalUrl;
}

/** @type {(string | symbol)[]} */
var PROXY_BLACKLIST = ["then", "catch", "length", "toJSON"];

export class SocketFeature extends Feature {
	static keyword = "socket";

	constructor(socketName, nameSpace, socketObject, messageHandler) {
		super();
		this.socketName = socketName;
		this.nameSpace = nameSpace;
		this.socketObject = socketObject;
		this.messageHandler = messageHandler;
	}

	install(target, source, args, runtime) {
		this.runtime = runtime;
		runtime.assignToNamespace(target, this.nameSpace, this.socketName, this.socketObject);
	}

	static parse(parser) {
		if (!parser.matchToken("socket")) return;

		var name = parser.requireElement("dotOrColonPath");
		var qualifiedName = name.evalStatically();
		var nameSpace = qualifiedName.split(".");
		var socketName = nameSpace.pop();

		var promises = {};
		var url = parser.parseURLOrExpression();

		var defaultTimeout = 10000;
		if (parser.matchToken("with")) {
			parser.requireToken("timeout");
			defaultTimeout = parser.requireElement("expression").evalStatically();
		}

		var jsonMessages = false;
		var messageHandler = null;
		if (parser.matchToken("on")) {
			parser.requireToken("message");
			if (parser.matchToken("as")) {
				if (!parser.matchToken("JSON")) parser.requireToken("json");
				jsonMessages = true;
			}
			messageHandler = parser.requireElement("commandList");
			parser.ensureTerminated(messageHandler);
		}

		var socket = new WebSocket(parseUrl(url.evalStatically()));

		function getProxy(timeout) {
			return new Proxy(
				{},
				{
					get: function (obj, property) {
						if (PROXY_BLACKLIST.includes(property)) {
							return null;
						} else if (property === "noTimeout") {
							return getProxy(-1);
						} else if (property === "timeout") {
							return function (i) {
								return getProxy(parseInt(i));
							};
						} else {
							return function () {
								var uuid = genUUID();
								var args = [];
								for (var i = 0; i < arguments.length; i++) {
									args.push(arguments[i]);
								}
								var rpcInfo = {
									iid: uuid,
									function: property,
									args: args,
								};
								socket = socket ? socket : new WebSocket(parseUrl(url.evalStatically())); //recreate socket if needed
								socket.send(JSON.stringify(rpcInfo));

								var promise = new Promise(function (resolve, reject) {
									promises[uuid] = {
										resolve: resolve,
										reject: reject,
									};
								});

								if (timeout >= 0) {
									setTimeout(function () {
										if (promises[uuid]) {
											promises[uuid].reject("Timed out");
										}
										delete promises[uuid];
									}, timeout); // TODO configurable?
								}
								return promise;
							};
						}
					},
				}
			);
		}

		var rpcProxy = getProxy(defaultTimeout);

		var socketObject = {
			raw: socket,
			dispatchEvent: function (evt) {
				var details = evt.detail;
				// remove hyperscript internals
				delete details.sender;
				delete details._namedArgList_;
				socket.send(JSON.stringify(Object.assign({ type: evt.type }, details)));
			},
			rpc: rpcProxy,
		};

		var feature = new SocketFeature(socketName, nameSpace, socketObject, messageHandler);

		socket.onmessage = function (evt) {
			var data = evt.data;
			try {
				var dataAsJson = JSON.parse(data);
			} catch (e) {
				// not JSON
			}

			// RPC reply
			if (dataAsJson && dataAsJson.iid) {
				if (dataAsJson.throw) {
					promises[dataAsJson.iid].reject(dataAsJson.throw);
				} else {
					promises[dataAsJson.iid].resolve(dataAsJson.return);
				}
				delete promises[dataAsJson.iid];
			}

			if (messageHandler) {
				var context = feature.runtime.makeContext(socketObject, feature, socketObject);
				if (jsonMessages) {
					if (dataAsJson) {
						context.locals.message = dataAsJson;
						context.result = dataAsJson;
					} else {
						throw new Error("Received non-JSON message from socket: " + data);
					}
				} else {
					context.locals.message = data;
					context.result = data;
				}
				messageHandler.execute(context);
			}
		};

		// clear socket on close to be recreated
		socket.addEventListener("close", function (e) {
			socket = null;
		});

		if (messageHandler) {
			parser.setParent(messageHandler, feature);
		}

		return feature;
	}
}

export default function socketPlugin(_hyperscript) {
	_hyperscript.addFeature(SocketFeature.keyword, SocketFeature.parse.bind(SocketFeature));
}

// Auto-register when imported
if (typeof self !== 'undefined' && self._hyperscript) {
	self._hyperscript.use(socketPlugin);
}
