// _hyperscript - ES Module
'use strict';

// Import core modules
import { Tokenizer, Tokens } from './core/tokenizer.js';
import { LanguageKernel } from './core/kernel.js';
import { Runtime, CookieJar } from './core/runtime.js';
import { ElementCollection } from './core/runtime.js';
import { config, conversions, initWebConversions } from './core/config.js';

// Expression imports
import { IdRef, ClassRef, QueryRef, AttributeRef, StyleRef, StyleLiteral } from './parsetree/expressions/webliterals.js';
import {
    ParenthesizedExpression, BlockLiteral, NegativeNumber, LogicalNot, SymbolRef, BeepExpression,
    PropertyAccess, OfExpression, PossessiveExpression, InExpression, AsExpression, FunctionCall,
    AttributeRefAccess, ArrayIndex, MathOperator, MathExpression, ComparisonOperator,
    ComparisonExpression, LogicalOperator, LogicalExpression, AsyncExpression, DotOrColonPath
} from './parsetree/expressions/expressions.js';
import {
    NakedString, StringLiteral, NumberLiteral, BooleanLiteral, NullLiteral,
    ArrayLiteral, ObjectKey, ObjectLiteral, NamedArgumentList
} from './parsetree/expressions/literals.js';
import { ImplicitMeTarget } from './parsetree/expressions/targets.js';
import { NoExpression, SomeExpression } from './parsetree/expressions/existentials.js';
import { RelativePositionalExpression, PositionalExpression, ClosestExpr } from './parsetree/expressions/positional.js';
import { StringPostfixExpression, TimeExpression, TypeCheckExpression } from './parsetree/expressions/postfix.js';

// Command imports
import {
    LogCommand, BeepCommand, ThrowCommand, ReturnCommand, ExitCommand, HaltCommand,
    MakeCommand, AppendCommand, PickCommand, FetchCommand, GoCommand
} from './parsetree/commands/basic.js';
import { SetCommand, DefaultCommand, IncrementCommand, DecrementCommand, PutCommand } from './parsetree/commands/setters.js';
import { WaitCommand, TriggerCommand, SendCommand, EventName } from './parsetree/commands/events.js';
import { IfCommand, RepeatCommand, ForCommand, ContinueCommand, BreakCommand, TellCommand } from './parsetree/commands/controlflow.js';
import { JsBody, JsCommand, AsyncCommand, CallCommand, GetCommand } from './parsetree/commands/execution.js';
import { PseudoCommand } from './parsetree/commands/pseudoCommand.js';
import { AddCommand, RemoveCommand, ToggleCommand, HideCommand, ShowCommand, TakeCommand, MeasureCommand } from './parsetree/commands/dom.js';
import { SettleCommand, TransitionCommand } from './parsetree/commands/animations.js';

// Feature imports
import { SetFeature } from './parsetree/features/set.js';
import { InitFeature } from './parsetree/features/init.js';
import { WorkerFeature } from './parsetree/features/worker.js';
import { BehaviorFeature } from './parsetree/features/behavior.js';
import { InstallFeature } from './parsetree/features/install.js';
import { JsFeature } from './parsetree/features/js.js';
import { DefFeature } from './parsetree/features/def.js';
import { OnFeature } from './parsetree/features/on.js';

