// Reactivity - Automatic dependency tracking for _hyperscript
//
// When an effect is active, reads via resolveSymbol, resolveProperty,
// and resolveAttribute record dependencies. Writes via setSymbol
// notify subscribers. Property and attribute changes are detected
// via DOM events and MutationObserver.

/**
 * A single tracked read, recording what was accessed during expression().
 *
 * @typedef {Object} Dependency
 * @property {string} type      - "symbol" | "property" | "attribute" | "query"
 * @property {string} name      - e.g. "$price", "value", "data-title"
 * @property {string} [scope]   - "global" or "element" (symbol deps only)
 * @property {Element} [element] - Target element (element-scoped/property/attribute deps)
 */

/** Object.is semantics: treats NaN===NaN and distinguishes +0/-0 */
function _sameValue(a, b) {
    // eslint-disable-next-line no-self-compare
    return a === b ? (a !== 0 || 1 / a === 1 / b) : (a !== a && b !== b);
}

/**
 * A reactive effect. Re-runs when its dependencies change.
 * Owns its full lifecycle: initialize, run, stop.
 */
class Effect {
    /**
     * @param {() => any} expression - The watched expression
     * @param {(v: any) => void} handler - Called when value changes
     * @param {Element|null} element - Owner element; auto-stops when disconnected
     * @param {Reactivity} reactivity - The owning reactivity system
     */
    constructor(expression, handler, element, reactivity) {
        // What this effect does
        this.expression = expression; // () => value - the watched expression, re-evaluated on dep change
        this.handler = handler;       // (value) => void - called when expression result changes

        // Where it lives
        this.element = element;
        this._reactivity = reactivity;

        // Tracked state
        this.dependencies = new Map();
        this._lastValue = undefined;
        this._isStopped = false;
        this._consecutiveTriggers = 0;
    }

    /**
     * First evaluation: track deps, subscribe, call handler if non-null.
     * Both undefined and null are treated as "no value yet" to support
     * left-side-wins initialization in bind.
     */
    initialize() {
        var reactivity = this._reactivity;

        // Evaluate expression with tracking enabled - any symbol, property,
        // or attribute reads during this call are recorded as dependencies.
        var prev = reactivity._currentEffect;
        reactivity._currentEffect = this;
        try {
            this._lastValue = this.expression();
        } catch (e) {
            console.error("Error in reactive expression:", e);
        }
        reactivity._currentEffect = prev;

        // Wire up subscriptions so we're notified when dependencies change
        reactivity._subscribeEffect(this);

        // If we got a value, push it to the handler immediately.
        // null/undefined means "no value yet" - skip to let the other
        // side of a bind initialize first (left-side-wins semantics).
        if (this._lastValue != null) {
            try {
                this.handler(this._lastValue);
            } catch (e) {
                console.error("Error in reactive handler:", e);
            }
        }
    }

    /**
     * Re-evaluate expression with dependency tracking, compare with last
     * value, and call handler if changed. Returns false if circular
     * guard tripped (caller should skip this effect).
     * @returns {boolean} Whether the effect ran successfully
     */
    run() {
        this._consecutiveTriggers++;
        if (this._consecutiveTriggers > 100) {
            console.error(
                "Reactivity loop detected: an effect triggered 100 consecutive " +
                "times without settling. This usually means an effect is modifying " +
                "a variable it also depends on.",
                this.element || this
            );
            return false;
        }

        var reactivity = this._reactivity;

        // Unsubscribe from current deps
        reactivity._unsubscribeEffect(this);

        // Re-run expression with tracking
        var oldDeps = this.dependencies;
        this.dependencies = new Map();

        var prev = reactivity._currentEffect;
        reactivity._currentEffect = this;
        var newValue;
        try {
            newValue = this.expression();
        } catch (e) {
            console.error("Error in reactive expression:", e);
            // Restore old dependencies on error
            this.dependencies = oldDeps;
            reactivity._currentEffect = prev;
            reactivity._subscribeEffect(this);
            return true;
        }
        reactivity._currentEffect = prev;

        // Subscribe to new deps
        reactivity._subscribeEffect(this);

        // Clean up empty subscription entries for deps that were dropped
        reactivity._cleanupOrphanedDeps(oldDeps);

        // Compare and fire (Object.is semantics: NaN === NaN, +0 !== -0)
        if (!_sameValue(newValue, this._lastValue)) {
            this._lastValue = newValue;
            try {
                this.handler(newValue);
            } catch (e) {
                console.error("Error in reactive handler:", e);
            }
        }
        return true;
    }

