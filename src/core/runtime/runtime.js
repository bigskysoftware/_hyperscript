// Runtime - Execution engine for _hyperscript
import { config, conversions } from '../config.js';
import { Tokens } from '../tokenizer.js';
import { CookieJar } from './cookies.js';
import { ElementCollection, shouldAutoIterateSymbol } from './collections.js';
import { initWebConversions } from './conversions.js';

// Re-export for consumers
export { ElementCollection, TemplatedQueryElementCollection, RegExpIterator, RegExpIterable,
         HyperscriptModule, shouldAutoIterateSymbol } from './collections.js';

export class Context {
    constructor(owner, feature, hyperscriptTarget, event, runtime, globalScope) {
        this.meta = {
            parser: runtime.parser,
            tokenizer: runtime.tokenizer,
            runtime,
            owner: owner,
            feature: feature,
            iterators: {},
            ctx: this
        }
        this.locals = {
            cookies: CookieJar
        };
        this.me = hyperscriptTarget;
        this.you = undefined
        this.result = undefined
        this.event = event;
        this.target = event ? event.target : null;
        this.detail = event ? event.detail : null;
        this.sender = event ? event.detail ? event.detail.sender : null : null;
        this.body = "document" in globalScope ? document.body : null;
        runtime.addFeatures(owner, this);
    }
}

export function getOrInitObject(root, prop) {
    var value = root[prop];
    if (value) {
        return value;
    } else {
        var newObj = {};
        root[prop] = newObj;
        return newObj;
    }
}

export function parseJSON(jString) {
    try {
        return JSON.parse(jString);
    } catch (error) {
        logError(error);
        return null;
    }
}

export function logError(msg) {
    if (console.error) {
        console.error(msg);
    } else if (console.log) {
        console.log("ERROR: ", msg);
    }
}

export function varargConstructor(Cls, args) {
    return new (Cls.bind.apply(Cls, [Cls].concat(args)))();
}

// ============================================================================
// Runtime class
// ============================================================================

export class Runtime {

        static HALT = {};
        HALT = Runtime.HALT;

        constructor(globalScope, kernel, tokenizer) {
            this.globalScope = globalScope;
            this.parser = kernel;
            this.tokenizer = tokenizer;
            initWebConversions(this);
        }

        // =================================================================
        // Core execution engine
        // =================================================================

