/**
 * HtmxCompat - hyperscript/htmx integration layer
 *
 * Handles bidirectional processing (htmx content → hyperscript, hyperscript content → htmx)
 * and the hs-include extension for bridging element variables into htmx requests.
 */
export class HtmxCompat {

    #processingFromHtmx = false;

    constructor(globalScope, hyperscript) {
        this.globalScope = globalScope;
        this.hyperscript = hyperscript;
    }

    init() {
        var self = this;
        var globalScope = this.globalScope;
        var _hyperscript = this.hyperscript;

        // htmx -> hyperscript: process new htmx content
        globalScope.document.addEventListener("htmx:load", function (evt) {
            self.#processingFromHtmx = true;
            _hyperscript.process(evt.detail.elt);
            self.#processingFromHtmx = false;
        });
        globalScope.document.addEventListener("htmx:after:process", function (evt) {
            self.#processingFromHtmx = true;
            _hyperscript.process(evt.target);
            self.#processingFromHtmx = false;
        });

        // hyperscript -> htmx: notify htmx about hyperscript-inserted content
        if (typeof htmx !== 'undefined') {
            _hyperscript.addAfterProcessHook(function (elt) {
                if (!self.#processingFromHtmx) htmx.process(elt);
            });

            // hs-include: bridge hyperscript element variables into htmx requests (htmx 4+ only)
            if (htmx.version?.startsWith('4')) {
                htmx.registerExtension('hs-include', {
                    htmx_config_request: function (elt, detail) {
                        var ctx = detail?.ctx;
                        if (!ctx) return;
                        var sourceElt = ctx.sourceElement || elt;

                        var found = HtmxCompat.#findHsInclude(sourceElt);
                        if (!found) return;

                        var vars = HtmxCompat.#resolveSpecifiers(found.value, found.scopeElt);
                        var body = ctx.request?.body;
                        if (body instanceof FormData) {
                            for (var k in vars) body.set(k, vars[k]);
                        }
                    }
                });
            }
        }
    }

    // ----- hs-include helpers -----

    static #findHsInclude(sourceElt) {
        var attr = sourceElt.getAttribute('hs-include');
        if (attr !== null) return { value: attr, scopeElt: sourceElt };
        var elt = sourceElt.parentElement;
        while (elt) {
            attr = elt.getAttribute('hs-include:inherited');
            if (attr !== null) return { value: attr, scopeElt: elt };
            elt = elt.parentElement;
        }
        return null;
    }

    static #readScope(elt) {
        return elt?._hyperscript?.elementScope || {};
    }

    static #serialize(value) {
        if (value == null) return '';
        if (typeof value === 'object') {
            try { return JSON.stringify(value); }
            catch (_) { return ''; }
        }
        return String(value);
    }

    static #resolveInherited(scopeKey, startElt) {
        var elt = startElt;
        while (elt) {
            var scope = elt._hyperscript?.elementScope;
            if (scope && scopeKey in scope) return scope[scopeKey];
            elt = elt.parentElement;
        }
    }

    static #resolveSpecifiers(attrValue, scopeElt) {
        var result = {};
        var raw = attrValue.trim();

        if (raw === '*') {
            var scope = this.#readScope(scopeElt);
            for (var k in scope) {
                if (Object.prototype.hasOwnProperty.call(scope, k)) {
                    result[k[0] === ':' ? k.slice(1) : k] = this.#serialize(scope[k]);
                }
            }
            return result;
        }

        var self = this;
        raw.split(',').forEach(function (part) {
            part = part.trim();
            if (!part) return;
            if (part[0] === ':') {
                var name = part.slice(1);
                var scope = self.#readScope(scopeElt);
                var scopeKey = ':' + name;
                if (scopeKey in scope) result[name] = self.#serialize(scope[scopeKey]);
            } else if (part[0] === '^') {
                var name = part.slice(1);
                var val = self.#resolveInherited(':' + name, scopeElt);
                if (val !== undefined) result[name] = self.#serialize(val);
            } else if (part[0] === '#') {
                var colonIdx = part.lastIndexOf(':');
                if (colonIdx > 0) {
                    var selector = part.slice(0, colonIdx);
                    var name = part.slice(colonIdx + 1);
                    var targetElt = document.querySelector(selector);
                    if (targetElt) {
                        var scope = self.#readScope(targetElt);
                        var scopeKey = ':' + name;
                        if (scopeKey in scope) result[name] = self.#serialize(scope[scopeKey]);
                    }
                }
            }
        });
        return result;
    }
}
