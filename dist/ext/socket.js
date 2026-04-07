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

  // src/ext/socket.js
  function genUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  function parseUrl(url) {
    var finalUrl = url;
    if (finalUrl.startsWith("/")) {
      var basePart = window.location.hostname + (window.location.port ? ":" + window.location.port : "");
      if (window.location.protocol === "https:") {
        finalUrl = "wss://" + basePart + finalUrl;
      } else if (window.location.protocol === "http:") {
        finalUrl = "ws://" + basePart + finalUrl;
      }
    }
    return finalUrl;
  }
  var PROXY_BLACKLIST = ["then", "catch", "length", "toJSON"];
  var SocketFeature = class _SocketFeature extends Feature {
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
      var defaultTimeout = 1e4;
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
            get: function(obj, property) {
              if (PROXY_BLACKLIST.includes(property)) {
                return null;
              } else if (property === "noTimeout") {
                return getProxy(-1);
              } else if (property === "timeout") {
                return function(i) {
                  return getProxy(parseInt(i));
                };
              } else {
                return function() {
                  var uuid = genUUID();
                  var args = [];
                  for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i]);
                  }
                  var rpcInfo = {
                    iid: uuid,
                    function: property,
                    args
                  };
                  socket = socket ? socket : new WebSocket(parseUrl(url.evalStatically()));
                  socket.send(JSON.stringify(rpcInfo));
                  var promise = new Promise(function(resolve, reject) {
                    promises[uuid] = {
                      resolve,
                      reject
                    };
                  });
                  if (timeout >= 0) {
                    setTimeout(function() {
                      if (promises[uuid]) {
                        promises[uuid].reject("Timed out");
                      }
                      delete promises[uuid];
                    }, timeout);
                  }
                  return promise;
                };
              }
            }
          }
        );
      }
      var rpcProxy = getProxy(defaultTimeout);
      var socketObject = {
        raw: socket,
        dispatchEvent: function(evt) {
          var details = evt.detail;
          delete details.sender;
          delete details._namedArgList_;
          socket.send(JSON.stringify(Object.assign({ type: evt.type }, details)));
        },
        rpc: rpcProxy
      };
      var feature = new _SocketFeature(socketName, nameSpace, socketObject, messageHandler);
      socket.onmessage = function(evt) {
        var data = evt.data;
        try {
          var dataAsJson = JSON.parse(data);
        } catch (e) {
        }
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
      socket.addEventListener("close", function(e) {
        socket = null;
      });
      if (messageHandler) {
        parser.setParent(messageHandler, feature);
      }
      return feature;
    }
  };
  function socketPlugin(_hyperscript) {
    _hyperscript.addFeature(SocketFeature.keyword, SocketFeature.parse.bind(SocketFeature));
  }
  if (typeof self !== "undefined" && self._hyperscript) {
    self._hyperscript.use(socketPlugin);
  }
})();
//# sourceMappingURL=socket.js.map
