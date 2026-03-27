var __defProp = Object.defineProperty;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/parsetree/base.js
var ParseElement = class {
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
  constructor() {
    super();
    __publicField(this, "isFeature", true);
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
var _EventSourceFeature = class _EventSourceFeature extends Feature {
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
    var name = parser.requireElement("dotOrColonPath");
    var qualifiedName = name.evaluate();
    var nameSpace = qualifiedName.split(".");
    var eventSourceName = nameSpace.pop();
    if (parser.matchToken("from")) {
      urlElement = parser.requireElement("stringLike");
    }
    if (parser.matchToken("with")) {
      if (parser.matchToken("credentials")) {
        withCredentials = true;
      }
    }
    var stub = {
      eventSource: null,
      listeners: [],
      retryCount: 0,
      closed: false,
      reconnectTimeout: null,
      open: function(url) {
        if (url == void 0) {
          if (stub.eventSource != null && stub.eventSource.url != void 0) {
            url = stub.eventSource.url;
          } else {
            throw new Error("no url defined for EventSource.");
          }
        }
        if (stub.eventSource != null) {
          if (url != stub.eventSource.url) {
            stub.eventSource.close();
          } else if (stub.eventSource.readyState != EventSource.CLOSED) {
            return;
          }
        }
        stub.closed = false;
        stub.eventSource = new EventSource(url, {
          withCredentials
        });
        stub.eventSource.addEventListener("open", function() {
          stub.retryCount = 0;
        });
        stub.eventSource.addEventListener("error", function() {
          stub.eventSource.close();
          if (!stub.closed) {
            stub.retryCount = Math.min(7, stub.retryCount + 1);
            var timeout = Math.random() * __pow(2, stub.retryCount) * 500;
            stub.reconnectTimeout = window.setTimeout(stub.open, timeout);
          }
        });
        for (var index = 0; index < stub.listeners.length; index++) {
          var item = stub.listeners[index];
          stub.eventSource.addEventListener(item.type, item.handler, item.options);
        }
      },
      close: function() {
        stub.closed = true;
        if (stub.reconnectTimeout) {
          clearTimeout(stub.reconnectTimeout);
          stub.reconnectTimeout = null;
        }
        if (stub.eventSource != void 0) {
          stub.eventSource.close();
        }
        stub.retryCount = 0;
      },
      addEventListener: function(type, handler, options) {
        stub.listeners.push({
          type,
          handler,
          options
        });
        if (stub.eventSource != null) {
          stub.eventSource.addEventListener(type, handler, options);
        }
      }
    };
    var feature = new _EventSourceFeature(eventSourceName, nameSpace, stub);
    while (parser.matchToken("on")) {
      var eventName = parser.requireElement("stringLike").evaluate();
      var encoding = "";
      if (parser.matchToken("as")) {
        encoding = parser.requireElement("stringLike").evaluate();
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
      stub.open(urlElement.evaluate());
    }
    return feature;
  }
};
__publicField(_EventSourceFeature, "keyword", "eventsource");
var EventSourceFeature = _EventSourceFeature;
function makeHandler(encoding, commandList, stub, feature) {
  return function(evt) {
    var data = decode(evt["data"], encoding);
    var context = feature.runtime.makeContext(stub, feature, stub);
    context.event = evt;
    context.result = data;
    commandList.execute(context);
  };
}
function decode(data, encoding) {
  if (encoding == "json") {
    return JSON.parse(data);
  }
  return data;
}
function eventsourcePlugin(_hyperscript) {
  _hyperscript.addFeature(EventSourceFeature.keyword, EventSourceFeature.parse.bind(EventSourceFeature));
}
if (typeof self !== "undefined" && self._hyperscript) {
  self._hyperscript.use(eventsourcePlugin);
}
export {
  EventSourceFeature,
  eventsourcePlugin as default
};
//# sourceMappingURL=eventsource.esm.js.map