    /** Reset circular guard after cascade settles. */
    resetTriggerCount() {
        this._consecutiveTriggers = 0;
    }

    /** Stop this effect and clean up all subscriptions. */
    stop() {
        if (this._isStopped) return;
        this._isStopped = true;
        this._reactivity._unsubscribeEffect(this);
        this._reactivity._cleanupOrphanedDeps(this.dependencies);
        this._reactivity._pendingEffects.delete(this);
    }
}

export class Reactivity {
    constructor() {
        /** Per-object reactive state, keyed by any object (DOM element or plain JS object) */
        this._objectState = new WeakMap();

        // Symbol subscriptions — global $variables (e.g. $count, $theme)
        // Element-scoped :variables are stored in _getObjectState(element).subscriptions
        this._globalSymbolSubscriptions = new Map();  // symbolName -> Set<Effect>

        // Attribute subscriptions — DOM attributes (@data-theme, @aria-hidden)
        this._attributeSubscriptions = new Map();  // "attrName:elementId" -> Set<Effect>

        // Property subscriptions — JS properties (element.value, element.checked)
        this._propertySubscriptions = new Map();  // elementId -> Set<Effect>

        // Query subscriptions — CSS selector results (<:checked/> in #myTable)
        this._querySubscriptions = new Map();  // root -> Set<Effect>

        /** Next ID to assign to an object for dependency dedup keys */
        this._nextId = 0;

        /** @type {Effect|null} The effect currently being evaluated */
        this._currentEffect = null;

        /** @type {Set<Effect>} Effects waiting to run in the next microtask */
        this._pendingEffects = new Set();

        /** @type {boolean} Whether a microtask is scheduled to run pending effects */
        this._isRunScheduled = false;

    }

    /**
     * Get or create the reactive state object for any object.
     * Assigns a stable unique ID on first access.
     * @param {Object} obj - DOM element or plain JS object
     * @returns {{ id: string, subscriptions: Map|null }}
     */
    _getObjectState(obj) {
        var state = this._objectState.get(obj);
        if (!state) {
            this._objectState.set(obj, state = {
                id: String(++this._nextId),
                subscriptions: null,
            });
        }
        return state;
    }

    /**
     * Whether an effect is currently evaluating its expression().
     * When true, reads (symbol/property/attribute) are recorded as dependencies.
     * @returns {boolean}
     */
    get isTracking() {
        return this._currentEffect !== null;
    }

    /**
     * Track a global variable read as a dependency.
     * @param {string} name - Variable name
     */
    trackGlobalSymbol(name) {
        this._currentEffect.dependencies.set("symbol:global:" + name,
            { type: "symbol", name: name, scope: "global" });
    }

    /**
     * Track an element-scoped variable read as a dependency.
     * @param {string} name - Variable name
     * @param {Element} element - Owning element
     */
    trackElementSymbol(name, element) {
        if (!element) return;
        var elementId = this._getObjectState(element).id;
        this._currentEffect.dependencies.set("symbol:element:" + name + ":" + elementId,
            { type: "symbol", name: name, scope: "element", element: element });
    }

    /**
     * Track a property read as a dependency.
     * Subscription is coarse-grained (one handler per object, not per property),
     * so the dep key uses "*" rather than the property name.
     * @param {Object} obj - DOM element or plain JS object
     * @param {string} name - Property name
     */
    trackProperty(obj, name) {
        if (obj == null || typeof obj !== "object" || obj._hsSkipTracking) return;
        this._currentEffect.dependencies.set("property:" + this._getObjectState(obj).id,
            { type: "property", object: obj, name: name });
    }

    /**
     * Track a DOM attribute read as a dependency.
     * @param {Element} element
     * @param {string} name - Attribute name
     */
    trackAttribute(element, name) {
        if (!(element instanceof Element)) return;
        this._currentEffect.dependencies.set("attribute:" + name + ":" + this._getObjectState(element).id,
            { type: "attribute", element: element, name: name });
    }