        unifiedExec(command, ctx) {
            while (true) {
                try {
                    var next = this.unifiedEval(command, ctx);
                } catch (e) {
                    if (ctx.meta.handlingFinally) {
                        console.error(" Exception in finally block: ", e);
                        next = Runtime.HALT;
                    } else {
                        this.registerHyperTrace(ctx, e);
                        if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
                            ctx.meta.handlingError = true;
                            ctx.locals[ctx.meta.errorSymbol] = e;
                            command = ctx.meta.errorHandler;
                            continue;
                        } else  {
                            ctx.meta.currentException = e;
                            next = Runtime.HALT;
                        }
                    }
                }
                if (next == null) {
                    console.error(command, " did not return a next element to execute! context: ", ctx);
                    return;
                } else if (next.then) {
                    next.then(resolvedNext => {
                        this.unifiedExec(resolvedNext, ctx);
                    }).catch(reason => {
                        this.unifiedExec({
                            resolve: function(){
                                throw reason;
                            }
                        }, ctx);
                    });
                    return;
                } else if (next === Runtime.HALT) {
                    if (ctx.meta.finallyHandler && !ctx.meta.handlingFinally) {
                        ctx.meta.handlingFinally = true;
                        command = ctx.meta.finallyHandler;
                    } else {
                        if (ctx.meta.onHalt) {
                            ctx.meta.onHalt();
                        }
                        if (ctx.meta.currentException) {
                            if (ctx.meta.reject) {
                                ctx.meta.reject(ctx.meta.currentException);
                                return;
                            } else {
                                throw ctx.meta.currentException;
                            }
                        } else {
                            return;
                        }
                    }
                } else {
                    command = next;
                }
            }
        }

        unifiedEval(parseElement, ctx, shortCircuitOnValue) {
            var args = [ctx];
            var async = false;

            if (parseElement.args) {
                for (var i = 0; i < parseElement.args.length; i++) {
                    var argument = parseElement.args[i];
                    if (argument == null) {
                        args.push(null);
                    } else if (Array.isArray(argument)) {
                        var arr = [];
                        for (var j = 0; j < argument.length; j++) {
                            var element = argument[j];
                            var value = element ? element.evaluate(ctx) : null;
                            if (value && value.then) {
                                async = true;
                            }
                            arr.push(value);
                        }
                        args.push(arr);
                    } else if (argument.evaluate) {
                        var value = argument.evaluate(ctx);
                        if (value && value.then) {
                            async = true;
                        }
                        args.push(value);
                        if (value) {
                            if (shortCircuitOnValue === true) {
                                break;
                            }
                        } else {
                            if (shortCircuitOnValue === false) {
                                break;
                            }
                        }
                    } else {
                        args.push(argument);
                    }
                }
            }
            if (async) {
                return new Promise((resolve, reject) => {
                    args = this.wrapArrays(args);
                    Promise.all(args)
                        .then(function (values) {
                            try {
                                var apply = parseElement.resolve.apply(parseElement, values);
                                resolve(apply);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch(function (reason) {
                            reject(reason);
                        });
                });
            } else {
                return parseElement.resolve.apply(parseElement, args);
            }
        }

        findNext(command, context) {
            if (command) {
                if (command.resolveNext) {
                    return command.resolveNext(context);
                } else if (command.next) {
                    return command.next;
                } else {
                    return this.findNext(command.parent, context);
                }
            }
        }

        // =================================================================
        // Context and scope
        // =================================================================

        makeContext(owner, feature, hyperscriptTarget, event) {
            return new Context(owner, feature, hyperscriptTarget, event, this, this.globalScope)
        }

        hyperscriptFeaturesMap = new WeakMap

        getHyperscriptFeatures(elt) {
            var hyperscriptFeatures = this.hyperscriptFeaturesMap.get(elt);
            if (typeof hyperscriptFeatures === 'undefined') {
                if (elt) {
                    this.hyperscriptFeaturesMap.set(elt, hyperscriptFeatures = {});
                }
            }
            return hyperscriptFeatures;
        }

        addFeatures(owner, ctx) {
            if (owner) {
                Object.assign(ctx.locals, this.getHyperscriptFeatures(owner));
                this.addFeatures(owner.parentElement, ctx);
            }
        }

        // =================================================================
        // Symbol and property resolution
        // =================================================================

        isReservedWord(str) {
            return ["meta", "it", "result", "locals", "event", "target", "detail", "sender", "body"].includes(str)
        }

        isHyperscriptContext(context) {
            return context instanceof Context;
        }

        resolveSymbol(str, context, type) {
            if (str === "me" || str === "my" || str === "I") {
                return context.me;
            }
            if (str === "it" || str === "its" || str === "result") {
                return context.result;
            }
            if (str === "you" || str === "your" || str === "yourself") {
                return context.you;
            } else {
                if (type === "global") {
                    return this.globalScope[str];
                } else if (type === "element") {
                    var elementScope = this.getElementScope(context);
                    return elementScope[str];
                } else if (type === "local") {
                    return context.locals[str];
                } else {
                    if (context.meta && context.meta.context) {
                        var fromMetaContext = context.meta.context[str];
                        if (typeof fromMetaContext !== "undefined") {
                            return fromMetaContext;
                        }
                        if (context.meta.context.detail) {
                            fromMetaContext = context.meta.context.detail[str];
                            if (typeof fromMetaContext !== "undefined") {
                                return fromMetaContext;
                            }
                        }
                    }
                    if (this.isHyperscriptContext(context) && !this.isReservedWord(str)) {
                        var fromContext = context.locals[str];
                    } else {
                        var fromContext = context[str];
                    }
                    if (typeof fromContext !== "undefined") {
                        return fromContext;
                    } else {
                        var elementScope = this.getElementScope(context);
                        fromContext = elementScope[str];
                        if (typeof fromContext !== "undefined") {
                            return fromContext;
                        } else {
                            return this.globalScope[str];
                        }
                    }
                }
            }
        }

        setSymbol(str, context, type, value) {
            if (type === "global") {
                this.globalScope[str] = value;
            } else if (type === "element") {
                var elementScope = this.getElementScope(context);
                elementScope[str] = value;
            } else if (type === "local") {
                context.locals[str] = value;
            } else {
                if (this.isHyperscriptContext(context) && !this.isReservedWord(str) && typeof context.locals[str] !== "undefined") {
                    context.locals[str] = value;
                } else {
                    var elementScope = this.getElementScope(context);
                    var fromContext = elementScope[str];
                    if (typeof fromContext !== "undefined") {
                        elementScope[str] = value;
                    } else {
                        if (this.isHyperscriptContext(context) && !this.isReservedWord(str)) {
                            context.locals[str] = value;
                        } else {
                            context[str] = value;
                        }
                    }
                }
            }
        }

        internalDataMap = new WeakMap

        getInternalData(elt) {
            var internalData = this.internalDataMap.get(elt);
            if (typeof internalData === 'undefined') {
                this.internalDataMap.set(elt, internalData = {});
            }
            return internalData;
        }

        getElementScope(context) {
            var elt = context.meta && context.meta.owner;
            if (elt) {
                var internalData = this.getInternalData(elt);
                var scopeName = "elementScope";
                if (context.meta.feature && context.meta.feature.behavior) {
                    scopeName = context.meta.feature.behavior + "Scope";
                }
                var elementScope = getOrInitObject(internalData, scopeName);
                return elementScope;
            } else {
                return {};
            }
        }

        flatGet(root, property, getter) {
            if (root != null) {
                var val = getter(root, property);
                if (typeof val !== "undefined") {
                    return val;
                }
                if (this.shouldAutoIterate(root)) {
                    var result = [];
                    for (var component of root) {
                        var componentValue = getter(component, property);
                        result.push(componentValue);
                    }
                    return result;
                }
            }
        }

        resolveProperty(root, property) {
            return this.flatGet(root, property, (root, property) => root[property] )
        }

        resolveAttribute(root, property) {
            return this.flatGet(root, property, (root, property) => root.getAttribute && root.getAttribute(property) )
        }

        resolveStyle(root, property) {
            return this.flatGet(root, property, (root, property) => root.style && root.style[property] )
        }

        resolveComputedStyle(root, property) {
            return this.flatGet(root, property, (root, property) => getComputedStyle(
                /** @type {Element} */ (root)).getPropertyValue(property) )
        }

        assignToNamespace(elt, nameSpace, name, value) {
            let root
            if (typeof document !== "undefined" && elt === document.body) {
                root = this.globalScope;
            } else {
                root = this.getHyperscriptFeatures(elt);
            }
            var propertyName;
            while ((propertyName = nameSpace.shift()) !== undefined) {
                var newRoot = root[propertyName];
                if (newRoot == null) {
                    newRoot = {};
                    root[propertyName] = newRoot;
                }
                root = newRoot;
            }
            root[name] = value;
        }

        // =================================================================
        // Collection and iteration utilities
        // =================================================================

        isArrayLike(value) {
            return Array.isArray(value) ||
                (typeof NodeList !== 'undefined' && (value instanceof NodeList || value instanceof HTMLCollection || value instanceof FileList));
        }

        isIterable(value) {
            return typeof value === 'object'
                && Symbol.iterator in value
                && typeof value[Symbol.iterator] === 'function';
        }

        shouldAutoIterate(value) {
            return value != null && value[shouldAutoIterateSymbol] ||
                this.isArrayLike(value);
        }

        forEach(value, func) {
            if (value == null) {
                // do nothing
            } else if (this.isIterable(value)) {
                for (const nth of value) {
                    func(nth);
                }
            } else if (this.isArrayLike(value)) {
                for (var i = 0; i < value.length; i++) {
                    func(value[i]);
                }
            } else {
                func(value);
            }
        }

        implicitLoop(value, func) {
            if (this.shouldAutoIterate(value)) {
                for (const x of value) func(x);
            } else {
                func(value);
            }
        }

        wrapArrays(args) {
            var arr = [];
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (Array.isArray(arg)) {
                    arr.push(Promise.all(arg));
                } else {
                    arr.push(arg);
                }
            }
            return arr;
        }

        // =================================================================
        // Type system
        // =================================================================

        convertValue(value, type) {
            var dynamicResolvers = conversions.dynamicResolvers;
            for (var i = 0; i < dynamicResolvers.length; i++) {
                var dynamicResolver = dynamicResolvers[i];
                var converted = dynamicResolver(type, value);
                if (converted !== undefined) {
                    return converted;
                }
            }
            if (value == null) {
                return null;
            }
            var converter = conversions[type];
            if (converter) {
                return converter(value);
            }
            throw "Unknown conversion : " + type;
        }

        evaluateNoPromise(elt, ctx) {
            let result = elt.evaluate(ctx);
            if (result.next) {
                throw new Error(Tokens.sourceFor.call(elt) + " returned a Promise in a context that they are not allowed.");
            }
            return result;
        }

        typeCheck(value, typeString, nullOk) {
            if (value == null && nullOk) {
                return true;
            }
            var typeName = Object.prototype.toString.call(value).slice(8, -1);
            return typeName === typeString;
        }

        nullCheck(value, elt) {
            if (value == null) {
                throw new Error("'" + elt.sourceFor() + "' is null");
            }
        }

        isEmpty(value) {
            return value == undefined || value.length === 0;
        }

        doesExist(value) {
            if(value == null){
                return false;
            }
            if (this.shouldAutoIterate(value)) {
                for (const elt of value) {
                    return true;
                }
                return false;
            }
            return true;
        }

        // =================================================================
        // DOM operations
        // =================================================================

        matchesSelector(elt, selector) {
            var matchesFunction =
                elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector || elt.webkitMatchesSelector || elt.oMatchesSelector;
            return matchesFunction && matchesFunction.call(elt, selector);
        }

        makeEvent(eventName, detail) {
            var evt;
            if (this.globalScope.Event && typeof this.globalScope.Event === "function") {
                evt = new Event(eventName, {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                });
                evt['detail'] = detail;
            } else {
                evt = document.createEvent("CustomEvent");
                evt.initCustomEvent(eventName, true, true, detail);
            }
            return evt;
        }

        triggerEvent(elt, eventName, detail, sender) {
            detail = detail || {};
            detail["sender"] = sender;
            var event = this.makeEvent(eventName, detail);
            var eventResult = elt.dispatchEvent(event);
            return eventResult;
        }

        getRootNode(node) {
            if (node && node instanceof Node) {
                var rv = node.getRootNode();
                if (rv instanceof Document || rv instanceof ShadowRoot) return rv;
            }
            return document;
        }

        escapeSelector(str) {
            return str.replace(/[:&()\[\]\/]/g, function (str) {
                return "\\" + str;
            });
        }

        getEventQueueFor(elt, onFeature) {
            let internalData = this.getInternalData(elt);
            var eventQueuesForElt = internalData.eventQueues;
            if (eventQueuesForElt == null) {
                eventQueuesForElt = new Map();
                internalData.eventQueues = eventQueuesForElt;
            }
            var eventQueueForFeature = eventQueuesForElt.get(onFeature);
            if (eventQueueForFeature == null) {
                eventQueueForFeature = {queue:[], executing:false};
                eventQueuesForElt.set(onFeature, eventQueueForFeature);
            }
            return eventQueueForFeature;
        }

        // =================================================================
        // DOM initialization
        // =================================================================

        _scriptAttrs = null;

        getScriptAttributes() {
            if (this._scriptAttrs == null) {
                this._scriptAttrs = config.attributes.replace(/ /g, "").split(",");
            }
            return this._scriptAttrs;
        }

        getScript(elt) {
            for (var i = 0; i < this.getScriptAttributes().length; i++) {
                var scriptAttribute = this.getScriptAttributes()[i];
                if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
                    return elt.getAttribute(scriptAttribute);
                }
            }
            if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
                return elt.innerText;
            }
            return null;
        }

        getScriptSelector() {
            return this.getScriptAttributes()
                .map(function (attribute) {
                    return "[" + attribute + "]";
                })
                .join(", ");
        }

        initElement(elt, target) {
            if (elt.closest && elt.closest(config.disableSelector)) {
                return;
            }
            var internalData = this.getInternalData(elt);
            if (!internalData.initialized) {
                var src = this.getScript(elt);
                if (src) {
                    try {
                        internalData.initialized = true;
                        internalData.script = src;
                        var tokens = this.tokenizer.tokenize(src);
                        var hyperScript = this.parser.parseHyperScript(tokens);
                        if (!hyperScript) return;
                        hyperScript.apply(target || elt, elt, null, this);
                        setTimeout(() => {
                            this.triggerEvent(target || elt, "load", {
                                hyperscript: true,
                            });
                        }, 1);
                    } catch (e) {
                        this.triggerEvent(elt, "exception", {
                            error: e,
                        });
                        console.error(
                            "hyperscript errors were found on the following element:",
                            elt,
                            "\n\n",
                            e.message,
                            e.stack
                        );
                    }
                }
            }
        }

        processNode(elt) {
            var selector = this.getScriptSelector();
            if (this.matchesSelector(elt, selector)) {
                this.initElement(elt, elt);
            }
            if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
                this.initElement(elt, document.body);
            }
            if (elt.querySelectorAll) {
                this.forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), elt => {
                    this.initElement(elt, elt instanceof HTMLScriptElement && elt.type === "text/hyperscript" ? document.body : elt);
                });
            }
        }

        // =================================================================
        // Debug and tracing
        // =================================================================

        getHyperTrace(ctx, thrown) {
            var trace = [];
            var root = ctx;
            while (root.meta.caller) {
                root = root.meta.caller;
            }
            if (root.meta.traceMap) {
                return root.meta.traceMap.get(thrown, trace);
            }
        }

        registerHyperTrace(ctx, thrown) {
            var trace = [];
            var root = null;
            while (ctx != null) {
                trace.push(ctx);
                root = ctx;
                ctx = ctx.meta.caller;
            }
            if (root.meta.traceMap == null) {
                root.meta.traceMap = new Map();
            }
            if (!root.meta.traceMap.get(thrown)) {
                var traceEntry = {
                    trace: trace,
                    print: function (logger) {
                        logger = logger || console.error;
                        logger("hypertrace /// ");
                        var maxLen = 0;
                        for (var i = 0; i < trace.length; i++) {
                            maxLen = Math.max(maxLen, trace[i].meta.feature.displayName.length);
                        }
                        for (var i = 0; i < trace.length; i++) {
                            var traceElt = trace[i];
                            logger(
                                "  ->",
                                traceElt.meta.feature.displayName.padEnd(maxLen + 2),
                                "-",
                                traceElt.meta.owner
                            );
                        }
                    },
                };
                root.meta.traceMap.set(thrown, traceEntry);
            }
        }

        beepValueToConsole(element, expression, value) {
            if (this.triggerEvent(element, "hyperscript:beep", {element, expression, value})) {
                var typeName;
                if (value) {
                    if (value instanceof ElementCollection) {
                        typeName = "ElementCollection";
                    } else if (value.constructor) {
                        typeName = value.constructor.name;
                    } else {
                        typeName = "unknown";
                    }
                } else {
                    typeName = "object (null)"
                }
                var logValue = value;
                if (typeName === "String") {
                    logValue = '"' + logValue + '"';
                } else if (value instanceof ElementCollection) {
                    logValue = Array.from(value);
                }
                console.log("///_ BEEP! The expression (" + Tokens.sourceFor.call(expression).replace("beep! ", "") + ") evaluates to:", logValue, "of type " + typeName);
            }
        }
}
