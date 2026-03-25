var __defProp = Object.defineProperty;
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
};

// src/ext/worker.js
var invocationIdCounter = 0;
var workerFunc = function(self2) {
  self2.onmessage = function(e) {
    switch (e.data.type) {
      case "init":
        self2.importScripts(e.data._hyperscript);
        self2.importScripts.apply(self2, e.data.extraScripts);
        const _hyperscript = self2["_hyperscript"];
        var hyperscript = _hyperscript.parse(e.data.src);
        hyperscript.apply(self2, self2);
        postMessage({ type: "didInit" });
        break;
      case "call":
        try {
          var result = self2["_hyperscript"].internals.runtime.getHyperscriptFeatures(self2)[e.data.function].apply(self2, e.data.args);
          Promise.resolve(result).then(function(value) {
            postMessage({
              type: "resolve",
              id: e.data.id,
              value
            });
          }).catch(function(error) {
            postMessage({
              type: "reject",
              id: e.data.id,
              error: error.toString()
            });
          });
        } catch (error) {
          postMessage({
            type: "reject",
            id: e.data.id,
            error: error.toString()
          });
        }
        break;
    }
  };
};
var workerCode = "(" + workerFunc.toString() + ")(self)";
var blob = new Blob([workerCode], { type: "text/javascript" });
var workerUri = URL.createObjectURL(blob);
var _WorkerFeature = class _WorkerFeature extends Feature {
  constructor(workerName, nameSpace, worker, stubs) {
    super();
    this.workerName = workerName;
    this.name = workerName;
    this.nameSpace = nameSpace;
    this.worker = worker;
    this.stubs = stubs;
  }
  static parse(parser) {
    var _a;
    if (parser.matchToken("worker")) {
      var name = parser.requireElement("dotOrColonPath");
      var qualifiedName = name.evaluate();
      var nameSpace = qualifiedName.split(".");
      var workerName = nameSpace.pop();
      var extraScripts = [];
      if (parser.matchOpToken("(")) {
        if (parser.matchOpToken(")")) {
        } else {
          do {
            var extraScript = parser.requireTokenType("STRING").value;
            var absoluteUrl = new URL(extraScript, location.href).href;
            extraScripts.push(absoluteUrl);
          } while (parser.matchOpToken(","));
          parser.requireOpToken(")");
        }
      }
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
      } while (parser.matchToken("end") && parser.hasMore());
      var bodyTokens = parser.consumed.slice(bodyStartIndex, bodyEndIndex + 1);
      var bodySrc = parser.source.substring(bodyTokens[0].start, bodyTokens[bodyTokens.length - 1].end);
      var worker = new Worker(workerUri);
      worker.postMessage({
        type: "init",
        _hyperscript: ((_a = document.currentScript) == null ? void 0 : _a.src) || "/dist/_hyperscript.js",
        extraScripts,
        src: bodySrc
      });
      var workerPromise = new Promise(function(resolve, reject) {
        worker.addEventListener(
          "message",
          function(e) {
            if (e.data.type === "didInit") resolve();
          },
          { once: true }
        );
      });
      var stubs = {};
      funcNames.forEach(function(funcName) {
        stubs[funcName] = function() {
          var args = arguments;
          return new Promise(function(resolve, reject) {
            var id = invocationIdCounter++;
            worker.addEventListener("message", function returnListener(e) {
              if (e.data.id !== id) return;
              worker.removeEventListener("message", returnListener);
              if (e.data.type === "resolve") resolve(e.data.value);
              else reject(e.data.error);
            });
            workerPromise.then(function() {
              worker.postMessage({
                type: "call",
                function: funcName,
                args: Array.from(args),
                id
              });
            });
          });
        };
      });
      return new _WorkerFeature(workerName, nameSpace, worker, stubs);
    }
  }
  install(target, source, args, runtime) {
    runtime.assignToNamespace(target, this.nameSpace, this.workerName, this.stubs);
  }
};
__publicField(_WorkerFeature, "keyword", "worker");
var WorkerFeature = _WorkerFeature;
function workerPlugin(_hyperscript) {
  _hyperscript.addFeature(WorkerFeature.keyword, WorkerFeature.parse.bind(WorkerFeature));
}
if (typeof self !== "undefined" && self._hyperscript) {
  self._hyperscript.use(workerPlugin);
}
export {
  workerPlugin as default
};
//# sourceMappingURL=worker.esm.js.map
