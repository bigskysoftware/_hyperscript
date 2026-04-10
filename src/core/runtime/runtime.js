// Runtime - Execution engine for _hyperscript
import { config } from '../config.js';
import { conversions } from './conversions.js';
import { CookieJar } from './cookies.js';
import { ElementCollection, SHOULD_AUTO_ITERATE_SYM } from './collections.js';
import { Parser } from '../parser.js';

// cookie jar proxy for runtime
let cookies = new CookieJar().proxy();

export class Context {
    constructor(owner, feature, hyperscriptTarget, event, runtime, globalScope, kernel, tokenizer) {
        this.meta = {
            parser: kernel,
            tokenizer: tokenizer,
            runtime,
            owner: owner,
            feature: feature,
            iterators: {},
            ctx: this
        }
        this.locals = {
            cookies: cookies
        };
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            Object.defineProperty(this.locals, 'clipboard', {
                get() { return navigator.clipboard.readText(); },
                set(v) { navigator.clipboard.writeText(String(v)); },
                enumerable: false,
                configurable: true
            });
        }
        if (typeof window !== "undefined" && window.getSelection) {
            Object.defineProperty(this.locals, 'selection', {
                get() { return window.getSelection().toString(); },
                enumerable: true,
                configurable: true
            });
        }
        this.me = hyperscriptTarget;
        this.you = undefined
        this.result = undefined
        this.beingTested = null
        this.event = event;
        this.target = event?.target ?? null;
        this.detail = event?.detail ?? null;
        this.sender = event?.detail?.sender ?? null;
        this.body = "document" in globalScope ? document.body : null;
        runtime.addFeatures(owner, this);
    }
}


export class Runtime {

        static HALT = {};
        HALT = Runtime.HALT;

        #kernel;
        #tokenizer;
        #globalScope;
        #reactivity;
        #morphEngine;
        #scriptAttrs = null;

        constructor(globalScope, kernel, tokenizer, reactivity, morphEngine) {
            this.#globalScope = globalScope;
            this.#kernel = kernel;
            this.#tokenizer = tokenizer;
            this.#reactivity = reactivity;
            this.#morphEngine = morphEngine;
        }

        get globalScope() {
            return this.#globalScope;
        }

