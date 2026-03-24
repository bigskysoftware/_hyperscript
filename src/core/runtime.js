// Runtime - Execution engine for _hyperscript
import { config, conversions } from './config.js';
import { Tokens } from './tokenizer.js';
import { Reactivity } from './reactivity.js';

// ============================================================================
// Utility classes and symbols (from util.js)
// ============================================================================

/**
 * @type {symbol}
 */
export const shouldAutoIterateSymbol = Symbol()

export class ElementCollection {
    constructor(css, relativeToElement, escape, runtime) {
        this._css = css;
        this.relativeToElement = relativeToElement;
        this.escape = escape;
        this._runtime = runtime;
        this[shouldAutoIterateSymbol] = true;
    }

    get css() {
        if (this.escape) {
            return this._runtime.escapeSelector(this._css);
        } else {
            return this._css;
        }
    }

    get className() {
        return this._css.substr(1);
    }

    get id() {
        return this.className();
    }

    contains(elt) {
        for (let element of this) {
            if (element.contains(elt)) {
                return true;
            }
        }
        return false;
    }

    get length() {
        return this.selectMatches().length;
    }

    [Symbol.iterator]() {
        let query = this.selectMatches();
        return query [Symbol.iterator]();
    }

    selectMatches() {
        let query = this._runtime.getRootNode(this.relativeToElement).querySelectorAll(this.css);
        return query;
    }
}

export class TemplatedQueryElementCollection extends ElementCollection {
    constructor(css, relativeToElement, templateParts, runtime) {
        super(css, relativeToElement, false, runtime);
        this.templateParts = templateParts;
        this.elements = templateParts.filter(elt => elt instanceof Element);
    }

    get css() {
        let rv = "", i = 0
        for (const val of this.templateParts) {
            if (val instanceof Element) {
                rv += "[data-hs-query-id='" + i++ + "']";
            } else rv += val;
        }
        return rv;
    }

    [Symbol.iterator]() {
        this.elements.forEach((el, i) => el.dataset.hsQueryId = i);
        const rv = super[Symbol.iterator]();
        this.elements.forEach(el => el.removeAttribute('data-hs-query-id'));
        return rv;
    }
}

export class RegExpIterator {
  constructor(re, str) {
    this.re = re;
    this.str = str;
  }

  next() {
    const match = this.re.exec(this.str);
    if (match === null) return { done: true };
    else return { value: match };
  }
}

export class RegExpIterable {
  constructor(re, flags, str) {
    this.re = re;
    this.flags = flags;
    this.str = str;
  }

  [Symbol.iterator]() {
    return new RegExpIterator(new RegExp(this.re, this.flags), this.str);
  }
}

export class HyperscriptModule extends EventTarget {
    constructor(mod) {
        super();
        this.module = mod;
    }

    toString() {
        return this.module.id;
    }
}

// ============================================================================
// Cookie functionality
// ============================================================================

/**
 * Get all cookies as an array of {name, value} objects
 * @returns {Array<{name: string, value: string}>}
 */
function getCookiesAsArray() {
    let cookiesAsArray = document.cookie
        .split("; ")
        .map(cookieEntry => {
            let strings = cookieEntry.split("=");
            return {name: strings[0], value: decodeURIComponent(strings[1])}
        });
    return cookiesAsArray;
}

/**
 * Clear a specific cookie by name
 * @param {string} name
 */
function clearCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

/**
 * Clear all cookies
 */
function clearAllCookies() {
    for (const cookie of getCookiesAsArray()) {
        clearCookie(cookie.name);
    }
}

/**
 * CookieJar proxy for accessing and managing cookies
 */