    /**
     * Track a DOM query as a dependency. Re-evaluates when any DOM
     * change occurs within root or its descendants.
     * @param {Element|Document} root - the element querySelectorAll runs on (e.g. #myTable in `<:checked/> in #myTable`)
     */
    trackQuery(root) {
        if (!this._currentEffect) return;
        root = root || document;
        var key = "query:" + this._getObjectState(root).id;
        this._currentEffect.dependencies.set(key,
            { type: "query", root: root });
    }

    /**
     * Notify that a global variable was written.
     * @param {string} name - Variable name
     */
    notifyGlobalSymbol(name) {
        var subs = this._globalSymbolSubscriptions.get(name);
        if (subs) {
            for (var effect of subs) {
                this._scheduleEffect(effect);
            }
        }
    }

    /**
     * Notify that an element-scoped variable was written.
     * @param {string} name - Variable name
     * @param {Element} element - Owning element
     */
    notifyElementSymbol(name, element) {
        if (!element) return;
        var state = this._getObjectState(element);
        if (state.subscriptions) {
            var subs = state.subscriptions.get(name);
            if (subs) {
                for (var effect of subs) {
                    this._scheduleEffect(effect);
                }
            }
        }
    }

    /**
     * Notify that a property was written programmatically.
     * Schedules all effects watching properties on this object.
     * @param {Object} obj - DOM element or plain JS object
     */
    notifyProperty(obj) {
        if (obj == null || typeof obj !== "object" || obj._hsSkipTracking) return;
        var state = this._objectState.get(obj);
        if (state) {
            var subs = this._propertySubscriptions.get(state.id);
            if (subs) {
                for (var effect of subs) {
                    this._scheduleEffect(effect);
                }
            }
        }
    }

    /**
     * Add an effect to the pending set.
     * Schedules a microtask to run them if one isn't already scheduled.
     * @param {Effect} effect
     */
    _scheduleEffect(effect) {
        if (effect._isStopped) return;
        this._pendingEffects.add(effect);
        if (!this._isRunScheduled) {
            this._isRunScheduled = true;
            var self = this;
            queueMicrotask(function () { self._runPendingEffects(); });
        }
    }

    /**
     * Set up the single global MutationObserver and delegated input/change
     * listeners that power attribute, property, and query tracking.
     */
    _initGlobalObserver() {
        if (typeof document === "undefined") return;

        if (!this._observer) {
            var reactivity = this;
            this._observer = new MutationObserver(function (mutations) {
                reactivity._handleMutations(mutations);
            });
            this._inputHandler = function (e) { reactivity._handleDOMEvent(e); };
            this._changeHandler = function (e) { reactivity._handleDOMEvent(e); };
        }

        // observe() replaces any prior observation on this target
        this._observer.observe(document, {
            attributes: true,
            childList: true,
            subtree: true
        });

        // addEventListener is idempotent for the same listener+capture combo
        document.addEventListener("input", this._inputHandler, true);
        document.addEventListener("change", this._changeHandler, true);
    }

