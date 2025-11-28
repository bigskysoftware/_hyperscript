// _hyperscript - ES Module
'use strict';

// Import core modules
import { Tokenizer, Tokens } from './core/tokenizer.js';
import { LanguageKernel } from './core/kernel.js';
import { Runtime } from './core/runtime.js';
import { ElementCollection } from './core/runtime.js';
import { config, conversions } from './core/config.js';
import hyperscriptCoreGrammar from './grammars/core.js';
import hyperscriptWebGrammar from './grammars/web.js';

const globalScope = typeof self !== 'undefined' ? self : (typeof global !== 'undefined' ? global : this);

    function getCookiesAsArray() {
        let cookiesAsArray = document.cookie
            .split("; ")
            .map(cookieEntry => {
                let strings = cookieEntry.split("=");
                return {name: strings[0], value: decodeURIComponent(strings[1])}
            });
        return cookiesAsArray;
    }

    function clearCookie(name) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    function clearAllCookies() {
        for (const cookie of getCookiesAsArray()) {
            clearCookie(cookie.name);
        }
    }

    const CookieJar = new Proxy({}, {
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

    class Context {
        /**
        * @param {*} owner
        * @param {*} feature
        * @param {*} hyperscriptTarget
        * @param {*} event
        */
        constructor(owner, feature, hyperscriptTarget, event, runtime) {
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

    /**
     * parseJSON parses a JSON string into a corresponding value.  If the
     * value passed in is not valid JSON, then it logs an error and returns `null`.
     *
     * @param {string} jString
     * @returns any
     */
    function parseJSON(jString) {
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
    function logError(msg) {
        if (console.error) {
            console.error(msg);
        } else if (console.log) {
            console.log("ERROR: ", msg);
        }
    }


    // Create lexer and runtime first
    const tokenizer_ = new Tokenizer();
    const runtime_ = new Runtime(globalScope);

    // Create and configure kernel
    const kernel_ = new LanguageKernel();
    // Add runtime to kernel for backward compatibility with grammar code
    kernel_.runtime = runtime_;
    hyperscriptCoreGrammar(kernel_);
    hyperscriptWebGrammar(kernel_);

    // Set up the LanguageKernel.raiseParseError callback for Tokens
    Tokens._parserRaiseError = LanguageKernel.raiseParseError;
    // Set up the Runtime reference for ElementCollection
    ElementCollection._runtime = runtime_;

    // Forward declarations for functions that need to be referenced before definition
    let processNode, initElement;

    /**
     * @param {string} src
     * @param {Partial<Context>} [ctx]
     * @param {Object} [args]
     * @returns {any}
     */
    function evaluate(src, ctx, args) {
        class HyperscriptModule extends EventTarget {
            constructor(mod) {
                super();
                this.module = mod;
            }
            toString() {
                return this.module.id;
            }
        }

        var body = 'document' in globalScope
            ? globalScope.document.body
            : new HyperscriptModule(args && args.module);
        ctx = Object.assign(runtime_.makeContext(body, null, body, null), ctx || {});
        var element = kernel_.parse(tokenizer_, src);
        if (element.execute) {
            element.execute(ctx);
            if(typeof ctx.meta.returnValue !== 'undefined'){
                return ctx.meta.returnValue;
            } else {
                return ctx.result;
            }
        } else if (element.apply) {
            element.apply(body, body, args, runtime_);
            return runtime_.getHyperscriptFeatures(body);
        } else {
            return element.evaluate(ctx);
        }
    }

    /**
     * @param {Element} elt
     * @param {Element} [target]
     */
    initElement = function(elt, target) {
        if (elt.closest && elt.closest(config.disableSelector)) {
            return;
        }
        var internalData = runtime_.getInternalData(elt);
        if (!internalData.initialized) {
            var src = runtime_.getScript(elt);
            if (src) {
                try {
                    internalData.initialized = true;
                    internalData.script = src;
                    var tokens = tokenizer_.tokenize(src);
                    var hyperScript = kernel_.parseHyperScript(tokens);
                    if (!hyperScript) return;
                    hyperScript.apply(target || elt, elt, null, runtime_);
                    setTimeout(() => {
                        runtime_.triggerEvent(target || elt, "load", {
                            hyperscript: true,
                        });
                    }, 1);
                } catch (e) {
                    runtime_.triggerEvent(elt, "exception", {
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
    processNode = function(elt) {
        var selector = runtime_.getScriptSelector();
        if (runtime_.matchesSelector(elt, selector)) {
            initElement(elt, elt);
        }
        if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
            initElement(elt, document.body);
        }
        if (elt.querySelectorAll) {
            runtime_.forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), elt => {
                initElement(elt, elt instanceof HTMLScriptElement && elt.type === "text/hyperscript" ? document.body : elt);
            });
        }
    }

    // Add processNode to runtime for backward compatibility with grammars
    runtime_.processNode = processNode;

    /**
     *
     * @param {string} src
     * @param {Partial<Context>} [ctx]
     */
    function run(src, ctx) {
        return evaluate(src, ctx)
    }

    function browserInit() {
        /** @type {HTMLScriptElement[]} */
        var scripts = Array.from(globalScope.document.querySelectorAll("script[type='text/hyperscript'][src]"))
        Promise.all(
            scripts.map(function (script) {
                return fetch(script.src)
                    .then(function (res) {
                        return res.text();
                    });
            })
        )
        .then(script_values => script_values.forEach(sc => _hyperscript(sc)))
        .then(() => ready(function () {
            mergeMetaConfig();
            processNode(document.documentElement);

            document.dispatchEvent(new Event("hyperscript:ready"));

            globalScope.document.addEventListener("htmx:load", function (/** @type {CustomEvent} */ evt) {
                processNode(evt.detail.elt);
            });
        }));

        function ready(fn) {
            if (document.readyState !== "loading") {
                setTimeout(fn);
            } else {
                document.addEventListener("DOMContentLoaded", fn);
            }
        }

        function getMetaConfig() {
            /** @type {HTMLMetaElement} */
            var element = document.querySelector('meta[name="htmx-config"]');
            if (element) {
                return parseJSON(element.content);
            } else {
                return null;
            }
        }

        function mergeMetaConfig() {
            var metaConfig = getMetaConfig();
            if (metaConfig) {
                Object.assign(config, metaConfig);
            }
        }
    }

    /**
     * @typedef {Object} HyperscriptAPI
     *
     * @property {Object} config
     * @property {string} config.attributes
     * @property {string} config.defaultTransition
     * @property {string} config.disableSelector
     * @property {typeof conversions} config.conversions
     *
     * @property {Object} internals
     * @property {Tokenizer} internals.tokenizer
     * @property {typeof Tokenizer} internals.Tokenizer
     * @property {LanguageKernel} internals.parser
     * @property {typeof LanguageKernel} internals.Parser
     * @property {Runtime} internals.runtime
     * @property {typeof Runtime} internals.Runtime
     *
     * @property {typeof ElementCollection} ElementCollection
     *
     * @property {(keyword: string, definition: ParseRule) => void} addFeature
     * @property {(keyword: string, definition: ParseRule) => void} addCommand
     * @property {(keyword: string, definition: ParseRule) => void} addLeafExpression
     * @property {(keyword: string, definition: ParseRule) => void} addIndirectExpression
     *
     * @property {(src: string, ctx?: Partial<Context>, args?: Object) => any} evaluate
     * @property {(src: string) => ASTNode} parse
     * @property {(node: Element) => void} processNode
     *
     * @property {() => void} browserInit
     *
     *
     * @typedef {HyperscriptAPI & ((src: string, ctx?: Partial<Context>) => any)} Hyperscript
     */

    /**
     * @type {Hyperscript}
     */
    const _hyperscript = Object.assign(
        run,
        {
            config,

            use(plugin) { plugin(_hyperscript) },

            internals: {
                tokenizer: tokenizer_, parser: kernel_, runtime: runtime_,
                Tokenizer, Tokens, Parser: LanguageKernel, Runtime,
            },
            ElementCollection,

            addFeature:            kernel_.addFeature.bind(kernel_),
            addCommand:            kernel_.addCommand.bind(kernel_),
            addLeafExpression:     kernel_.addLeafExpression.bind(kernel_),
            addIndirectExpression: kernel_.addIndirectExpression.bind(kernel_),

            evaluate,
            parse:       (src) => kernel_.parse(tokenizer_, src),
            process: processNode,
            processNode,
            version: "0.9.14",
            browserInit,
        }
    )

// ES Module exports
export default _hyperscript;
