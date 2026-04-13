(() => {
  // src/parsetree/base.js
  var ParseElement = class _ParseElement {
    errors = [];
    collectErrors(visited) {
      if (!visited) visited = /* @__PURE__ */ new Set();
      if (visited.has(this)) return [];
      visited.add(this);
      var all = [...this.errors];
      for (var key of Object.keys(this)) {
        for (var item of [this[key]].flat()) {
          if (item instanceof _ParseElement) {
            all.push(...item.collectErrors(visited));
          }
        }
      }
      return all;
    }
    sourceFor() {
      return this.programSource.substring(this.startToken.start, this.endToken.end);
    }
    lineFor() {
      return this.programSource.split("\n")[this.startToken.line - 1];
    }
    static parseEventArgs(parser) {
      var args = [];
      if (parser.token(0).value === "(" && (parser.token(1).value === ")" || parser.token(2).value === "," || parser.token(2).value === ")")) {
        parser.matchOpToken("(");
        do {
          args.push(parser.requireTokenType("IDENTIFIER"));
        } while (parser.matchOpToken(","));
        parser.requireOpToken(")");
      }
      return args;
    }
  };
  var Feature = class extends ParseElement {
    isFeature = true;
    constructor() {
      super();
      if (this.constructor.keyword) {
        this.type = this.constructor.keyword + "Feature";
      }
    }
    install(target, source, args, runtime) {
    }
    /**
     * Parse optional catch/finally blocks after a command list.
     * Returns { errorHandler, errorSymbol, finallyHandler }
     */
    static parseErrorAndFinally(parser) {
      var errorSymbol, errorHandler, finallyHandler;
      if (parser.matchToken("catch")) {
        errorSymbol = parser.requireTokenType("IDENTIFIER").value;
        errorHandler = parser.requireElement("commandList");
        parser.ensureTerminated(errorHandler);
      }
      if (parser.matchToken("finally")) {
        finallyHandler = parser.requireElement("commandList");
        parser.ensureTerminated(finallyHandler);
      }
      return { errorHandler, errorSymbol, finallyHandler };
    }
  };

  // src/ext/eventsource.js
  async function* parseSSE(reader) {
    var decoder = new TextDecoder();
    var buffer = "";
    var hasData = false;
    var message = { data: "", event: "", id: "", retry: null };
    var firstChunk = true;
    try {
      while (true) {
        var { done, value } = await reader.read();
        if (done) break;
        var chunk = decoder.decode(value, { stream: true });
        if (firstChunk) {
          if (chunk.charCodeAt(0) === 65279) chunk = chunk.slice(1);
          firstChunk = false;
        }
        buffer += chunk;
        var lines = buffer.split(/\r\n|\r|\n/);
        buffer = lines.pop() || "";
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line) {
            if (hasData) {
              yield message;
              hasData = false;
              message = { data: "", event: "", id: "", retry: null };
            }
            continue;
          }
          var colonIndex = line.indexOf(":");
          if (colonIndex === 0) continue;
          var field, val;
          if (colonIndex < 0) {
            field = line;
            val = "";
          } else {
            field = line.slice(0, colonIndex);
            val = line.slice(colonIndex + 1);
            if (val[0] === " ") val = val.slice(1);
          }
          if (field === "data") {
            message.data += (hasData ? "\n" : "") + val;
            hasData = true;
          } else if (field === "event") {
            message.event = val;
          } else if (field === "id") {
            if (!val.includes("\0")) message.id = val;
          } else if (field === "retry") {
            var retryValue = parseInt(val, 10);
            if (!isNaN(retryValue)) message.retry = retryValue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  function matchesEventPattern(pattern, eventName) {
    if (pattern === eventName) return true;
    if (!pattern.includes("*")) return false;
    var regex = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
    return regex.test(eventName);
  }
  var EventSourceFeature = class _EventSourceFeature extends Feature {
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
    static parse(parser) {
      if (!parser.matchToken("eventsource")) return;
      var urlElement;
      var withCredentials = false;
      var method = "GET";
      var headers = null;
      var name = parser.requireElement("dotOrColonPath");
      var qualifiedName = name.evalStatically();
      var nameSpace = qualifiedName.split(".");
      var eventSourceName = nameSpace.pop();
      if (parser.matchToken("from")) {
        urlElement = parser.parseURLOrExpression();
      }
      while (parser.matchToken("with")) {
        if (parser.matchToken("credentials")) {
          withCredentials = true;
        } else if (parser.matchToken("method")) {
          method = parser.requireElement("stringLike").evalStatically().toUpperCase();
        } else if (parser.matchToken("headers")) {
          headers = parser.requireElement("objectLiteral");
        } else {
          parser.raiseExpected("credentials", "method", "headers");
        }
      }
      var staticHeaders = null;
      if (headers) {
        staticHeaders = {};
        for (var i = 0; i < headers.keyExpressions.length; i++) {
          var key = headers.keyExpressions[i].evalStatically();
          var val = headers.valueExpressions[i].evalStatically();
          staticHeaders[key] = val;
        }
      }
      var stub = createStub(withCredentials, method, staticHeaders);
      var feature = new _EventSourceFeature(eventSourceName, nameSpace, stub);
      while (parser.matchToken("on")) {
        var eventName = parser.requireElement("stringLike").evalStatically();
        var encoding = "";
        if (parser.matchToken("as")) {
          encoding = parser.requireElement("stringLike").evalStatically();
        }
        var commandList = parser.requireElement("commandList");
        parser.ensureTerminated(commandList);
        parser.requireToken("end");
        stub.listeners.push({
          type: eventName,
          handler: makeHandler(encoding, commandList, stub, feature)
        });
      }
      parser.requireToken("end");
      if (urlElement != void 0) {
        stub.open(urlElement.evalStatically());
      }
      return feature;
    }
  };
  function createStub(withCredentials, method, headers) {
    var stub = {
      listeners: [],
      retryCount: 0,
      closed: false,
      abortController: null,
      reader: null,
      lastEventId: null,
      reconnectTimeout: null,
      url: null,
      withCredentials,
      method,
      headers,
      open: function(url) {
        if (url == void 0) {
          if (stub.url != null) {
            url = stub.url;
          } else {
            throw new Error("no url defined for EventSource.");
          }
        }
        if (stub.url === url && stub.abortController && !stub.abortController.signal.aborted) {
          return;
        }
        if (stub.abortController) {
          stub.abortController.abort();
        }
        stub.closed = false;
        stub.url = url;
        startConnection(stub);
      },
      close: function() {
        stub.closed = true;
        if (stub.reconnectTimeout) {
          clearTimeout(stub.reconnectTimeout);
          stub.reconnectTimeout = null;
        }
        if (stub.abortController) {
          stub.abortController.abort();
          stub.abortController = null;
        }
        stub.retryCount = 0;
        dispatch(stub, "close", { type: "close" });
      },
      addEventListener: function(type, handler, options) {
        stub.listeners.push({ type, handler, options });
      }
    };
    return stub;
  }
  function startConnection(stub) {
    var ac = new AbortController();
    stub.abortController = ac;
    var fetchOptions = {
      method: stub.method,
      signal: ac.signal,
      headers: Object.assign({}, stub.headers || {})
    };
    if (stub.withCredentials) {
      fetchOptions.credentials = "include";
    }
    if (stub.lastEventId) {
      fetchOptions.headers["Last-Event-ID"] = stub.lastEventId;
    }
    fetch(stub.url, fetchOptions).then(function(response) {
      if (ac.signal.aborted) return;
      if (!response.ok) {
        throw new Error("SSE connection failed with status " + response.status);
      }
      stub.retryCount = 0;
      dispatch(stub, "open", { type: "open" });
      return readStream(stub, response.body.getReader(), ac);
    }).catch(function(err) {
      if (ac.signal.aborted) return;
      dispatch(stub, "error", { type: "error", error: err });
      scheduleReconnect(stub);
    });
  }
  async function readStream(stub, reader, ac) {
    stub.reader = reader;
    var baseDelay = 500;
    try {
      for await (var msg of parseSSE(reader)) {
        if (ac.signal.aborted) break;
        if (msg.id) stub.lastEventId = msg.id;
        if (msg.retry != null) baseDelay = msg.retry;
        var eventType = msg.event || "message";
        var evt = {
          type: eventType,
          data: msg.data,
          lastEventId: msg.id || stub.lastEventId || ""
        };
        dispatch(stub, eventType, evt);
      }
    } catch (err) {
      if (!ac.signal.aborted) {
        dispatch(stub, "error", { type: "error", error: err });
      }
    }
    stub.reader = null;
    if (!stub.closed && !ac.signal.aborted) {
      scheduleReconnect(stub, baseDelay);
    }
  }
  function scheduleReconnect(stub, baseDelay) {
    if (stub.closed) return;
    baseDelay = baseDelay || 500;
    stub.retryCount = Math.min(7, stub.retryCount + 1);
    var timeout = Math.random() * 2 ** stub.retryCount * baseDelay;
    stub.reconnectTimeout = setTimeout(function() {
      stub.reconnectTimeout = null;
      if (!stub.closed) startConnection(stub);
    }, timeout);
  }
  function dispatch(stub, eventType, evt) {
    for (var i = 0; i < stub.listeners.length; i++) {
      var listener = stub.listeners[i];
      if (matchesEventPattern(listener.type, eventType)) {
        try {
          listener.handler(evt);
        } catch (e) {
          console.error("Error in SSE handler for '" + listener.type + "':", e);
        }
      }
    }
  }
  function makeHandler(encoding, commandList, stub, feature) {
    return function(evt) {
      var data = decode(evt.data, encoding);
      var context = feature.runtime.makeContext(stub, feature, stub);
      context.event = evt;
      context.result = data;
      commandList.execute(context);
    };
  }
  function decode(data, encoding) {
    if (encoding.toLowerCase() === "json") {
      return JSON.parse(data);
    }
    return data;
  }
  function createStream(response, runtime, context) {
    var element = context.me;
    var reader = response.body.getReader();
    var messages = [];
    var waiting = null;
    var done = false;
    (async function() {
      try {
        for await (var msg of parseSSE(reader)) {
          var eventType = msg.event || "message";
          if (msg.event) {
            runtime.triggerEvent(element, eventType, {
              data: msg.data,
              lastEventId: msg.id || ""
            });
          } else {
            messages.push(msg.data);
            if (waiting) {
              waiting.resolve({ value: msg.data, done: false });
              waiting = null;
            }
          }
        }
      } catch (err) {
        runtime.triggerEvent(element, "stream-error", { error: err });
      }
      done = true;
      if (waiting) {
        waiting.resolve({ value: void 0, done: true });
        waiting = null;
      }
      runtime.triggerEvent(element, "streamEnd", {});
    })();
    var stream = {
      element,
      [Symbol.asyncIterator]: function() {
        var index = 0;
        return {
          next: function() {
            if (index < messages.length) {
              return Promise.resolve({ value: messages[index++], done: false });
            }
            if (done) {
              return Promise.resolve({ value: void 0, done: true });
            }
            return new Promise(function(resolve) {
              waiting = { resolve };
            }).then(function(result) {
              if (!result.done) index++;
              return result;
            });
          }
        };
      }
    };
    return stream;
  }
  var streamConversion = function(response, runtime, context) {
    return createStream(response, runtime, context);
  };
  streamConversion._rawResponse = true;
  function eventsourcePlugin(_hyperscript) {
    _hyperscript.addFeature(EventSourceFeature.keyword, EventSourceFeature.parse.bind(EventSourceFeature));
    _hyperscript.config.conversions.Stream = streamConversion;
  }
  if (typeof self !== "undefined" && self._hyperscript) {
    self._hyperscript.use(eventsourcePlugin);
  }
})();
//# sourceMappingURL=eventsource.js.map