        get reactivity() {
            return this.#reactivity;
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
                    throw new Error("Command " + (command.type || "unknown") + " did not return a next element to execute");
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

        unifiedEval(parseElement, ctx) {
            var async = false;
            var evaluatedArgs = {};

            if (parseElement.args) {
                for (var [name, argument] of Object.entries(parseElement.args)) {
                    if (argument == null) {
                        evaluatedArgs[name] = null;
                    } else if (Array.isArray(argument)) {
                        var arr = [];
                        for (var j = 0; j < argument.length; j++) {
                            var element = argument[j];
                            if (element == null) {
                                arr.push(null);
                            } else if (element.evaluate) {
                                var value = element.evaluate(ctx);
                                if (value && value.then) {
                                    async = true;
                                }
                                arr.push(value);
                            } else {
                                arr.push(element);
                            }
                        }
                        evaluatedArgs[name] = arr;
                    } else if (argument.evaluate) {
                        var value = argument.evaluate(ctx);
                        if (value && value.then) {
                            async = true;
                        }
                        evaluatedArgs[name] = value;
                    } else {
                        evaluatedArgs[name] = argument;
                    }
                }
            }
            if (async) {
                return new Promise((resolve, reject) => {
                    var keys = Object.keys(evaluatedArgs);
                    var values = Object.values(evaluatedArgs).map(v =>
                        Array.isArray(v) ? Promise.all(v) : v
                    );
                    Promise.all(values)
                        .then(function (resolved) {
                            try {
                                var finalArgs = {};
                                keys.forEach((k, i) => finalArgs[k] = resolved[i]);
                                resolve(parseElement.resolve(ctx, finalArgs));
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch(function (reason) {
                            reject(reason);
                        });
                });
            } else {
                return parseElement.resolve(ctx, evaluatedArgs);
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
            return new Context(owner, feature, hyperscriptTarget, event, this, this.#globalScope, this.#kernel, this.#tokenizer)
        }

        getHyperscriptFeatures(elt) {
            var data = this.getInternalData(elt);
            if (!data.features) {
                data.features = {};
            }
            return data.features;
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

        #isReservedWord(str) {
            return ["meta", "it", "result", "locals", "event", "target", "detail", "sender", "body"].includes(str)
        }

        #isHyperscriptContext(context) {
            return context instanceof Context;
        }

        resolveSymbol(str, context, type, targetElement) {
            if (str === "me" || str === "my" || str === "I") return context.me;
            if (str === "it" || str === "its") return context.beingTested ?? context.result;
            if (str === "result") return context.result;
            if (str === "you" || str === "your" || str === "yourself") return context.you;

            if (type === "global") {
                if (this.reactivity.isTracking) this.reactivity.trackGlobalSymbol(str);
                var val = this.#globalScope[str];
                this.#trackMutation(val);
                return val;
            }
            if (type === "element") {
                if (this.reactivity.isTracking) this.reactivity.trackElementSymbol(str, context.meta.owner);
                var val = this.#getElementScope(context)[str];
                this.#trackMutation(val);
                return val;
            }
            if (type === "inherited") {
                var inherited = this.#resolveInherited(str, context, targetElement);
                if (this.reactivity.isTracking) {
                    var trackElement = inherited.element || targetElement || context.meta?.owner;
                    if (trackElement) {
                        this.reactivity.trackElementSymbol(str, trackElement);
                    }
                }
                this.#trackMutation(inherited.value);
                return inherited.value;
            }
            // local scope resolution: meta.context (set only inside `on click[...]`
            // filter expressions to the current event) → locals → element → global.
            // Event destructuring in handler bodies is explicit: `on click(x, y)`
            // copies event/detail props into ctx.locals at handler entry, so in body
            // code `x` is a real local, not a fallback lookup.
            if (context.meta?.context) {
                var fromMetaContext = context.meta.context[str];
                if (typeof fromMetaContext !== "undefined") return fromMetaContext;
                if (context.meta.context.detail) {
                    fromMetaContext = context.meta.context.detail[str];
                    if (typeof fromMetaContext !== "undefined") return fromMetaContext;
                }
            }
            var fromContext = this.#isHyperscriptContext(context) && !this.#isReservedWord(str)
                ? context.locals[str] : context[str];
            if (typeof fromContext !== "undefined") return fromContext;

            // element scope
            var elementScope = this.#getElementScope(context);
            fromContext = elementScope[str];
            if (typeof fromContext !== "undefined") {
                if (this.reactivity.isTracking) this.reactivity.trackElementSymbol(str, context.meta.owner);
                this.#trackMutation(fromContext);
                return fromContext;
            }
            // global scope (or not found — track as global so we catch the first write)
            if (this.reactivity.isTracking) this.reactivity.trackGlobalSymbol(str);
            var val = this.#globalScope[str];
            this.#trackMutation(val);
            return val;
        }

        setSymbol(str, context, type, value, targetElement) {
            if (type === "global") {
                this.#globalScope[str] = value;
                this.reactivity.notifyGlobalSymbol(str);
                return;
            }
            if (type === "element") {
                this.#getElementScope(context)[str] = value;
                this.reactivity.notifyElementSymbol(str, context.meta.owner);
                return;
            }
            if (type === "inherited") {
                var inherited = this.#resolveInherited(str, context, targetElement);
                if (inherited.element) {
                    this.getInternalData(inherited.element).elementScope[str] = value;
                    this.reactivity.notifyElementSymbol(str, inherited.element);
                } else {
                    var owner = targetElement || context.meta?.owner;
                    if (owner) {
                        var internalData = this.getInternalData(owner);
                        if (!internalData.elementScope) internalData.elementScope = {};
                        internalData.elementScope[str] = value;
                        this.reactivity.notifyElementSymbol(str, owner);
                    }
                }
                return;
            }
            // local scope resolution (tries locals → element → global chain)
            if (this.#isHyperscriptContext(context) && !this.#isReservedWord(str) && typeof context.locals[str] !== "undefined") {
                context.locals[str] = value;
                return;
            }
            var elementScope = this.#getElementScope(context);
            if (typeof elementScope[str] !== "undefined") {
                elementScope[str] = value;
                this.reactivity.notifyElementSymbol(str, context.meta.owner);
            } else if (this.#isHyperscriptContext(context) && !this.#isReservedWord(str)) {
                context.locals[str] = value;
            } else {
                context[str] = value;
            }
        }

        getInternalData(elt) {
            if (!elt._hyperscript) {
                elt._hyperscript = {};
            }
            return elt._hyperscript;
        }

        #resolveInherited(str, context, startElement) {
            var elt = startElement || (context.meta && context.meta.owner);
            while (elt) {
                var internalData = elt._hyperscript;
                if (internalData && internalData.elementScope && str in internalData.elementScope) {
                    return { value: internalData.elementScope[str], element: elt };
                }
                // Check dom-scope attribute for scope control
                var domScope = elt.getAttribute && elt.getAttribute('dom-scope');
                if (domScope) {
                    if (domScope === 'isolated') {
                        return { value: undefined, element: null };
                    }
                    // "closest <selector>" — jump to matching ancestor
                    var match = domScope.match(/^closest\s+(.+)/);
                    if (match) {
                        elt = elt.parentElement && elt.parentElement.closest(match[1]);
                        continue;
                    }
                    // "parent of <selector>" — jump to the parent of the nearest matching ancestor
                    match = domScope.match(/^parent\s+of\s+(.+)/);
                    if (match) {
                        var target = elt.closest(match[1]);
                        elt = target && target.parentElement;
                        continue;
                    }
                }
                elt = elt.parentElement;
            }
            return { value: undefined, element: null };
        }

        #getElementScope(context) {
            var elt = context.meta && context.meta.owner;
            if (elt) {
                var internalData = this.getInternalData(elt);
                var scopeName = "elementScope";
                if (context.meta.feature && context.meta.feature.behavior) {
                    scopeName = context.meta.feature.behavior + "Scope";
                }
                var elementScope = internalData[scopeName];
                if (!elementScope) {
                    elementScope = {};
                    internalData[scopeName] = elementScope;
                }
                return elementScope;
            } else {
                return {};
            }
        }

        #flatGet(root, property, getter) {
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
            if (this.reactivity.isTracking) this.reactivity.trackProperty(root, property);
            return this.#flatGet(root, property, (root, property) => root[property])
        }

        /**
         * Set a property on an object and notify the reactivity system.
         * @param {Object} obj - DOM element or plain JS object
         * @param {string} property
         * @param {any} value
         */
        setProperty(obj, property, value) {
            obj[property] = value;
            this.reactivity.notifyProperty(obj);
        }

        /**
         * Notify the reactivity system that an object was mutated in-place.
         * Call this after operations like push, splice, append, etc.
         * @param {Object} obj - The mutated object
         */
        notifyMutation(obj) {
            this.reactivity.notifyProperty(obj);
        }

        morph(elt, content) {
            this.#morphEngine.morph(elt, content, {
                beforeNodeRemoved: (node) => {
                    if (node.nodeType === 1) this.cleanup(node);
                },
                afterNodeAdded: (node) => {
                    if (node.nodeType === 1) this.processNode(node);
                },
                afterNodeMorphed: (node) => {
                    if (node.nodeType === 1) this.processNode(node);
                }
            });
        }

