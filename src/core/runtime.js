// Runtime - Execution engine for _hyperscript
import { config, conversions } from './config.js';
import { Context, getOrInitObject } from './helpers.js';
import { shouldAutoIterateSymbol } from './util.js';
import { Tokens } from './tokens.js';

export class Runtime {
        /**
         *
         * @param {Object} globalScope
         */
        constructor(globalScope) {
            this.globalScope = globalScope;
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
                            op: function(){
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
                                var apply = parseElement.op.apply(parseElement, values);
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
                return parseElement.op.apply(parseElement, args);
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
                    return this.globalScope[str];
                } else if (type === "element") {
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
                        return fromContext;
                    } else {
                        // element scope
                        var elementScope = this.getElementScope(context);
                        fromContext = elementScope[str];
                        if (typeof fromContext !== "undefined") {
                            return fromContext;
                        } else {
                            // global scope
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
                    // local scope
                    context.locals[str] = value;
                } else {
                    // element scope
                    var elementScope = this.getElementScope(context);
                    var fromContext = elementScope[str];
                    if (typeof fromContext !== "undefined") {
                        elementScope[str] = value;
                    } else {
                        if (this.isHyperscriptContext(context) && !this.isReservedWord(str)) {
                            // local scope
                            context.locals[str] = value;
                        } else {
                            // direct set on normal JS object or top-level of context
                            context[str] = value;
                        }
                    }
                }
            }
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
        flatGet(root, property, getter) {
            if (root != null) {
                var val = getter(root, property);
                if (typeof val !== "undefined") {
                    return val;
                }

                if (this.shouldAutoIterate(root)) {
                    // flat map
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
}
