// _hyperscript - ES Module
'use strict';

// Import core modules
import {Tokenizer, Tokens} from './core/tokenizer.js';
import {LanguageKernel} from './core/kernel.js';
import {ElementCollection, HyperscriptModule, Runtime} from './core/runtime.js';
import {config, conversions} from './core/config.js';

// Expression imports
import {AttributeRef, ClassRef, IdRef, QueryRef, StyleLiteral, StyleRef} from './parsetree/expressions/webliterals.js';
import {
    ArrayIndex,
    AsExpression,
    AttributeRefAccess,
    BeepExpression,
    BlockLiteral,
    ComparisonOperator,
    DotOrColonPath,
    FunctionCall,
    InExpression,
    LogicalNot,
    LogicalOperator,
    MathOperator,
    NegativeNumber,
    OfExpression,
    ParenthesizedExpression,
    PossessiveExpression,
    PropertyAccess,
    SymbolRef
} from './parsetree/expressions/expressions.js';
import {
    ArrayLiteral,
    BooleanLiteral,
    NakedString,
    NamedArgumentList,
    NullLiteral,
    NumberLiteral,
    ObjectKey,
    ObjectLiteral,
    StringLiteral
} from './parsetree/expressions/literals.js';
import {ImplicitMeTarget} from './parsetree/expressions/targets.js';
import {NoExpression, SomeExpression} from './parsetree/expressions/existentials.js';
import {ClosestExpr, PositionalExpression, RelativePositionalExpression} from './parsetree/expressions/positional.js';
import {StringPostfixExpression, TimeExpression, TypeCheckExpression} from './parsetree/expressions/postfix.js';

// Command imports
import {
    AppendCommand,
    BeepCommand,
    ExitCommand,
    FetchCommand,
    GoCommand,
    HaltCommand,
    LogCommand,
    MakeCommand,
    PickCommand,
    ReturnCommand,
    ThrowCommand
} from './parsetree/commands/basic.js';
import {
    DecrementCommand,
    DefaultCommand,
    IncrementCommand,
    PutCommand,
    SetCommand
} from './parsetree/commands/setters.js';
import {EventName, SendCommand, TriggerCommand, WaitCommand} from './parsetree/commands/events.js';
import {
    BreakCommand,
    ContinueCommand,
    ForCommand,
    IfCommand,
    RepeatCommand,
    TellCommand
} from './parsetree/commands/controlflow.js';
import {CallCommand, GetCommand, JsBody, JsCommand} from './parsetree/commands/execution.js';
import {PseudoCommand} from './parsetree/commands/pseudoCommand.js';
import {
    AddCommand,
    HideCommand,
    MeasureCommand,
    RemoveCommand,
    ShowCommand,
    TakeCommand,
    ToggleCommand
} from './parsetree/commands/dom.js';
import {SettleCommand, TransitionCommand} from './parsetree/commands/animations.js';

// Feature imports
import {SetFeature} from './parsetree/features/set.js';
import {InitFeature} from './parsetree/features/init.js';
import {WorkerFeature} from './parsetree/features/worker.js';
import {BehaviorFeature} from './parsetree/features/behavior.js';
import {InstallFeature} from './parsetree/features/install.js';
import {JsFeature} from './parsetree/features/js.js';
import {DefFeature} from './parsetree/features/def.js';
import {OnFeature} from './parsetree/features/on.js';

const globalScope = typeof self !== 'undefined' ? self : (typeof global !== 'undefined' ? global : this);

// Create and configure kernel
const kernel = new LanguageKernel();

// Create tokenizer first, then runtime with kernel and tokenizer
const tokenizer = new Tokenizer();
const runtime = new Runtime(globalScope, kernel, tokenizer);

// ===== Grammar Registration =====

// Literals and basic expressions
kernel.addLeafExpression("parenthesized", ParenthesizedExpression.parse);
kernel.addLeafExpression("string", StringLiteral.parse);
kernel.addGrammarElement("nakedString", NakedString.parse);
kernel.addGrammarElement("stringLike", function (parser) {
    return parser.parseAnyOf(["string", "nakedString"]);
});
kernel.addLeafExpression("number", NumberLiteral.parse);
kernel.addLeafExpression("boolean", BooleanLiteral.parse);
kernel.addLeafExpression("null", NullLiteral.parse);
kernel.addLeafExpression("arrayLiteral", ArrayLiteral.parse);
kernel.addLeafExpression("blockLiteral", BlockLiteral.parse);
kernel.addLeafExpression("objectLiteral", ObjectLiteral.parse);
kernel.addGrammarElement("objectKey", ObjectKey.parse);
kernel.addGrammarElement("nakedNamedArgumentList", NamedArgumentList.parseNaked);
kernel.addGrammarElement("namedArgumentList", NamedArgumentList.parse);