        replaceInDom(target, value) {
            this.implicitLoop(target, (elt) => {
                var parent = elt.parentElement;
                if (value instanceof Node) {
                    elt.replaceWith(value.cloneNode(true));
                } else {
                    elt.replaceWith(this.convertValue(value, "Fragment"));
                }
                if (parent) this.processNode(parent);
            });
        }

        /**
         * Check if a method call is known to mutate its receiver, and notify if so.
         * @param {Object} target - The object the method was called on
         * @param {string} methodName - The method name
         */
        maybeNotify(target, methodName) {
            if (target == null || typeof target !== "object") return;
            var typeName = target.constructor && target.constructor.name;
            var methods = typeName && config.mutatingMethods[typeName];
            if (methods && methods.includes(methodName)) {
                this.notifyMutation(target);
            }
        }

        #trackMutation(val) {
            if (this.reactivity.isTracking && val != null && typeof val === "object") {
                this.reactivity.trackProperty(val, "__mutation__");
            }
        }

        resolveAttribute(root, property) {
            if (this.reactivity.isTracking) this.reactivity.trackAttribute(root, property);
            return this.#flatGet(root, property, (root, property) => root.getAttribute && root.getAttribute(property))
        }

        resolveStyle(root, property) {
            return this.#flatGet(root, property, (root, property) => root.style && root.style[property])
        }

        resolveComputedStyle(root, property) {
            return this.#flatGet(root, property, (root, property) => getComputedStyle(root).getPropertyValue(property))
        }

        assignToNamespace(elt, nameSpace, name, value) {
            let root
            if (elt == null || (typeof document !== "undefined" && elt === document.body)) {
                root = this.#globalScope;
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

        #isArrayLike(value) {
            return Array.isArray(value) ||
                (typeof NodeList !== 'undefined' && (value instanceof NodeList || value instanceof HTMLCollection || value instanceof FileList));
        }

        #isIterable(value) {
            return typeof value === 'object'
                && Symbol.iterator in value
                && typeof value[Symbol.iterator] === 'function';
        }

        shouldAutoIterate(value) {
            return (value != null && value[SHOULD_AUTO_ITERATE_SYM]) || this.#isArrayLike(value);
        }

        forEach(value, func) {
            if (value == null) {
                // do nothing
            } else if (this.#isIterable(value)) {
                for (const nth of value) {
                    func(nth);
                }
            } else if (this.#isArrayLike(value)) {
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

        /**
         * Iterate over targets with a when condition, applying forward or reverse per element.
         * Supports async conditions transparently -- returns a Promise if any condition is async.
         */
        implicitLoopWhen(targets, whenExpr, context, forwardFn, reverseFn) {
            var elements = [];
            this.implicitLoop(targets, function (elt) { elements.push(elt); });

            var conditions = elements.map(function (elt) {
                context.beingTested = elt;
                return whenExpr.evaluate(context);
            });
            context.beingTested = null;

            var hasPromise = conditions.some(function (c) { return c && typeof c.then === "function"; });
            if (hasPromise) {
                return Promise.all(conditions).then((results) => {
                    context.result = this.#applyWhenResults(elements, results, forwardFn, reverseFn);
                });
            } else {
                context.result = this.#applyWhenResults(elements, conditions, forwardFn, reverseFn);
            }
        }

        #applyWhenResults(elements, results, forwardFn, reverseFn) {
            var matched = [];
            for (var i = 0; i < elements.length; i++) {
                if (results[i]) { forwardFn(elements[i]); matched.push(elements[i]); }
                else reverseFn(elements[i]);
            }
            return matched;
        }

        // =================================================================
        // Type system
        // =================================================================

        convertValue(value, type) {
            var dynamicResolvers = conversions.dynamicResolvers;
            for (var i = 0; i < dynamicResolvers.length; i++) {
                var dynamicResolver = dynamicResolvers[i];
                var converted = dynamicResolver(type, value, this);
                if (converted !== undefined) {
                    return converted;
                }
            }
            if (value == null) {
                return null;
            }
            var converter = conversions[type];
            if (converter) {
                return converter(value, this);
            }
            throw new Error("Unknown conversion : " + type);
        }

        evaluateNoPromise(elt, ctx) {
            let result = elt.evaluate(ctx);
            if (result && typeof result.then === "function") {
                throw new Error(elt.sourceFor() + " returned a Promise in a context that they are not allowed.");
            }
            return result;
        }

        typeCheck(value, typeString, nullOk) {
            if (value == null && nullOk) {
                return true;
            }
            var typeName = Object.prototype.toString.call(value).slice(8, -1);
            if (typeName === typeString) return true;
            // instanceof fallback for base classes
            var ctor = typeof globalThis !== "undefined" && globalThis[typeString];
            return typeof ctor === "function" && value instanceof ctor;
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
            return elt.matches && elt.matches(selector);
        }

        makeEvent(eventName, detail) {
            var evt = new Event(eventName, { bubbles: true, cancelable: true, composed: true });
            evt['detail'] = detail;
            return evt;
        }

        triggerEvent(elt, eventName, detail, sender) {
            detail = detail || {};
            detail["sender"] = sender;
            var event = this.makeEvent(eventName, detail);
            if (config.logAll) {
                console.log(eventName, detail, elt);
            }
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

        #getScriptAttributes() {
            if (this.#scriptAttrs == null) {
                this.#scriptAttrs = config.attributes.replaceAll(" ", "").split(",");
            }
            return this.#scriptAttrs;
        }

        #getScript(elt) {
            var attrs = this.#getScriptAttributes();
            for (var i = 0; i < attrs.length; i++) {
                var scriptAttribute = attrs[i];
                if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
                    return elt.getAttribute(scriptAttribute);
                }
            }
            if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
                return elt.innerText;
            }
            return null;
        }

        #scriptSelector;
        #getScriptSelector() {
            if (!this.#scriptSelector) {
                this.#scriptSelector = this.#getScriptAttributes().map(a => "[" + a + "]").join(", ");
            }
            return this.#scriptSelector;
        }

        #hashScript(str) {
            var hash = 5381;
            for (var i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i);
            }
            return hash;
        }

        cleanup(elt) {
            if (!elt._hyperscript) return;

            this.triggerEvent(elt, "hyperscript:before:cleanup");

            var data = elt._hyperscript;

            // Remove registered event listeners
            if (data.listeners) {
                for (var info of data.listeners) {
                    info.target.removeEventListener(info.event, info.handler);
                }
            }

            // Disconnect observers
            if (data.observers) {
                for (var observer of data.observers) {
                    observer.disconnect();
                }
            }

            // Clear debounce/throttle timers
            if (data.eventState) {
                for (var state of data.eventState.values()) {
                    if (state.debounced) clearTimeout(state.debounced);
                }
            }

            // Stop reactive effects
            this.reactivity.stopElementEffects(elt);

            // Recursively clean children
            if (elt.querySelectorAll) {
                for (var child of elt.querySelectorAll('[data-hyperscript-powered]')) {
                    this.cleanup(child);
                }
            }

            this.triggerEvent(elt, "hyperscript:after:cleanup");

            elt.removeAttribute('data-hyperscript-powered');
            delete elt._hyperscript;
        }

        #initElement(elt, target) {
            if (elt.closest && elt.closest(config.disableSelector)) {
                return;
            }
            var internalData = this.getInternalData(elt);
            var src = this.#getScript(elt);
            if (!src) return;
            var hash = this.#hashScript(src);
            if (internalData.initialized) {
                if (internalData.scriptHash === hash) return;
                // Script changed (e.g. morph swap) — clean up and reinitialize
                this.cleanup(elt);
                internalData = this.getInternalData(elt);
            }

            if (!this.triggerEvent(elt, "hyperscript:before:init")) return;

            internalData.initialized = true;
            internalData.scriptHash = hash;
            try {
                var tokens = this.#tokenizer.tokenize(src);
                var hyperScript = this.#kernel.parseHyperScript(tokens);
                if (!hyperScript) return;

                if (hyperScript.errors?.length) {
                    this.triggerEvent(elt, "hyperscript:parse-error", {
                        errors: hyperScript.errors,
                    });
                    console.error(
                        "hyperscript: " + hyperScript.errors.length + " parse error(s) on:",
                        elt,
                        "\n\n" + Parser.formatErrors(hyperScript.errors)
                    );
                    return;
                }

                hyperScript.apply(target || elt, elt, null, this);
                elt.setAttribute('data-hyperscript-powered', 'true');
                this.triggerEvent(elt, "hyperscript:after:init");
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

        #beforeProcessHooks = [];
        #afterProcessHooks = [];

        addBeforeProcessHook(fn) { this.#beforeProcessHooks.push(fn); }
        addAfterProcessHook(fn) { this.#afterProcessHooks.push(fn); }

        processNode(elt) {
            for (var fn of this.#beforeProcessHooks) fn(elt);

            var selector = this.#getScriptSelector();
            if (this.matchesSelector(elt, selector)) {
                this.#initElement(elt, elt);
            }
            if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
                this.#initElement(elt, document.body);
            }
            if (elt.querySelectorAll) {
                this.forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), elt => {
                    this.#initElement(elt, elt instanceof HTMLScriptElement && elt.type === "text/hyperscript" ? document.body : elt);
                });
            }

            for (var fn of this.#afterProcessHooks) fn(elt);
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
                var typeName = !value ? "object (null)"
                    : value instanceof ElementCollection ? "ElementCollection"
                    : value.constructor?.name || "unknown";
                var logValue = typeName === "String" ? '"' + value + '"'
                    : value instanceof ElementCollection ? Array.from(value)
                    : value;
                console.log("///_ BEEP! The expression (" + expression.sourceFor().replace("beep! ", "") + ") evaluates to:", logValue, "of type " + typeName);
            }
        }

}
