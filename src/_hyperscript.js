// _hyperscript - ES Module
'use strict';

// Import core modules
import {Tokenizer} from './core/tokenizer.js';
import {LanguageKernel} from './core/kernel.js';
import {Parser} from './core/parser.js';
import {Runtime} from './core/runtime/runtime.js';
import {HyperscriptModule} from './core/runtime/collections.js';
import {config} from './core/config.js';
import {conversions} from './core/runtime/conversions.js';
import {Reactivity} from './core/runtime/reactivity.js';
import {Morph} from './core/runtime/morph.js';

// Import parse element modules
import * as Expressions from './parsetree/expressions/expressions.js';
import * as Literals from './parsetree/expressions/literals.js';
import * as WebLiterals from './parsetree/expressions/webliterals.js';
import * as Postfix from './parsetree/expressions/postfix.js';
import * as Positional from './parsetree/expressions/positional.js';
import * as Existentials from './parsetree/expressions/existentials.js';
import * as Targets from './parsetree/expressions/targets.js';
import * as BasicCommands from './parsetree/commands/basic.js';
import * as SetterCommands from './parsetree/commands/setters.js';
import * as EventCommands from './parsetree/commands/events.js';
import * as ControlFlow from './parsetree/commands/controlflow.js';
import * as Execution from './parsetree/commands/execution.js';
import * as PseudoCommandModule from './parsetree/commands/pseudoCommand.js';
import * as DomCommands from './parsetree/commands/dom.js';
import * as AnimationCommands from './parsetree/commands/animations.js';
import * as DebugCommands from './parsetree/commands/debug.js';
import * as OnFeatureModule from './parsetree/features/on.js';
import * as DefFeatureModule from './parsetree/features/def.js';
import * as SetFeatureModule from './parsetree/features/set.js';
import * as InitFeatureModule from './parsetree/features/init.js';
import * as WorkerFeatureModule from './parsetree/features/worker.js';
import * as BehaviorFeatureModule from './parsetree/features/behavior.js';
import * as InstallFeatureModule from './parsetree/features/install.js';
import * as JsFeatureModule from './parsetree/features/js.js';
import * as WhenFeatureModule from './parsetree/features/when.js';
import * as BindFeatureModule from './parsetree/features/bind.js';
import * as LiveFeatureModule from './parsetree/features/live.js';
import * as TemplateCommands from './parsetree/commands/template.js';

const globalScope = typeof self !== 'undefined' ? self : (typeof global !== 'undefined' ? global : this);

// Wire conversions into config for the public API
config.conversions = conversions;

// Create and configure kernel
const kernel = new LanguageKernel();

// Create subsystems and wire them together
const tokenizer = new Tokenizer();
const reactivity = new Reactivity();
const morphEngine = new Morph();
const runtime = new Runtime(globalScope, kernel, tokenizer, reactivity, morphEngine);

// ===== Grammar Registration =====
// Register all parse elements from modules (expressions, commands, features)
kernel.registerModule(Expressions);
kernel.registerModule(Literals);
kernel.registerModule(WebLiterals);
kernel.registerModule(Postfix);
kernel.registerModule(Positional);
kernel.registerModule(Existentials);
kernel.registerModule(Targets);
kernel.registerModule(BasicCommands);
kernel.registerModule(SetterCommands);
kernel.registerModule(EventCommands);
kernel.registerModule(ControlFlow);
kernel.registerModule(Execution);
kernel.registerModule(PseudoCommandModule);
kernel.registerModule(DomCommands);
kernel.registerModule(AnimationCommands);
kernel.registerModule(DebugCommands);
kernel.registerModule(OnFeatureModule);
kernel.registerModule(DefFeatureModule);
kernel.registerModule(SetFeatureModule);
kernel.registerModule(InitFeatureModule);
kernel.registerModule(WorkerFeatureModule);
kernel.registerModule(BehaviorFeatureModule);
kernel.registerModule(InstallFeatureModule);
kernel.registerModule(JsFeatureModule);
kernel.registerModule(WhenFeatureModule);
kernel.registerModule(BindFeatureModule);
kernel.registerModule(LiveFeatureModule);
kernel.registerModule(TemplateCommands);