    /**
     * Handle MutationObserver callbacks. Dispatches to attribute and query
     * subscriptions based on mutation type.
     * @param {MutationRecord[]} mutations
     */
    _handleMutations(mutations) {
        var hasQueries = this._querySubscriptions.size > 0;
        var queryTargets = hasQueries ? new Set() : null;
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            if (mutation.type === "attributes") {
                this._scheduleAttributeEffects(mutation.target, mutation.attributeName);
            }
            if (queryTargets) queryTargets.add(mutation.target);
        }
        if (queryTargets) this._scheduleQueryEffects(queryTargets);
    }

    /**
     * Handle delegated input/change events. Dispatches to property and
     * query subscriptions.
     * @param {Event} event
     */
    _handleDOMEvent(event) {
        var el = event.target;
        if (!(el instanceof Element)) return;
        var state = this._objectState.get(el);
        if (state) {
            var subs = this._propertySubscriptions.get(state.id);
            if (subs) {
                for (var effect of subs) {
                    this._scheduleEffect(effect);
                }
            }
        }
        this._scheduleQueryEffects(el);
    }

    /**
     * Schedule effects watching a specific attribute on a specific element.
     * @param {Element} element
     * @param {string} attrName
     */
    _scheduleAttributeEffects(element, attrName) {
        var state = this._objectState.get(element);
        if (!state) return;
        var key = attrName + ":" + state.id;
        var subs = this._attributeSubscriptions.get(key);
        if (subs) {
            for (var effect of subs) {
                this._scheduleEffect(effect);
            }
        }
    }

    /**
     * Schedule effects with query deps whose root includes any of the mutated elements.
     * @param {Set<Element>|Element} mutated - Element(s) where DOM changes occurred
     */
    _scheduleQueryEffects(mutated) {
        if (this._querySubscriptions.size === 0) return;
        for (var [root, effects] of this._querySubscriptions) {
            if (this._containsTarget(root, mutated)) {
                for (var effect of effects) {
                    this._scheduleEffect(effect);
                }
            }
        }
    }

    /** Check if any of the mutated elements are inside root. */
    _containsTarget(root, mutated) {
        if (mutated instanceof Set) {
            for (var el of mutated) {
                if (root.contains(el)) return true;
            }
            return false;
        }
        return root.contains(mutated);
    }

    /**
     * Run all pending effects. Called once per microtask batch.
     * Effects that re-trigger during this run are queued for the next batch.
     */
    _runPendingEffects() {
        this._isRunScheduled = false;
        // Copy because effects may re-schedule themselves during this run
        var effects = Array.from(this._pendingEffects);
        this._pendingEffects.clear();
        for (var i = 0; i < effects.length; i++) {
            var effect = effects[i];
            if (effect._isStopped) continue;
            // Auto-stop if owning element is disconnected
            if (effect.element && !effect.element.isConnected) {
                effect.stop();
                continue;
            }
            effect.run();
        }
        // Reset trigger counts when the cascade settles (no more pending
        // effects). Legitimate re-triggers on future user events start
        // fresh, while infinite cross-microtask loops accumulate to 100.
        if (this._pendingEffects.size === 0) {
            for (var i = 0; i < effects.length; i++) {
                if (!effects[i]._isStopped) effects[i].resetTriggerCount();
            }
        }
    }

    /**
     * Subscribe an effect to all its current deps.
     * Symbols go into per-element/global subscription maps.
     * Attributes, properties, and queries use flat lookup maps
     * dispatched by the global observer.
     * @param {Effect} effect
     */
    _subscribeEffect(effect) {
        var reactivity = this;
        var needsGlobalObserver = false;

        for (var [depKey, dep] of effect.dependencies) {
            if (dep.type === "symbol" && dep.scope === "global") {
                if (!reactivity._globalSymbolSubscriptions.has(dep.name)) {
                    reactivity._globalSymbolSubscriptions.set(dep.name, new Set());
                }
                reactivity._globalSymbolSubscriptions.get(dep.name).add(effect);

            } else if (dep.type === "symbol" && dep.scope === "element") {
                var state = reactivity._getObjectState(dep.element);
                if (!state.subscriptions) {
                    state.subscriptions = new Map();
                }
                if (!state.subscriptions.has(dep.name)) {
                    state.subscriptions.set(dep.name, new Set());
                }
                state.subscriptions.get(dep.name).add(effect);

            } else if (dep.type === "attribute") {
                var attrState = reactivity._getObjectState(dep.element);
                var attrKey = dep.name + ":" + attrState.id;
                if (!reactivity._attributeSubscriptions.has(attrKey)) {
                    reactivity._attributeSubscriptions.set(attrKey, new Set());
                }
                reactivity._attributeSubscriptions.get(attrKey).add(effect);
                needsGlobalObserver = true;

            } else if (dep.type === "property") {
                var propState = reactivity._getObjectState(dep.object);
                if (!reactivity._propertySubscriptions.has(propState.id)) {
                    reactivity._propertySubscriptions.set(propState.id, new Set());
                }
                reactivity._propertySubscriptions.get(propState.id).add(effect);
                needsGlobalObserver = true;

            } else if (dep.type === "query") {
                if (!reactivity._querySubscriptions.has(dep.root)) {
                    reactivity._querySubscriptions.set(dep.root, new Set());
                }
                reactivity._querySubscriptions.get(dep.root).add(effect);
                needsGlobalObserver = true;
            }
        }

        // Lazily initialize the global observer only when an effect
        // actually depends on DOM state (attributes, properties, or queries).
        // Symbol-only effects (e.g. `when $count changes`) skip this entirely.
        if (needsGlobalObserver) {
            reactivity._initGlobalObserver();
        }
    }

    /** @param {Effect} effect */
    _unsubscribeEffect(effect) {
        var reactivity = this;
        for (var [depKey, dep] of effect.dependencies) {
            if (dep.type === "symbol" && dep.scope === "global") {
                var subs = reactivity._globalSymbolSubscriptions.get(dep.name);
                if (subs) {
                    subs.delete(effect);
                    if (subs.size === 0) {
                        reactivity._globalSymbolSubscriptions.delete(dep.name);
                    }
                }
            } else if (dep.type === "symbol" && dep.scope === "element") {
                var state = reactivity._getObjectState(dep.element);
                if (state.subscriptions) {
                    var subs = state.subscriptions.get(dep.name);
                    if (subs) {
                        subs.delete(effect);
                        if (subs.size === 0) {
                            state.subscriptions.delete(dep.name);
                        }
                    }
                }
            } else if (dep.type === "attribute" && dep.element) {
                var attrState = reactivity._getObjectState(dep.element);
                var attrKey = dep.name + ":" + attrState.id;
                var subs = reactivity._attributeSubscriptions.get(attrKey);
                if (subs) {
                    subs.delete(effect);
                    if (subs.size === 0) {
                        reactivity._attributeSubscriptions.delete(attrKey);
                    }
                }
            } else if (dep.type === "property" && dep.object) {
                var propState = reactivity._getObjectState(dep.object);
                var subs = reactivity._propertySubscriptions.get(propState.id);
                if (subs) {
                    subs.delete(effect);
                    if (subs.size === 0) {
                        reactivity._propertySubscriptions.delete(propState.id);
                    }
                }
            } else if (dep.type === "query") {
                var subs = reactivity._querySubscriptions.get(dep.root);
                if (subs) {
                    subs.delete(effect);
                    if (subs.size === 0) {
                        reactivity._querySubscriptions.delete(dep.root);
                    }
                }
            }
        }
        reactivity._maybeStopGlobalObserver();
    }

    /**
     * Disconnect the global observer and delegated listeners when no
     * effects depend on DOM state (attributes, properties, or queries).
     */
    _maybeStopGlobalObserver() {
        if (!this._observer) return;
        if (this._attributeSubscriptions.size > 0) return;
        if (this._propertySubscriptions.size > 0) return;
        if (this._querySubscriptions.size > 0) return;
        this._observer.disconnect();
        document.removeEventListener("input", this._inputHandler, true);
        document.removeEventListener("change", this._changeHandler, true);
    }

    /**
     * Remove empty entries from subscription maps for deps that were dropped.
     * Query deps need no cleanup here — _unsubscribeEffect handles them directly.
     * @param {Map<string, Dependency>} deps
     */
    _cleanupOrphanedDeps(deps) {
        var reactivity = this;
        for (var [depKey, dep] of deps) {
            if (dep.type === "attribute" && dep.element) {
                var attrState = reactivity._objectState.get(dep.element);
                if (attrState) {
                    var attrKey = dep.name + ":" + attrState.id;
                    var subs = reactivity._attributeSubscriptions.get(attrKey);
                    if (subs && subs.size === 0) {
                        reactivity._attributeSubscriptions.delete(attrKey);
                    }
                }
            } else if (dep.type === "property" && dep.object) {
                var propState = reactivity._objectState.get(dep.object);
                if (propState) {
                    var subs = reactivity._propertySubscriptions.get(propState.id);
                    if (subs && subs.size === 0) {
                        reactivity._propertySubscriptions.delete(propState.id);
                    }
                }
            }
        }
    }

    /**
     * Create a reactive effect with automatic dependency tracking.
     * @param {() => any} expression - The watched expression
     * @param {(value: any) => void} handler - Called when the value changes
     * @param {Object} [options]
     * @param {Element} [options.element] - Auto-stop when element disconnects
     * @returns {() => void} Stop function
     */
    createEffect(expression, handler, options) {
        var effect = new Effect(
            expression,
            handler,
            (options && options.element) || null,
            this
        );

        effect.initialize();

        // Track effect by element for cleanup
        if (effect.element) {
            var data = effect.element._hyperscript ??= {};
            data.effects ??= new Set();
            data.effects.add(effect);
        }

        return function () {
            effect.stop();
        };
    }

    /** Stop all reactive effects owned by an element. */
    stopElementEffects(element) {
        var data = element._hyperscript;
        if (!data || !data.effects) return;
        for (var effect of data.effects) {
            effect.stop();
        }
        delete data.effects;
    }
}

// Reactivity instance is created by Runtime, not here.
// See runtime.js constructor.
