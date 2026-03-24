// _hyperscript - ES Module
'use strict';

// Import core modules
import {Tokenizer, Tokens} from './core/tokenizer.js';
import {LanguageKernel} from './core/kernel.js';
import {ElementCollection, HyperscriptModule, Runtime} from './core/runtime.js';
import {config, conversions} from './core/config.js';

// Import parse element modules
import * as Expressions from './parsetree/expressions/expressions.js';
import * as Literals from './parsetree/expressions/literals.js';
import * as WebLiterals from './parsetree/expressions/webliterals.js';
import * as Postfix from './parsetree/expressions/postfix.js';
import * as Positional from './parsetree/expressions/positional.js';
import * as Existentials from './parsetree/expressions/existentials.js';
import * as Targets from './parsetree/expressions/targets.js';
import * as Pseudopossessive from './parsetree/expressions/pseudopossessive.js';
import * as BasicCommands from './parsetree/commands/basic.js';
import * as SetterCommands from './parsetree/commands/setters.js';
import * as EventCommands from './parsetree/commands/events.js';
import * as ControlFlow from './parsetree/commands/controlflow.js';
import * as Execution from './parsetree/commands/execution.js';
import * as PseudoCommandModule from './parsetree/commands/pseudoCommand.js';
import * as DomCommands from './parsetree/commands/dom.js';
import * as AnimationCommands from './parsetree/commands/animations.js';
import * as OnFeatureModule from './parsetree/features/on.js';
import * as DefFeatureModule from './parsetree/features/def.js';
import * as SetFeatureModule from './parsetree/features/set.js';
import * as InitFeatureModule from './parsetree/features/init.js';
import * as WorkerFeatureModule from './parsetree/features/worker.js';
import * as BehaviorFeatureModule from './parsetree/features/behavior.js';
import * as InstallFeatureModule from './parsetree/features/install.js';
import * as JsFeatureModule from './parsetree/features/js.js';

const globalScope = typeof self !== 'undefined' ? self : (typeof global !== 'undefined' ? global : this);

// Create and configure kernel
const kernel = new LanguageKernel();

// Create tokenizer first, then runtime with kernel and tokenizer
const tokenizer = new Tokenizer();
const runtime = new Runtime(globalScope, kernel, tokenizer);

// ===== Grammar Registration =====
// Register all parse elements from modules (expressions, commands, features)
kernel.registerModule(Expressions);
kernel.registerModule(Literals);
kernel.registerModule(WebLiterals);
kernel.registerModule(Postfix);
kernel.registerModule(Positional);
kernel.registerModule(Existentials);
kernel.registerModule(Targets);
kernel.registerModule(Pseudopossessive);
kernel.registerModule(BasicCommands);
kernel.registerModule(SetterCommands);
kernel.registerModule(EventCommands);
kernel.registerModule(ControlFlow);
kernel.registerModule(Execution);
kernel.registerModule(PseudoCommandModule);
kernel.registerModule(DomCommands);
kernel.registerModule(AnimationCommands);
kernel.registerModule(OnFeatureModule);
kernel.registerModule(DefFeatureModule);
kernel.registerModule(SetFeatureModule);
kernel.registerModule(InitFeatureModule);
kernel.registerModule(WorkerFeatureModule);
kernel.registerModule(BehaviorFeatureModule);
kernel.registerModule(InstallFeatureModule);
kernel.registerModule(JsFeatureModule);

// Special cases that can't be auto-registered
kernel.addGrammarElement("nakedNamedArgumentList", Literals.NamedArgumentList.parseNaked);
kernel.addGrammarElement("stringLike", (parser) => parser.parseAnyOf(["string", "nakedString"]));
kernel.UNARY_EXPRESSIONS.push("postfixExpression");

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
