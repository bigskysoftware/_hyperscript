/**
 * Hyperscript Component Extension
 *
 * Registers custom elements from <template component="tag-name"> definitions.
 * Template bodies are rendered reactively using the existing template engine.
 *
 * Usage:
 *   <template component="my-counter" _="init set ^count to @initial-count as Integer">
 *     <button _="on click increment ^count">Increment</button>
 *     Count: ${^count}
 *   </template>
 *
 *   <my-counter initial-count="5"></my-counter>
 */

import { Tokenizer } from '../core/tokenizer.js';

export default function componentPlugin(_hyperscript) {
    const { runtime, createParser, reactivity } = _hyperscript.internals;
    const tokenizer = new Tokenizer();

    function substituteSlots(templateSource, slotContent, scopeSel) {
        if (!slotContent) return templateSource;

        // Parse slot content to separate named slots from default
        var tmp = document.createElement('div');
        tmp.innerHTML = slotContent;
        var named = {};
        var defaultParts = [];

        // Annotate slotted elements with dom-scope to resolve ^var from outer context
        for (var child of Array.from(tmp.childNodes)) {
            if (child.nodeType === 1 && scopeSel && !child.hasAttribute('dom-scope')) {
                child.setAttribute('dom-scope', 'parent of ' + scopeSel);
            }
            var slotName = child.nodeType === 1 && child.getAttribute('slot');
            if (slotName) {
                child.removeAttribute('slot');
                if (!named[slotName]) named[slotName] = '';
                named[slotName] += child.outerHTML;
            } else {
                defaultParts.push(child.nodeType === 1 ? child.outerHTML :
                                  child.nodeType === 3 ? child.textContent : '');
            }
        }

        var defaultContent = defaultParts.join('');

        // Replace named slots: <slot name="X"/> or <slot name="X"></slot>
        var source = templateSource.replace(
            /<slot\s+name\s*=\s*["']([^"']+)["']\s*\/?\s*>(\s*<\/slot>)?/g,
            function(_, name) { return named[name] || ''; }
        );

        // Replace default slots: <slot/> or <slot></slot>
        source = source.replace(/<slot\s*\/?\s*>(\s*<\/slot>)?/g, defaultContent);

        return source;
    }

    function parseArg(componentEl, prop) {
        if (typeof prop !== 'string') return null;
        var cache = componentEl._attrsCache || (componentEl._attrsCache = {});
        if (!cache[prop]) {
            var attrValue = componentEl.getAttribute(prop);
            if (attrValue == null) return null;
            try {
                cache[prop] = createParser(tokenizer.tokenize(attrValue)).requireElement("expression");
            } catch (e) {
                console.error("component: failed to parse attrs." + prop + ":", e.message);
                return null;
            }
        }
        return cache[prop];
    }

    function parentContext(componentEl) {
        var parent = componentEl.parentElement;
        return parent ? runtime.makeContext(parent, null, parent, null) : null;
    }

    /** Create an `attrs` proxy that lazily evaluates attribute strings as hyperscript in the parent scope */
    function createAttrs(componentEl) {
        return new Proxy({ _hsSkipTracking: true }, {
            get: function(_, prop) {
                if (prop === '_hsSkipTracking') return true;
                if (typeof prop !== 'string' || prop.startsWith('_')) return undefined;
                var expr = parseArg(componentEl, prop);
                if (!expr) return undefined;
                var ctx = parentContext(componentEl);
                return ctx ? expr.evaluate(ctx) : undefined;
            },
            set: function(_, prop, value) {
                var expr = parseArg(componentEl, prop);
                if (!expr || !expr.set) return false;
                var ctx = parentContext(componentEl);
                if (!ctx) return false;
                var lhs = {};
                if (expr.lhs) {
                    for (var key in expr.lhs) {
                        var e = expr.lhs[key];
                        lhs[key] = e && e.evaluate ? e.evaluate(ctx) : e;
                    }
                }
                expr.set(ctx, lhs, value);
                return true;
            }
        });
    }

    function registerComponent(templateEl, componentScript) {
        const tagName = templateEl.getAttribute('component');
        if (!tagName.includes('-')) {
            console.error("component name must contain a dash: '" + tagName + "'");
            return;
        }

        // Extract <style> blocks from the raw text, wrap in @scope (tag-name),
        // and insert a single combined <style> right after the definition element.
        var raw = templateEl.textContent;
        var combined = '';
        var styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        var match;
        while ((match = styleRegex.exec(raw)) !== null) {
            combined += match[1] + '\n';
        }
        if (combined) {
            raw = raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            templateEl.textContent = raw;
        }
        if (combined) {
            var scopedStyle = document.createElement('style');
            scopedStyle.textContent = '@scope (' + tagName + ') {\n' + combined + '}';
            templateEl.insertAdjacentElement('afterend', scopedStyle);
        }

        const templateSource = templateEl.textContent;

        // Parse template once to validate - actual rendering happens per instance
        // (We reuse the render command's approach: tokenize in "lines" mode at render time)

        const ComponentClass = class extends HTMLElement {
            connectedCallback() {
                // Skip if already initialized
                if (this._hypercomp_initialized) return;
                this._hypercomp_initialized = true;

                // Isolate component scope - ^var resolution stops here
                this.setAttribute('dom-scope', 'isolated');

                // Capture slot content and clear children immediately,
                // before processNode can recurse into them
                this._slotContent = this.innerHTML;
                this.innerHTML = '';

                // 1. Inject `attrs` proxy into element scope, then apply component-level hyperscript
                var internalData = runtime.getInternalData(this);
                if (!internalData.elementScope) internalData.elementScope = {};
                internalData.elementScope.attrs = createAttrs(this);

                if (componentScript) {
                    this.setAttribute('_', componentScript);
                    _hyperscript.process(this);
                }

                // 2. Render template after synchronous init completes
                const self = this;
                var source = substituteSlots(templateSource, self._slotContent, tagName);

                queueMicrotask(function() {
                    // Initial render - may return a promise if template has async expressions
                    var result = self._renderTemplate(source);
                    if (result && result.then) {
                        result.then(function(html) {
                            self._stampTemplate(html);
                            self._setupReactiveEffect(source);
                        });
                    } else {
                        self._stampTemplate(result);
                        self._setupReactiveEffect(source);
                    }
                });
            }

            disconnectedCallback() {
                reactivity.stopElementEffects(this);
                runtime.cleanup(this);
                this._hypercomp_initialized = false;
                this._hypercomp_stamped = false;
            }

            _setupReactiveEffect(source) {
                var self = this;
                reactivity.createEffect(
                    function() { return self._renderTemplate(source); },
                    function(html) { self._stampTemplate(html); },
                    { element: self }
                );
            }

            _renderTemplate(source) {
                // Reuse the existing template rendering infrastructure:
                // tokenize in "lines" mode, parse as command list, execute to collect string output
                var ctx = runtime.makeContext(this, null, this, null);

                var buf = [];
                ctx.meta.__ht_template_result = buf;

                var tokens = tokenizer.tokenize(source, "lines");
                var parser = createParser(tokens);
                var commandList;
                try {
                    commandList = parser.parseElement("commandList");
                    parser.ensureTerminated(commandList);
                } catch (e) {
                    console.error("hypercomp template parse error:", e.message || e);
                    return "";
                }

                var resolve, reject;
                var promise = new Promise(function(res, rej) { resolve = res; reject = rej; });

                commandList.execute(ctx);
                this.__hs_scopes = ctx.meta.__ht_scopes || null;

                // Sync case - command list completed without going async
                if (ctx.meta.returned || !ctx.meta.resolve) {
                    return buf.join("");
                }

                // Async case - stash resolve/reject, return promise
                ctx.meta.resolve = resolve;
                ctx.meta.reject = reject;
                return promise.then(function() { return buf.join(""); });
            }

            _stampTemplate(html) {
                if (!this._hypercomp_stamped) {
                    // First render - just set innerHTML and process
                    this.innerHTML = html;
                    _hyperscript.process(this);
                    this._hypercomp_stamped = true;
                } else {
                    // Subsequent renders - morph to preserve DOM identity
                    runtime.morph(this, html);
                }
            }
        };

        customElements.define(tagName, ComponentClass);
    }

    var registered = new Set();

    // Always strip _ to prevent normal processNode from running it on the template
    _hyperscript.addBeforeProcessHook(function(elt) {
        if (!elt || !elt.querySelectorAll) return;
        elt.querySelectorAll('script[type="text/hyperscript-template"][component]').forEach(function(tmpl) {
            if (tmpl._componentScript != null) return;
            tmpl._componentScript = tmpl.getAttribute('_') || '';
            tmpl.removeAttribute('_');
        });
    });

    // register components after processing so symbols are available
    _hyperscript.addAfterProcessHook(function(elt) {
        if (!elt || !elt.querySelectorAll) return;
        elt.querySelectorAll('script[type="text/hyperscript-template"][component]').forEach(function(tmpl) {
            var tagName = tmpl.getAttribute('component');
            if (!registered.has(tagName) && !customElements.get(tagName)) {
                registered.add(tagName);
                registerComponent(tmpl, tmpl._componentScript || '');
            }
        });
    });
}

// Auto-register when loaded via script tag
if (typeof self !== 'undefined' && self._hyperscript) {
    self._hyperscript.use(componentPlugin);
}