const globalScope = typeof self !== 'undefined' ? self : (typeof global !== 'undefined' ? global : this);

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

    // ===== Grammar Registration =====

    // Literals and basic expressions
    kernel_.addLeafExpression("parenthesized", ParenthesizedExpression.parse);
    kernel_.addLeafExpression("string", StringLiteral.parse);
    kernel_.addGrammarElement("nakedString", NakedString.parse);
    kernel_.addLeafExpression("number", NumberLiteral.parse);
    kernel_.addLeafExpression("boolean", BooleanLiteral.parse);
    kernel_.addLeafExpression("null", NullLiteral.parse);
    kernel_.addLeafExpression("arrayLiteral", ArrayLiteral.parse);
    kernel_.addLeafExpression("blockLiteral", BlockLiteral.parse);
    kernel_.addLeafExpression("objectLiteral", ObjectLiteral.parse);
    kernel_.addGrammarElement("objectKey", ObjectKey.parse);
    kernel_.addGrammarElement("nakedNamedArgumentList", NamedArgumentList.parseNaked);
    kernel_.addGrammarElement("namedArgumentList", NamedArgumentList.parse);

    // Web literals and references
    kernel_.addLeafExpression("idRef", IdRef.parse);
    kernel_.addLeafExpression("classRef", ClassRef.parse);
    kernel_.addLeafExpression("queryRef", QueryRef.parse);
    kernel_.addLeafExpression("attributeRef", AttributeRef.parse);
    kernel_.addLeafExpression("styleRef", StyleRef.parse);
    kernel_.addGrammarElement("styleLiteral", StyleLiteral.parse);

    // Symbols and identifiers
    kernel_.addGrammarElement("symbol", SymbolRef.parse);
    kernel_.addGrammarElement("implicitMeTarget", ImplicitMeTarget.parse);
    kernel_.addGrammarElement("dotOrColonPath", DotOrColonPath.parse);
    kernel_.addGrammarElement("eventName", EventName.parse);

    // Indirect expressions (property access, function calls, etc.)
    kernel_.addIndirectExpression("propertyAccess", PropertyAccess.parse);
    kernel_.addIndirectExpression("of", OfExpression.parse);
    kernel_.addIndirectExpression("possessive", PossessiveExpression.parse);
    kernel_.addIndirectExpression("inExpression", InExpression.parse);
    kernel_.addIndirectExpression("asExpression", AsExpression.parse);
    kernel_.addIndirectExpression("functionCall", FunctionCall.parse);
    kernel_.addIndirectExpression("attributeRefAccess", AttributeRefAccess.parse);
    kernel_.addIndirectExpression("arrayIndex", ArrayIndex.parse);

    // Unary and logical expressions
    kernel_.addGrammarElement("logicalNot", LogicalNot.parse);
    kernel_.addGrammarElement("noExpression", NoExpression.parse);
    kernel_.addLeafExpression("some", SomeExpression.parse);
    kernel_.addGrammarElement("negativeNumber", NegativeNumber.parse);
    kernel_.addGrammarElement("beepExpression", BeepExpression.parse);

    // Positional expressions
    kernel_.addGrammarElement("relativePositionalExpression", RelativePositionalExpression.parse);
    kernel_.addGrammarElement("positionalExpression", PositionalExpression.parse);
    kernel_.addLeafExpression("closestExpr", ClosestExpr.parse);

    // Math and comparison expressions
    kernel_.addGrammarElement("mathOperator", MathOperator.parse);
    kernel_.addGrammarElement("mathExpression", MathExpression.parse);
    kernel_.addGrammarElement("comparisonOperator", ComparisonOperator.parse);
    kernel_.addGrammarElement("comparisonExpression", ComparisonExpression.parse);

    // Logical expressions
    kernel_.addGrammarElement("logicalOperator", LogicalOperator.parse);
    kernel_.addGrammarElement("logicalExpression", LogicalExpression.parse);
    kernel_.addGrammarElement("asyncExpression", AsyncExpression.parse);

    // Features
    kernel_.addFeature("on", function (parser) {
        return OnFeature.parse(parser, kernel_);
    });
    kernel_.addFeature("def", function (parser) {
        return DefFeature.parse(parser, kernel_);
    });
    kernel_.addFeature("set", function (parser) {
        return SetFeature.parse(parser, kernel_);
    });
    kernel_.addFeature("init", function (parser) {
        return InitFeature.parse(parser, kernel_);
    });
    kernel_.addFeature("worker", WorkerFeature.parse);
    kernel_.addFeature("behavior", BehaviorFeature.parse);
    kernel_.addFeature("install", InstallFeature.parse);
    kernel_.addGrammarElement("jsBody", JsBody.parse);
    kernel_.addFeature("js", JsFeature.parse);

    // Basic commands
    kernel_.addCommands(LogCommand);
    kernel_.addCommand("beep!", BeepCommand.parse);
    kernel_.addCommand("throw", ThrowCommand.parse);
    kernel_.addCommand("return", ReturnCommand.parse);
    kernel_.addCommand("exit", ExitCommand.parse);
    kernel_.addCommand("halt", HaltCommand.parse);
    kernel_.addCommand("make", MakeCommand.parse);
    kernel_.addCommand("pick", PickCommand.parse);
    kernel_.addCommand("fetch", FetchCommand.parse);
    kernel_.addCommand("go", GoCommand.parse);

    // Variable and value commands
    kernel_.addCommand("set", SetCommand.parse);
    kernel_.addCommand("default", DefaultCommand.parse);
    kernel_.addCommand("increment", IncrementCommand.parse);
    kernel_.addCommand("decrement", DecrementCommand.parse);
    kernel_.addCommand("append", AppendCommand.parse);
    kernel_.addCommand("put", function (parser) {
        return PutCommand.parse(parser, kernel_);
    });

    // Control flow commands
    kernel_.addCommand("if", IfCommand.parse);
    kernel_.addCommand("repeat", RepeatCommand.parse);
    kernel_.addCommand("for", ForCommand.parse);
    kernel_.addCommand("continue", ContinueCommand.parse);
    kernel_.addCommand("break", BreakCommand.parse);
    kernel_.addCommand("tell", TellCommand.parse);

    // Event commands
    kernel_.addCommand("wait", WaitCommand.parse);
    kernel_.addCommand("trigger", TriggerCommand.parse);
    kernel_.addCommand("send", SendCommand.parse);

    // Execution commands
    kernel_.addCommand("js", JsCommand.parse);
    kernel_.addCommand("async", AsyncCommand.parse);
    kernel_.addCommand("call", CallCommand.parse);
    kernel_.addCommand("get", GetCommand.parse);
    kernel_.addGrammarElement("pseudoCommand", PseudoCommand.parse);

    // DOM manipulation commands
    kernel_.addCommand("add", AddCommand.parse);
    kernel_.addCommand("remove", RemoveCommand.parse);
    kernel_.addCommand("toggle", function (parser) {
        return ToggleCommand.parse(parser, kernel_, config);
    });
    kernel_.addCommand("hide", function (parser) {
        return HideCommand.parse(parser, kernel_, config);
    });
    kernel_.addCommand("show", function (parser) {
        return ShowCommand.parse(parser, kernel_, config);
    });
    kernel_.addCommand("take", TakeCommand.parse);
    kernel_.addCommand("measure", MeasureCommand.parse);

    // Animation commands
    kernel_.addCommand("settle", SettleCommand.parse);
    kernel_.addCommand("transition", function (parser) {
        return TransitionCommand.parse(parser, config);
    });

    // Initialize web-specific conversions
    initWebConversions(runtime_);

    // ===== TODO: Move To Kernel =====
    kernel_.addGrammarElement("postfixExpression", function (parser) {
        var root = parser.parseElement("negativeNumber");
        return StringPostfixExpression.parse(parser, root) ||
               TimeExpression.parse(parser, root) ||
               TypeCheckExpression.parse(parser, root) ||
               root;
    });

    kernel_.addGrammarElement("unaryExpression", function (parser) {
        parser.matchToken("the"); // optional "the"
        return parser.parseAnyOf(["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"]);
    });

    kernel_.addGrammarElement("expression", function (parser) {
        parser.matchToken("the"); // optional the
        return parser.parseElement("asyncExpression");
    });

    kernel_.addGrammarElement("assignableExpression", function (parser) {
        parser.matchToken("the"); // optional the
        // TODO obviously we need to generalize this as a left hand side / targetable concept
        var expr = parser.parseElement("primaryExpression");
        if (expr && (
            expr.type === "symbol" ||
            expr.type === "ofExpression" ||
            expr.type === "propertyAccess" ||
            expr.type === "attributeRefAccess" ||
            expr.type === "attributeRef" ||
            expr.type === "styleRef" ||
            expr.type === "arrayIndex" ||
            expr.type === "possessive")
        ) {
            return expr;
        } else {
            parser.raiseParseError(
                "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
            );
        }
        return expr;
    });

    kernel_.addGrammarElement("stringLike", function (parser) {
        return parser.parseAnyOf(["string", "nakedString"]);
    });

    kernel_.addGrammarElement("hyperscript", function (parser) {
        var features = [];
        if (parser.hasMore()) {
            while (parser.featureStart(parser.currentToken()) || parser.currentToken().value === "(") {
                var feature = parser.requireElement("feature");
                features.push(feature);
                parser.matchToken("end"); // optional end
            }
        }
        return {
            type: "hyperscript",
            features: features,
            apply: function (target, source, args, runtime) {
                // no op
                for (const feature of features) {
                    feature.install(target, source, args, runtime);
                }
            },
        };
    });

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