// ===== Live Templates =====
// <template live> renders content reactively after the template element
var liveTemplatesProcessed = new WeakSet();
runtime.addBeforeProcessHook(function(elt) {
    if (!elt || !elt.querySelectorAll) return;
    elt.querySelectorAll('template[live]').forEach(function(tmpl) {
        if (liveTemplatesProcessed.has(tmpl)) return;
        liveTemplatesProcessed.add(tmpl);

        var source = tmpl.innerHTML;
        var script = tmpl.getAttribute('_') || tmpl.getAttribute('data-script') || '';
        tmpl.removeAttribute('_');
        tmpl.removeAttribute('data-script');

        var wrapper = document.createElement('div');
        wrapper.style.display = 'contents';
        wrapper.setAttribute('data-live-template', '');
        tmpl.after(wrapper);

        if (script) {
            wrapper.setAttribute('_', script);
            runtime.processNode(wrapper);
        }

        var stamped = false;
        function stamp(html) {
            if (!stamped) {
                wrapper.innerHTML = html;
                runtime.processNode(wrapper);
                stamped = true;
            } else {
                runtime.morph(wrapper, html);
            }
        }

        function render() {
            var ctx = runtime.makeContext(wrapper, null, wrapper, null);
            var buf = [];
            ctx.meta.__ht_template_result = buf;
            var tokens = tokenizer.tokenize(source, "lines");
            var parser = new Parser(kernel, tokens);
            var cmds;
            try {
                cmds = parser.parseElement("commandList");
                parser.ensureTerminated(cmds);
            } catch (e) {
                console.error("live-template parse error:", e.message || e);
                return "";
            }
            cmds.execute(ctx);
            if (ctx.meta.returned || !ctx.meta.resolve) return buf.join("");
            var resolve;
            var promise = new Promise(function(r) { resolve = r; });
            ctx.meta.resolve = resolve;
            return promise.then(function() { return buf.join(""); });
        }

        queueMicrotask(function() {
            var result = render();
            if (result && result.then) {
                result.then(function(html) { stamp(html); setupEffect(); });
            } else {
                stamp(result);
                setupEffect();
            }
        });

        function setupEffect() {
            reactivity.createEffect(render, stamp, { element: wrapper });
        }
    });
});

// ===== Public API =====

function evaluate(src, ctx, args) {
    let body;
    if ('document' in globalScope) {
        body = globalScope.document.body;
    } else {
        body = new HyperscriptModule(args && args.module);
    }

    ctx = Object.assign(runtime.makeContext(body, null, body, null), ctx || {});
    let element = kernel.parse(tokenizer, src);

    if (element && element.errors && element.errors.length > 0) {
        throw new Error(element.errors[0].message + "\n\n" + Parser.formatErrors(element.errors));
    }

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

const _hyperscript = Object.assign(
    evaluate,
    {
        config,

        use(plugin) {
            plugin(_hyperscript)
        },

        internals: {
            tokenizer, runtime, reactivity,
            createParser: (tokens) => new Parser(kernel, tokens),
        },

        addFeature: kernel.addFeature.bind(kernel),
        addCommand: kernel.addCommand.bind(kernel),
        addLeafExpression: kernel.addLeafExpression.bind(kernel),
        addBeforeProcessHook: (fn) => runtime.addBeforeProcessHook(fn),
        addAfterProcessHook: (fn) => runtime.addAfterProcessHook(fn),

        evaluate: evaluate,
        parse: (src) => kernel.parse(tokenizer, src),
        process: (elt) => runtime.processNode(elt),
        processNode: (elt) => runtime.processNode(elt), // deprecated alias
        cleanup: (elt) => runtime.cleanup(elt),
        version: "0.9.90",
    }
);

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
            _hyperscript.process(document.documentElement);
            document.dispatchEvent(new Event("hyperscript:ready"));

            // htmx -> hyperscript: process new htmx content
            var _processingFromHtmx = false;
            globalScope.document.addEventListener("htmx:load", (/** @type {CustomEvent} */ evt) => {
                _processingFromHtmx = true;
                _hyperscript.process(evt.detail.elt);
                _processingFromHtmx = false;
            });
            globalScope.document.addEventListener("htmx:after:process", (/** @type {CustomEvent} */ evt) => {
                _processingFromHtmx = true;
                _hyperscript.process(evt.target);
                _processingFromHtmx = false;
            });

            // hyperscript -> htmx: notify htmx about hyperscript-inserted content
            if (typeof htmx !== 'undefined') {
                _hyperscript.addAfterProcessHook(function(elt) {
                    if (!_processingFromHtmx) htmx.process(elt);
                });
            }
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