export const CookieJar = new Proxy({}, {
    get(target, prop) {
        if (prop === 'then' || prop === 'asyncWrapper') { // ignore special symbols
            return null;
        } else if (prop === 'length') {
            return getCookiesAsArray().length
        } else if (prop === 'clear') {
            return clearCookie;
        } else if (prop === 'clearAll') {
            return clearAllCookies;
        } else if (typeof prop === "string") {
            // @ts-ignore string works fine with isNaN
            if (!isNaN(prop)) {
                return getCookiesAsArray()[parseInt(prop)];

            } else {
                let value = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith(prop + "="))
                    ?.split("=")[1];
                if(value) {
                    return decodeURIComponent(value);
                }
            }
        } else if (prop === Symbol.iterator) {
            return getCookiesAsArray()[prop];
        }
    },
    set(target, prop, value) {
        var finalValue = null;
        if ('string' === typeof value) {
            finalValue = encodeURIComponent(value)
            finalValue += ";samesite=lax"
        } else {
            finalValue = encodeURIComponent(value.value);
            if (value.expires) {
                finalValue+=";expires=" + value.maxAge;
            }
            if (value.maxAge) {
                finalValue+=";max-age=" + value.maxAge;
            }
            if (value.partitioned) {
                finalValue+=";partitioned=" + value.partitioned;
            }
            if (value.path) {
                finalValue+=";path=" + value.path;
            }
            if (value.samesite) {
                finalValue+=";samesite=" + value.path;
            }
            if (value.secure) {
                finalValue+=";secure=" + value.path;
            }
        }
        document.cookie= String(prop) + "=" + finalValue;
        return true;
    }
})

// ============================================================================
// Helper functions and classes (from helpers.js)
// ============================================================================

export class Context {
    /**
    * @param {*} owner
    * @param {*} feature
    * @param {*} hyperscriptTarget
    * @param {*} event
    */
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
            cookies:CookieJar
        };
        this.me = hyperscriptTarget,
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

/**
 * parseJSON parses a JSON string into a corresponding value.  If the
 * value passed in is not valid JSON, then it logs an error and returns `null`.
 *
 * @param {string} jString
 * @returns any
 */
export function parseJSON(jString) {
    try {
        return JSON.parse(jString);
    } catch (error) {
        logError(error);
        return null;
    }
}

/**
 * logError writes an error message to the Javascript console.  It can take any
 * value, but msg should commonly be a simple string.
 * @param {*} msg
 */
export function logError(msg) {
    if (console.error) {
        console.error(msg);
    } else if (console.log) {
        console.log("ERROR: ", msg);
    }
}

// TODO: JSDoc description of what's happening here
export function varargConstructor(Cls, args) {
    return new (Cls.bind.apply(Cls, [Cls].concat(args)))();
}

// ============================================================================
// Runtime class
// ============================================================================

/** Hoisted getter for resolveProperty - avoids allocating a closure per call */
const PROP_GETTER = (root, property) => root[property];

/** Hoisted getter for resolveAttribute - avoids allocating a closure per call */
const ATTR_GETTER = (root, property) => root.getAttribute && root.getAttribute(property);

export class Runtime {
        /**
         *
         * @param {Object} globalScope
         * @param {Object} kernel - The language kernel for parsing
         * @param {Object} tokenizer - The tokenizer for tokenizing hyperscript
         */
        constructor(globalScope, kernel, tokenizer) {
            this.globalScope = globalScope;
            this.parser = kernel;
            this.tokenizer = tokenizer;

            // Initialize web-specific conversions
            this.initWebConversions();

            /** @type {Reactivity} Reactive effect system */
            this.reactivity = new Reactivity(this);
        }

        /**
         * @param {HTMLElement} elt
         * @param {string} selector
         * @returns boolean
         */
        matchesSelector(elt, selector) {
            // noinspection JSUnresolvedVariable
            var matchesFunction =
                // @ts-ignore
                elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector || elt.webkitMatchesSelector || elt.oMatchesSelector;
            return matchesFunction && matchesFunction.call(elt, selector);
        }

        /**
         * @param {string} eventName
         * @param {Object} [detail]
         * @returns {Event}
         */
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

        /**
         * @param {Element} elt
         * @param {string} eventName
         * @param {Object} [detail]
         * @param {Element} [sender]
         * @returns {boolean}
         */
        triggerEvent(elt, eventName, detail, sender) {
            detail = detail || {};
            detail["sender"] = sender;
            var event = this.makeEvent(eventName, detail);
            var eventResult = elt.dispatchEvent(event);
            return eventResult;
        }

        /**
         * isArrayLike returns `true` if the provided value is an array or
         * something close enough to being an array for our purposes.
         *
         * @param {any} value
         * @returns {value is Array | NodeList | HTMLCollection | FileList}
         */
        isArrayLike(value) {
            return Array.isArray(value) ||
                (typeof NodeList !== 'undefined' && (value instanceof NodeList || value instanceof HTMLCollection || value instanceof FileList));
        }