// Web literals and references
kernel.addLeafExpression("idRef", IdRef.parse);
kernel.addLeafExpression("classRef", ClassRef.parse);
kernel.addLeafExpression("queryRef", QueryRef.parse);
kernel.addLeafExpression("attributeRef", AttributeRef.parse);
kernel.addLeafExpression("styleRef", StyleRef.parse);
kernel.addGrammarElement("styleLiteral", StyleLiteral.parse);

// Symbols and identifiers
kernel.addGrammarElement("symbol", SymbolRef.parse);
kernel.addGrammarElement("implicitMeTarget", ImplicitMeTarget.parse);
kernel.addGrammarElement("dotOrColonPath", DotOrColonPath.parse);
kernel.addGrammarElement("eventName", EventName.parse);

// Indirect expressions (property access, function calls, etc.)
kernel.addIndirectExpression("propertyAccess", PropertyAccess.parse);
kernel.addIndirectExpression("of", OfExpression.parse);
kernel.addIndirectExpression("possessive", PossessiveExpression.parse);
kernel.addIndirectExpression("inExpression", InExpression.parse);
kernel.addIndirectExpression("asExpression", AsExpression.parse);
kernel.addIndirectExpression("functionCall", FunctionCall.parse);
kernel.addIndirectExpression("attributeRefAccess", AttributeRefAccess.parse);
kernel.addIndirectExpression("arrayIndex", ArrayIndex.parse);

// Unary and logical expressions
kernel.addUnaryExpression("beepExpression", BeepExpression.parse);
kernel.addUnaryExpression("logicalNot", LogicalNot.parse);
kernel.addUnaryExpression("noExpression", NoExpression.parse);
kernel.addLeafExpression("some", SomeExpression.parse);
kernel.addGrammarElement("negativeNumber", NegativeNumber.parse);

// Positional expressions (unary)
kernel.addUnaryExpression("relativePositionalExpression", RelativePositionalExpression.parse);
kernel.addUnaryExpression("positionalExpression", PositionalExpression.parse);
kernel.addLeafExpression("closestExpr", ClosestExpr.parse);

// postfixExpression is also part of unary expressions (already registered as grammar element)
// TODO this doesn't belong here I think
kernel.UNARY_EXPRESSIONS.push("postfixExpression");

// Math, comparison, and logical expressions
kernel.addGrammarElement("mathOperator", MathOperator.parse);
kernel.addGrammarElement("comparisonOperator", ComparisonOperator.parse);
kernel.addTopExpression("logicalOperator", LogicalOperator.parse);

// Features
kernel.addFeatures(
    OnFeature, DefFeature, SetFeature, InitFeature,
    WorkerFeature, BehaviorFeature, InstallFeature
);
kernel.addGrammarElement("jsBody", JsBody.parse);
kernel.addFeature("js", JsFeature.parse);

// Basic commands
kernel.addCommands(
    LogCommand, BeepCommand, ThrowCommand, ReturnCommand, ExitCommand, HaltCommand,
    MakeCommand, PickCommand, FetchCommand, GoCommand
);

// Variable and value commands
kernel.addCommands(
    SetCommand, DefaultCommand, IncrementCommand, DecrementCommand, AppendCommand,
    PutCommand
);

// Control flow commands
kernel.addCommands(
    IfCommand, RepeatCommand, ForCommand, ContinueCommand, BreakCommand, TellCommand
);

// Event commands
kernel.addCommands(
    WaitCommand, TriggerCommand, SendCommand
);

// Execution commands
kernel.addCommands(
    JsCommand, CallCommand, GetCommand
);
kernel.addGrammarElement("pseudoCommand", PseudoCommand.parse);

// DOM manipulation commands
kernel.addCommands(
    AddCommand, RemoveCommand, TakeCommand, MeasureCommand,
    ToggleCommand, HideCommand, ShowCommand
);

