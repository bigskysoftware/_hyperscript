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
 * @property {string} type      - "symbol" | "property" | "attribute"
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
        this.expression = expression; // () => value — the watched expression, re-evaluated on dep change
        this.handler = handler;       // (value) => void — called when expression result changes

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

        // Evaluate expression with tracking enabled — any symbol, property,
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
        // null/undefined means "no value yet" — skip to let the other
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

        // Clean up observers/listeners for deps that were dropped
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

        /**
         * Global symbol subscriptions: symbolName -> Set<Effect>
         * When a global variable is written, all effects in its set are scheduled.
         * @type {Map<string, Set<Effect>>}
         */
        this._globalSubscriptions = new Map();

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
     * @returns {{ id: string, subscriptions: Map|null, propertyHandler: Object|null }}
     */
    _getObjectState(obj) {
        var state = this._objectState.get(obj);
        if (!state) {
            this._objectState.set(obj, state = {
                id: String(++this._nextId),
                subscriptions: null,
                propertyHandler: null,
                attributeObservers: null,
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
     * Notify that a global variable was written.
     * @param {string} name - Variable name
     */
    notifyGlobalSymbol(name) {
        var subs = this._globalSubscriptions.get(name);
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
        if (state && state.propertyHandler) {
            state.propertyHandler.queueAll();
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
     * Symbols go into subscription maps, attributes get MutationObservers,
     * properties use persistent per-element input/change listeners.
     * @param {Effect} effect
     */
    _subscribeEffect(effect) {
        var reactivity = this;

        for (var [depKey, dep] of effect.dependencies) {
            if (dep.type === "symbol" && dep.scope === "global") {
                if (!reactivity._globalSubscriptions.has(dep.name)) {
                    reactivity._globalSubscriptions.set(dep.name, new Set());
                }
                reactivity._globalSubscriptions.get(dep.name).add(effect);

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
                reactivity._subscribeAttributeDependency(dep.element, dep.name, effect);

            } else if (dep.type === "property") {
                reactivity._subscribePropertyDependency(dep.object, dep.name, effect);
            }
        }
    }

    /**
     * Subscribe to a DOM attribute. Sets up a persistent MutationObserver
     * per element+attribute, shared across effects and re-runs.
     * @param {Element} element
     * @param {string} attrName
     * @param {Effect} effect
     */
    _subscribeAttributeDependency(element, attrName, effect) {
        var reactivity = this;
        var state = reactivity._getObjectState(element);

        if (!state.attributeObservers) {
            state.attributeObservers = {};
        }

        if (!state.attributeObservers[attrName]) {
            var trackedEffects = new Set();
            var observer = new MutationObserver(function () {
                for (var eff of trackedEffects) {
                    reactivity._scheduleEffect(eff);
                }
            });
            observer.observe(element, {
                attributes: true,
                attributeFilter: [attrName]
            });
            state.attributeObservers[attrName] = {
                effects: trackedEffects,
                observer: observer
            };
        }
        state.attributeObservers[attrName].effects.add(effect);
    }

    /**
     * Subscribe to a property on an object. For DOM elements, sets up
     * persistent input/change event listeners. For plain objects, only
     * the subscription map is used (notified via setProperty).
     * @param {Object} obj - DOM element or plain JS object
     * @param {string} propName
     * @param {Effect} effect
     */
    _subscribePropertyDependency(obj, propName, effect) {
        var reactivity = this;
        var state = reactivity._getObjectState(obj);

        if (!state.propertyHandler) {
            var trackedEffects = new Set();
            var queueAll = function () {
                for (var eff of trackedEffects) {
                    reactivity._scheduleEffect(eff);
                }
            };

            var remove;
            if (obj instanceof Element) {
                obj.addEventListener("input", queueAll);
                obj.addEventListener("change", queueAll);
                remove = function () {
                    obj.removeEventListener("input", queueAll);
                    obj.removeEventListener("change", queueAll);
                };
            } else {
                remove = function () {};
            }

            state.propertyHandler = {
                effects: trackedEffects,
                queueAll: queueAll,
                remove: remove,
            };
        }
        state.propertyHandler.effects.add(effect);
    }

    /** @param {Effect} effect */
    _unsubscribeEffect(effect) {
        var reactivity = this;
        for (var [depKey, dep] of effect.dependencies) {
            if (dep.type === "symbol" && dep.scope === "global") {
                var subs = reactivity._globalSubscriptions.get(dep.name);
                if (subs) {
                    subs.delete(effect);
                    if (subs.size === 0) {
                        reactivity._globalSubscriptions.delete(dep.name);
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
                var state = reactivity._getObjectState(dep.element);
                if (state.attributeObservers && state.attributeObservers[dep.name]) {
                    state.attributeObservers[dep.name].effects.delete(effect);
                }
            } else if (dep.type === "property" && dep.object) {
                var state = reactivity._getObjectState(dep.object);
                if (state.propertyHandler) {
                    state.propertyHandler.effects.delete(effect);
                }
            }
        }
    }

    /**
     * Clean up MutationObservers and property listeners for deps with no remaining effects.
     * @param {Map<string, Dependency>} deps
     */
    _cleanupOrphanedDeps(deps) {
        var reactivity = this;
        for (var [depKey, dep] of deps) {
            if (dep.type === "attribute" && dep.element) {
                var state = reactivity._getObjectState(dep.element);
                if (state.attributeObservers && state.attributeObservers[dep.name]) {
                    var obs = state.attributeObservers[dep.name];
                    if (obs.effects.size === 0) {
                        obs.observer.disconnect();
                        delete state.attributeObservers[dep.name];
                    }
                }
            } else if (dep.type === "property" && dep.object) {
                var state = reactivity._getObjectState(dep.object);
                if (state.propertyHandler && state.propertyHandler.effects.size === 0) {
                    state.propertyHandler.remove();
                    state.propertyHandler = null;
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