        /**
         * isIterable returns `true` if the provided value supports the
         * iterator protocol.
         *
         * @param {any} value
         * @returns {value is Iterable}
         */
        isIterable(value) {
            return typeof value === 'object'
                && Symbol.iterator in value
                && typeof value[Symbol.iterator] === 'function';
        }

        /**
         * shouldAutoIterate returns `true` if the provided value
         * should be implicitly iterated over when accessing properties,
         * and as the target of some commands.
         *
         * Currently, this is when the value is an {ElementCollection}
         * or {isArrayLike} returns true.
         *
         * @param {any} value
         * @returns {value is (any[] | ElementCollection)}
         */
        shouldAutoIterate(value) {
            return value != null && value[shouldAutoIterateSymbol] ||
                this.isArrayLike(value);
        }

        /**
         * forEach executes the provided `func` on every item in the `value` array.
         * if `value` is a single item (and not an array) then `func` is simply called
         * once.  If `value` is null, then no further actions are taken.
         *
         * @template T
         * @param {T | Iterable<T>} value
         * @param {(item: T) => void} func
         */
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

        /**
         * implicitLoop executes the provided `func` on:
         * - every item of {value}, if {value} should be auto-iterated
         *   (see {shouldAutoIterate})
         * - {value} otherwise
         *
         * @template T
         * @param {ElementCollection | T | T[]} value
         * @param {(item: T) => void} func
         */
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

        unwrapAsyncs(values) {
            for (var i = 0; i < values.length; i++) {
                var value = values[i];
                if (value.asyncWrapper) {
                    values[i] = value.value;
                }
                if (Array.isArray(value)) {
                    for (var j = 0; j < value.length; j++) {
                        var valueElement = value[j];
                        if (valueElement.asyncWrapper) {
                            value[j] = valueElement.value;
                        }
                    }
                }
            }
        }

        static HALT = {};
        HALT = Runtime.HALT;