// Animation commands
kernel.addCommands(SettleCommand, TransitionCommand);

// Postfix expressions
kernel.addPostfixExpression("stringPostfixExpression", StringPostfixExpression.parse);
kernel.addPostfixExpression("timeExpression", TimeExpression.parse);
kernel.addPostfixExpression("typeCheckExpression", TypeCheckExpression.parse);

// TODO: this should be driven by the expressions themselves, not a list here
kernel.ASSIGNABLE_EXPRESSIONS.push("symbol");
kernel.ASSIGNABLE_EXPRESSIONS.push("ofExpression");  // "of" produces type "ofExpression"
kernel.ASSIGNABLE_EXPRESSIONS.push("propertyAccess");
kernel.ASSIGNABLE_EXPRESSIONS.push("attributeRefAccess");
kernel.ASSIGNABLE_EXPRESSIONS.push("attributeRef");
kernel.ASSIGNABLE_EXPRESSIONS.push("styleRef");
kernel.ASSIGNABLE_EXPRESSIONS.push("arrayIndex");
kernel.ASSIGNABLE_EXPRESSIONS.push("possessive");

// Set up the LanguageKernel.raiseParseError callback for Tokens
// TODO need to rethink how tokenization errors are done
Tokens._parserRaiseError = LanguageKernel.raiseParseError;

/**
 * @param {string} src
 * @param {Partial<Context>} [ctx]
 * @param {Object} [args]
 * @returns {any}
 */
function evaluate(src, ctx, args) {
    let body;
    if ('document' in globalScope) {
        body = globalScope.document.body;
    } else {
        body = new HyperscriptModule(args && args.module);
    }

    ctx = Object.assign(runtime.makeContext(body, null, body, null), ctx || {});
    let element = kernel.parse(tokenizer, src);

    if (element.execute) {
        element.execute(ctx);
        return ctx.meta.returnValue !== undefined ? ctx.meta.returnValue : ctx.result;
    } else if (element.apply) {
        element.apply(body, body, args, runtime);
        return runtime.getHyperscriptFeatures(body);
    } else {
        return element.evaluate(ctx);
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
    evaluate,
    {
        config,

        use(plugin) {
            plugin(_hyperscript)
        },

        internals: {
            tokenizer: tokenizer, parser: kernel, runtime: runtime,
            Tokenizer, Tokens, Parser: LanguageKernel, Runtime,
        },
        ElementCollection,

        addFeature: kernel.addFeature.bind(kernel),
        addCommand: kernel.addCommand.bind(kernel),
        addLeafExpression: kernel.addLeafExpression.bind(kernel),
        addIndirectExpression: kernel.addIndirectExpression.bind(kernel),

        evaluate,
        parse: (src) => kernel.parse(tokenizer, src),
        process: (elt) => runtime.processNode(elt),
        processNode: (elt) => runtime.processNode(elt),
        version: "0.9.14",
    }
)

function ready(fn) {
    if (document.readyState !== "loading") {
        setTimeout(fn);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function mergeMetaConfig() {
    let element = document.querySelector('meta[name="htmx-config"]');
    if (element) {
        let metaConfig = JSON.parse(element.content);
        Object.assign(config, metaConfig);
    }
}

// Auto-initialize in browser
if (typeof document !== 'undefined') {
    (async function () {
        mergeMetaConfig();

        // Load external hyperscript files
        let scriptNodes = globalScope.document.querySelectorAll("script[type='text/hyperscript'][src]");
        const scripts = Array.from(scriptNodes);
        const scriptTexts = await Promise.all(
            scripts.map(async (script) => {
                const res = await fetch(script.src);
                return res.text();
            })
        );

        // Evaluate loaded scripts
        scriptTexts.forEach(sc => _hyperscript(sc));

        // Wait for DOM ready, then initialize
        ready(() => {
            runtime.processNode(document.documentElement);
            document.dispatchEvent(new Event("hyperscript:ready"));
            globalScope.document.addEventListener("htmx:load", (/** @type {CustomEvent} */ evt) => {
                runtime.processNode(evt.detail.elt);
            });
        });
    })();
}

// Also set on global for script tag usage
if (typeof self !== 'undefined') {
    self._hyperscript = _hyperscript;
}

// ES Module exports
export default _hyperscript;
export { _hyperscript };