        /**
         * @param {ASTNode} command
         * @param {Context} ctx
         */
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
                        this.unifiedExec({ // Anonymous command to simply throw the exception
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
                    command = next; // move to the next command
                }
            }
        }

        /**
        * @param {*} parseElement
        * @param {Context} ctx
        * @param {Boolean} [shortCircuitOnValue]
        * @returns {*}
        */
        unifiedEval(parseElement, ctx, shortCircuitOnValue) {
            /** @type any[] */
            var args = [ctx];
            var async = false;
            var wrappedAsyncs = false;

            if (parseElement.args) {
                for (var i = 0; i < parseElement.args.length; i++) {
                    var argument = parseElement.args[i];
                    if (argument == null) {
                        args.push(null);
                    } else if (Array.isArray(argument)) {
                        var arr = [];
                        for (var j = 0; j < argument.length; j++) {
                            var element = argument[j];
                            var value = element ? element.evaluate(ctx) : null; // OK
                            if (value) {
                                if (value.then) {
                                    async = true;
                                } else if (value.asyncWrapper) {
                                    wrappedAsyncs = true;
                                }
                            }
                            arr.push(value);
                        }
                        args.push(arr);
                    } else if (argument.evaluate) {
                        var value = argument.evaluate(ctx); // OK
                        if (value) {
                            if (value.then) {
                                async = true;
                            } else if (value.asyncWrapper) {
                                wrappedAsyncs = true;
                            }
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
                            if (wrappedAsyncs) {
                                this.unwrapAsyncs(values);
                            }
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
                if (wrappedAsyncs) {
                    this.unwrapAsyncs(args);
                }
                return parseElement.resolve.apply(parseElement, args);
            }
        }

        /**
         * @type {string[] | null}
         */
        _scriptAttrs = null;

        /**
        * getAttributes returns the attribute name(s) to use when
        * locating hyperscript scripts in a DOM element.  If no value
        * has been configured, it defaults to config.attributes
        * @returns string[]
        */
        getScriptAttributes() {
            if (this._scriptAttrs == null) {
                this._scriptAttrs = config.attributes.replace(/ /g, "").split(",");
            }
            return this._scriptAttrs;
        }

        /**
        * @param {Element} elt
        * @returns {string | null}
        */
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

        hyperscriptFeaturesMap = new WeakMap

        /**
        * @param {*} elt
        * @returns {Object}
        */
        getHyperscriptFeatures(elt) {
            var hyperscriptFeatures = this.hyperscriptFeaturesMap.get(elt);
            if (typeof hyperscriptFeatures === 'undefined') {
                if (elt) {
                    // in some rare cases, elt is null and this line crashes
                    this.hyperscriptFeaturesMap.set(elt, hyperscriptFeatures = {});
                }
            }
            return hyperscriptFeatures;
        }

        /**
        * @param {Object} owner
        * @param {Context} ctx
        */
        addFeatures(owner, ctx) {
            if (owner) {
                Object.assign(ctx.locals, this.getHyperscriptFeatures(owner));
                this.addFeatures(owner.parentElement, ctx);
            }
        }

        /**
        * @param {*} owner
        * @param {*} feature
        * @param {*} hyperscriptTarget
        * @param {*} event
        * @returns {Context}
        */
        makeContext(owner, feature, hyperscriptTarget, event) {
            return new Context(owner, feature, hyperscriptTarget, event, this, this.globalScope)
        }

        /**
        * @returns string
        */
        getScriptSelector() {
            return this.getScriptAttributes()
                .map(function (attribute) {
                    return "[" + attribute + "]";
                })
                .join(", ");
        }

        /**
        * @param {any} value
        * @param {string} type
        * @returns {any}
        */
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

        /**
         *
         * @param {ASTNode} elt
         * @param {Context} ctx
         * @returns {any}
         */
        evaluateNoPromise(elt, ctx) {
            let result = elt.evaluate(ctx);
            if (result.next) {
                throw new Error(Tokens.sourceFor.call(elt) + " returned a Promise in a context that they are not allowed.");
            }
            return result;
        }

        internalDataMap = new WeakMap

        /**
        * @param {Element} elt
        * @returns {Object}
        */
        getInternalData(elt) {
            var internalData = this.internalDataMap.get(elt);
            if (typeof internalData === 'undefined') {
                this.internalDataMap.set(elt, internalData = {});
            }
            return internalData;
        }

        /**
        * @param {any} value
        * @param {string} typeString
        * @param {boolean} [nullOk]
        * @returns {boolean}
        */
        typeCheck(value, typeString, nullOk) {
            if (value == null && nullOk) {
                return true;
            }
            var typeName = Object.prototype.toString.call(value).slice(8, -1);
            return typeName === typeString;
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
                return {}; // no element, return empty scope
            }
        }

        /**
        * @param {string} str
        * @returns {boolean}
        */
        isReservedWord(str) {
            return ["meta", "it", "result", "locals", "event", "target", "detail", "sender", "body"].includes(str)
        }

        /**
        * @param {any} context
        * @returns {boolean}
        */
        isHyperscriptContext(context) {
            return context instanceof Context;
        }

        /**
        * @param {string} str
        * @param {Context} context
        * @returns {any}
        */
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
                    if (this.reactivity._activeEffect) this.reactivity._trackSymbol(str, "global", context);
                    return this.globalScope[str];
                } else if (type === "element") {
                    if (this.reactivity._activeEffect) this.reactivity._trackSymbol(str, "element", context);
                    var elementScope = this.getElementScope(context);
                    return elementScope[str];
                } else if (type === "local") {
                    return context.locals[str];
                } else {
                    // meta scope (used for event conditionals)
                    if (context.meta && context.meta.context) {
                        var fromMetaContext = context.meta.context[str];
                        if (typeof fromMetaContext !== "undefined") {
                            return fromMetaContext;
                        }
                        // resolve against the `detail` object in the meta context as well
                        if (context.meta.context.detail) {
                            fromMetaContext = context.meta.context.detail[str];
                            if (typeof fromMetaContext !== "undefined") {
                                return fromMetaContext;
                            }
                        }
                    }
                    if (this.isHyperscriptContext(context) && !this.isReservedWord(str)) {
                        // local scope
                        var fromContext = context.locals[str];
                    } else {
                        // direct get from normal JS object or top-level of context
                        var fromContext = context[str];
                    }
                    if (typeof fromContext !== "undefined") {
                        // Found in locals/meta - don't track (ephemeral)
                        return fromContext;
                    } else {
                        // element scope
                        var elementScope = this.getElementScope(context);
                        fromContext = elementScope[str];
                        if (typeof fromContext !== "undefined") {
                            if (this.reactivity._activeEffect) this.reactivity._trackSymbol(str, "element", context);
                            return fromContext;
                        } else {
                            // Global scope (or not found - track as global
                            // so we catch the first write)
                            if (this.reactivity._activeEffect) this.reactivity._trackSymbol(str, "global", context);
                            return this.globalScope[str];
                        }
                    }
                }
            }
        }

        setSymbol(str, context, type, value) {
            if (type === "global") {
                this.globalScope[str] = value;
                this.reactivity._notifySymbolSubscribers(str, "global", context);
            } else if (type === "element") {
                var elementScope = this.getElementScope(context);
                elementScope[str] = value;
                this.reactivity._notifySymbolSubscribers(str, "element", context);
            } else if (type === "local") {
                context.locals[str] = value;
                // Don't notify - local scope is ephemeral
            } else {
                if (this.isHyperscriptContext(context) && !this.isReservedWord(str) && typeof context.locals[str] !== "undefined") {
                    // local scope - don't notify
                    context.locals[str] = value;
                } else {
                    // element scope
                    var elementScope = this.getElementScope(context);
                    var fromContext = elementScope[str];
                    if (typeof fromContext !== "undefined") {
                        elementScope[str] = value;
                        this.reactivity._notifySymbolSubscribers(str, "element", context);
                    } else {
                        if (this.isHyperscriptContext(context) && !this.isReservedWord(str)) {
                            // local scope - don't notify
                            context.locals[str] = value;
                        } else {
                            // direct set on normal JS object or top-level of context
                            context[str] = value;
                        }
                    }
                }
            }
        }

        createEffect(computeFn, effectFn, options) {
            return this.reactivity.createEffect(computeFn, effectFn, options);
        }

        disposeEffect(effect) {
            return this.reactivity.disposeEffect(effect);
        }

        /**
        * @param {ASTNode} command
        * @param {Context} context
        * @returns {undefined | ASTNode}
        */
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

        /**
        * @param {Object<string,any>} root
        * @param {string} property
        * @param {Getter} getter
        * @returns {any}
        *
        * @callback Getter
        * @param {Object<string,any>} root
        * @param {string} property
        */
        flatGet(root, property, getter, trackingType) {
            if (root != null) {
                // Track the read if an effect is active
                if (this.reactivity._activeEffect && trackingType && root instanceof Element) {
                    this.reactivity._trackElementDep(trackingType, root, property);
                }

                var val = getter(root, property);
                if (typeof val !== "undefined") {
                    return val;
                }

                if (this.shouldAutoIterate(root)) {
                    // flat map
                    var result = [];
                    for (var component of root) {
                        // Track each element in the collection
                        if (this.reactivity._activeEffect && trackingType && component instanceof Element) {
                            this.reactivity._trackElementDep(trackingType, component, property);
                        }
                        var componentValue = getter(component, property);
                        result.push(componentValue);
                    }
                    return result;
                }
            }
        }

        resolveProperty(root, property) {
            return this.flatGet(root, property, PROP_GETTER, "property")
        }

        resolveAttribute(root, property) {
            return this.flatGet(root, property, ATTR_GETTER, "attribute")
        }

        /**
         *
         * @param {Object<string, any>} root
         * @param {string} property
         * @returns {string}
         */
        resolveStyle(root, property) {
            return this.flatGet(root, property, (root, property) => root.style && root.style[property] )
        }

        /**
         *
         * @param {Object<string, any>} root
         * @param {string} property
         * @returns {string}
         */
        resolveComputedStyle(root, property) {
            return this.flatGet(root, property, (root, property) => getComputedStyle(
                /** @type {Element} */ (root)).getPropertyValue(property) )
        }

        /**
        * @param {Element} elt
        * @param {string[]} nameSpace
        * @param {string} name
        * @param {any} value
        */
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
                root.meta.traceMap = new Map(); // TODO - WeakMap?
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

        /**
        * @param {string} str
        * @returns {string}
        */
        escapeSelector(str) {
            return str.replace(/[:&()\[\]\/]/g, function (str) {
                return "\\" + str;
            });
        }

        /**
        * @param {any} value
        * @param {*} elt
        */
        nullCheck(value, elt) {
            if (value == null) {
                throw new Error("'" + elt.sourceFor() + "' is null");
            }
        }

        /**
        * @param {any} value
        * @returns {boolean}
        */
        isEmpty(value) {
            return value == undefined || value.length === 0;
        }

        /**
        * @param {any} value
        * @returns {boolean}
        */
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

        /**
        * @param {Node} node
        * @returns {Document|ShadowRoot}
        */
        getRootNode(node) {
            if (node && node instanceof Node) {
                var rv = node.getRootNode();
                if (rv instanceof Document || rv instanceof ShadowRoot) return rv;
            }
            return document;
        }

        /**
         *
         * @param {Element} elt
         * @param {ASTNode} onFeature
         * @returns {EventQueue}
         *
         * @typedef {{queue:Array, executing:boolean}} EventQueue
         */
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

        /**
         * @param {Element} elt
         * @param {Element} [target]
         */
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

        /**
         * @param {HTMLElement} elt
         */
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

        /**
         * Initialize web-specific conversions
         */
        initWebConversions() {
            // Values dynamic resolver - extracts form values from DOM nodes
            conversions.dynamicResolvers.push((str, node) => {
                if (!(str === "Values" || str.indexOf("Values:") === 0)) {
                    return;
                }
                var conversion = str.split(":")[1];
                var result = {};

                this.implicitLoop(node, (/** @type HTMLInputElement */ node) => {
                    // Try to get a value directly from this node
                    var input = getInputInfo(node);

                    if (input !== undefined) {
                        result[input.name] = input.value;
                        return;
                    }

                    // Otherwise, try to query all child elements of this node that *should* contain values.
                    if (node.querySelectorAll != undefined) {
                        var children = node.querySelectorAll("input,select,textarea");
                        children.forEach(appendValue);
                    }
                });

                if (conversion) {
                    if (conversion === "JSON") {
                        return JSON.stringify(result);
                    } else if (conversion === "Form") {
                        return new URLSearchParams(result).toString();
                    } else {
                        throw "Unknown conversion: " + conversion;
                    }
                } else {
                    return result;
                }

                function appendValue(node) {
                    var info = getInputInfo(node);

                    if (info == undefined) {
                        return;
                    }

                    // If there is no value already stored in this space.
                    if (result[info.name] == undefined) {
                        result[info.name] = info.value;
                        return;
                    }

                    if (Array.isArray(result[info.name]) && Array.isArray(info.value)) {
                        result[info.name] = [].concat(result[info.name], info.value);
                        return;
                    }
                }

                function getInputInfo(node) {
                    try {
                        var result = {
                            name: node.name,
                            value: node.value,
                        };

                        if (result.name == undefined || result.value == undefined) {
                            return undefined;
                        }

                        if (node.type == "radio" && node.checked == false) {
                            return undefined;
                        }

                        if (node.type == "checkbox") {
                            if (node.checked == false) {
                                result.value = undefined;
                            } else if (typeof result.value === "string") {
                                result.value = [result.value];
                            }
                        }

                        if (node.type == "select-multiple") {
                            var selected = node.querySelectorAll("option[selected]");

                            result.value = [];
                            for (var index = 0; index < selected.length; index++) {
                                result.value.push(selected[index].value);
                            }
                        }
                        return result;
                    } catch (e) {
                        return undefined;
                    }
                }
            });

            // HTML conversion - converts values to HTML strings
            conversions["HTML"] = (value) => {
                var toHTML = (value) => {
                    if (value instanceof Array) {
                        return value.map(item => toHTML(item)).join("");
                    }

                    if (value instanceof HTMLElement) {
                        return value.outerHTML;
                    }

                    if (value instanceof NodeList) {
                        var result = "";
                        for (var i = 0; i < value.length; i++) {
                            var node = value[i];
                            if (node instanceof HTMLElement) {
                                result += node.outerHTML;
                            }
                        }
                        return result;
                    }

                    if (value.toString) {
                        return value.toString();
                    }

                    return "";
                };

                return toHTML(value);
            };

            // Fragment conversion - converts values to document fragments
            conversions["Fragment"] = (val) => {
                var frag = document.createDocumentFragment();
                this.implicitLoop(val, (val) => {
                    if (val instanceof Node) frag.append(val);
                    else {
                        var temp = document.createElement("template");
                        temp.innerHTML = val;
                        frag.append(temp.content);
                    }
                });
                return frag;
            };
        }
}
