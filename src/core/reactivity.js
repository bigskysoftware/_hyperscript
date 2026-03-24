// Reactivity - Automatic dependency tracking for _hyperscript
//
// When an effect is active, reads via resolveSymbol, resolveProperty,
// and resolveAttribute record dependencies. Writes via setSymbol
// notify subscribers. Property and attribute changes are detected
// via DOM events and MutationObserver.

/**
 * @typedef {Object} EffectHandle
 * @property {() => any} computeFn - Tracked computation function
 * @property {(newValue: any) => void} effectFn - Called when value changes
 * @property {Map<string, DepRecord>} deps - depKey -> structured record (dedup + data)
 * @property {any} oldValue - Last computed value (for same-value dedup)
 * @property {Element|null} element - Owning element (for lifecycle)
 * @property {boolean} disposed - Whether this effect has been cleaned up
 * @property {Array<Function>} subscriptions - Active teardown functions
 * @property {number} _triggerCount - Circular dependency guard counter
 *
 * @typedef {Object} DepRecord
 * @property {string} type - "symbol" | "property" | "attribute"
 * @property {string} name - Symbol/property/attribute name
 * @property {string} [scope] - "global" or "element" (for symbol deps)
 * @property {Element} [element] - Target element (for element-scoped deps)
 */

export class Reactivity {
    /**
     * @param {Object} runtime - The Runtime instance
     */
    constructor(runtime) {
        this.runtime = runtime;

        /** @type {EffectHandle|null} Currently tracking effect */
        this._activeEffect = null;

        /** @type {Set<EffectHandle>} Effects queued for the current microtask */
        this._effectQueue = new Set();

        /** @type {boolean} Whether a microtask flush is scheduled */
        this._effectScheduled = false;

        /**
         * Global symbol subscriptions: symbolName -> Set<EffectHandle>
         * When setSymbol writes a global, all effects in the set are queued.
         * @type {Map<string, Set<EffectHandle>>}
         */
        this._globalSubscriptions = new Map();

        /** @type {number} Counter for assigning stable IDs to elements */
        this._elementIdCounter = 0;
    }

    /**
     * @param {Element} elt
     * @returns {string}
     */
    _getElementId(elt) {
        var internalData = this.runtime.getInternalData(elt);
        if (!internalData.reactiveId) {
            internalData.reactiveId = String(++this._elementIdCounter);
        }
        return internalData.reactiveId;
    }

    /**
     * @param {string} key
     * @param {DepRecord} record
     */
    _trackDep(key, record) {
        this._activeEffect.deps.set(key, record);
    }

    /**
     * @param {string} name
     * @param {string} scope
     * @param {Context} context
     */
    _trackSymbol(name, scope, context) {
        if (scope === "global") {
            this._trackDep("symbol:global:" + name,
                { type: "symbol", name: name, scope: "global" });
        } else if (scope === "element" && context.meta && context.meta.owner) {
            var elt = context.meta.owner;
            var eltId = this._getElementId(elt);
            this._trackDep("symbol:element:" + name + ":" + eltId,
                { type: "symbol", name: name, scope: "element", element: elt });
        }
    }

    /**
     * Track an element-level dependency (property or attribute).
     * Deduplicates via the deps Map key.
     * @param {string} trackingType - "property" or "attribute"
     * @param {Element} element - Target element
     * @param {string} name - Property/attribute name
     */
    _trackElementDep(trackingType, element, name) {
        var key = trackingType + ":" + name + ":" + this._getElementId(element);
        this._trackDep(key, { type: trackingType, element: element, name: name });
    }

    /**
     * @param {string} name
     * @param {string} scope
     * @param {Context} context
     */
    _notifySymbolSubscribers(name, scope, context) {
        if (scope === "global") {
            var subs = this._globalSubscriptions.get(name);
            if (subs) {
                for (var effect of subs) {
                    this._queueEffect(effect);
                }
            }
        } else if (scope === "element" && context.meta && context.meta.owner) {
            var elt = context.meta.owner;
            var internalData = this.runtime.getInternalData(elt);
            if (internalData.reactiveSubscriptions) {
                var subs = internalData.reactiveSubscriptions.get(name);
                if (subs) {
                    for (var effect of subs) {
                        this._queueEffect(effect);
                    }
                }
            }
        }
    }

    /** @param {EffectHandle} effect */
    _queueEffect(effect) {
        if (effect.disposed) return;
        this._effectQueue.add(effect);
        if (!this._effectScheduled) {
            this._effectScheduled = true;
            var self = this;
            queueMicrotask(function () { self._flushEffects(); });
        }
    }

    /** Flush all queued effects. */
    _flushEffects() {
        this._effectScheduled = false;
        // Copy the queue - effects may re-queue themselves
        var effects = Array.from(this._effectQueue);
        this._effectQueue.clear();
        for (var effect of effects) {
            if (effect.disposed) continue;
            // Auto-dispose if owning element is disconnected
            if (effect.element && !effect.element.isConnected) {
                this.disposeEffect(effect);
                continue;
            }
            // Circular dependency guard: count accumulates across microtask
            // flushes so cross-microtask ping-pong (effect writes to own dep)
            // is caught. Reset happens below when the cascade settles.
            effect._triggerCount++;
            if (effect._triggerCount > 100) {
                console.warn("Reactive effect triggered >100 times, stopping:", effect);
                continue;
            }
            this._runEffect(effect);
        }
        // Reset trigger counts when the cascade settles (no more pending
        // effects). Legitimate re-triggers on future user events start
        // fresh, while infinite cross-microtask loops accumulate to 100.
        if (this._effectQueue.size === 0) {
            for (var i = 0; i < effects.length; i++) {
                if (!effects[i].disposed) effects[i]._triggerCount = 0;
            }
        }
    }

    /** @param {EffectHandle} effect */
    _runEffect(effect) {
        // Unsubscribe from current deps
        this._unsubscribeEffect(effect);

        // Re-run compute with tracking
        var oldDeps = effect.deps;
        effect.deps = new Map();

        var prev = this._activeEffect;
        this._activeEffect = effect;
        var newValue;
        try {
            newValue = effect.computeFn();
        } catch (e) {
            console.error("Error in reactive compute:", e);
            // Restore old deps on error
            effect.deps = oldDeps;
            this._activeEffect = prev;
            this._subscribeEffect(effect);
            return;
        }
        this._activeEffect = prev;

        // Subscribe to new deps
        this._subscribeEffect(effect);

        // Compare and fire
        if (newValue !== effect.oldValue) {
            effect.oldValue = newValue;
            try {
                effect.effectFn(newValue);
            } catch (e) {
                console.error("Error in reactive effect:", e);
            }
        }
    }

    /**
     * Subscribe an effect to all its current deps.
     * Symbols go into subscription maps, attributes get MutationObservers,
     * properties use persistent per-element input/change listeners.
     * @param {EffectHandle} effect
     */
    _subscribeEffect(effect) {
        var reactivity = this;

        // Iterate the unified deps Map - each value carries structured data
        for (var [depKey, dep] of effect.deps) {
            if (dep.type === "symbol" && dep.scope === "global") {
                if (!this._globalSubscriptions.has(dep.name)) {
                    this._globalSubscriptions.set(dep.name, new Set());
                }
                this._globalSubscriptions.get(dep.name).add(effect);

            } else if (dep.type === "symbol" && dep.scope === "element") {
                var internalData = this.runtime.getInternalData(dep.element);
                if (!internalData.reactiveSubscriptions) {
                    internalData.reactiveSubscriptions = new Map();
                }
                if (!internalData.reactiveSubscriptions.has(dep.name)) {
                    internalData.reactiveSubscriptions.set(dep.name, new Set());
                }
                internalData.reactiveSubscriptions.get(dep.name).add(effect);

            } else if (dep.type === "attribute") {
                // MutationObserver for attribute changes
                var observer = new MutationObserver(function () {
                    reactivity._queueEffect(effect);
                });
                observer.observe(dep.element, {
                    attributes: true,
                    attributeFilter: [dep.name]
                });
                effect.subscriptions.push(function () {
                    observer.disconnect();
                });

            } else if (dep.type === "property") {
                reactivity._subscribePropertyDep(dep.element, dep.name, effect);
            }
        }
    }

    /**
     * Subscribe to a DOM element property. Sets up persistent per-element
     * event listeners and defineProperty interception. Extracted into its
     * own method to create proper closure scope for each element/property.
     * @param {Element} el
     * @param {string} propName
     * @param {EffectHandle} effect
     */
    _subscribePropertyDep(el, propName, effect) {
        var reactivity = this;
        var elData = this.runtime.getInternalData(el);

        // Persistent per-element handler: set up once, shared by all
        // effects on this element. Survives re-tracking to avoid
        // adding/removing listeners while the browser is still
        // dispatching the event that triggered the re-track.
        if (!elData.reactivePropertyHandler) {
            var trackedEffects = new Set();
            var queueAll = function () {
                for (var eff of trackedEffects) {
                    reactivity._queueEffect(eff);
                }
            };

            // Event listeners catch user interactions (typing, spinners,
            // selects, checkboxes). Set dedup prevents double-processing
            // when both input and change fire for the same interaction.
            el.addEventListener("input", queueAll);
            el.addEventListener("change", queueAll);

            elData.reactivePropertyHandler = {
                effects: trackedEffects,
                queueAll: queueAll,
                intercepted: {},
                remove: function () {
                    el.removeEventListener("input", queueAll);
                    el.removeEventListener("change", queueAll);
                }
            };
        }
        elData.reactivePropertyHandler.effects.add(effect);

        // defineProperty interception catches programmatic el.value = x
        // assignments (no event fires for those). Persistent per property.
        var handler = elData.reactivePropertyHandler;
        if (!handler.intercepted[propName]) {
            var desc =
                Object.getOwnPropertyDescriptor(el, propName) ||
                Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), propName);
            if (desc && (desc.set || desc.writable !== false)) {
                var origGet = desc.get;
                var origSet = desc.set;
                var storedValue = desc.value;
                var notify = handler.queueAll;
                Object.defineProperty(el, propName, {
                    get: function () {
                        return origGet ? origGet.call(this) : storedValue;
                    },
                    set: function (v) {
                        if (origSet) origSet.call(this, v);
                        else storedValue = v;
                        notify();
                    },
                    enumerable: desc.enumerable !== false,
                    configurable: true
                });
                handler.intercepted[propName] = desc;
            }
        }
    }

    /** @param {EffectHandle} effect */
    _unsubscribeEffect(effect) {
        // Remove from symbol subscriptions (global and element-scoped)
        for (var [depKey, dep] of effect.deps) {
            if (dep.type === "symbol" && dep.scope === "global") {
                var subs = this._globalSubscriptions.get(dep.name);
                if (subs) {
                    subs.delete(effect);
                    if (subs.size === 0) {
                        this._globalSubscriptions.delete(dep.name);
                    }
                }
            } else if (dep.type === "symbol" && dep.scope === "element") {
                var internalData = this.runtime.getInternalData(dep.element);
                if (internalData.reactiveSubscriptions) {
                    var subs = internalData.reactiveSubscriptions.get(dep.name);
                    if (subs) {
                        subs.delete(effect);
                        if (subs.size === 0) {
                            internalData.reactiveSubscriptions.delete(dep.name);
                        }
                    }
                }
            } else if (dep.type === "property" && dep.element) {
                var elData = this.runtime.getInternalData(dep.element);
                if (elData.reactivePropertyHandler) {
                    elData.reactivePropertyHandler.effects.delete(effect);
                }
            }
        }
        // Run teardown functions (MutationObservers only — property listeners are persistent)
        for (var teardown of effect.subscriptions) {
            try { teardown(); } catch (e) { /* ignore cleanup errors */ }
        }
        effect.subscriptions = [];
    }

    /**
     * Create a reactive effect with automatic dependency tracking.
     * computeFn is evaluated while recording reads. When any tracked
     * dependency changes, computeFn re-evaluates and effectFn fires
     * if the result changed (===).
     *
     * @param {() => any} computeFn
     * @param {(newValue: any) => void} effectFn
     * @param {Object} [options]
     * @param {Element} [options.element] - auto-dispose on disconnect
     * @returns {() => void} dispose function
     */
    createEffect(computeFn, effectFn, options) {
        var effect = {
            computeFn: computeFn,
            effectFn: effectFn,
            deps: new Map(),
            oldValue: undefined,
            element: (options && options.element) || null,
            disposed: false,
            subscriptions: [],
            _triggerCount: 0,
        };

        // Initial tracked evaluation
        var prev = this._activeEffect;
        this._activeEffect = effect;
        try {
            effect.oldValue = computeFn();
        } catch (e) {
            console.error("Error in reactive compute:", e);
        }
        this._activeEffect = prev;

        // Subscribe to tracked deps
        this._subscribeEffect(effect);

        // Initial sync: if value already exists, fire effectFn immediately
        if (effect.oldValue !== undefined) {
            try {
                effectFn(effect.oldValue);
            } catch (e) {
                console.error("Error in reactive effect:", e);
            }
        }

        var reactivity = this;
        return function dispose() {
            reactivity.disposeEffect(effect);
        };
    }

    /** @param {EffectHandle} effect */
    disposeEffect(effect) {
        if (effect.disposed) return;
        effect.disposed = true;
        this._unsubscribeEffect(effect);
        // Clean up per-element listeners and interceptions if no effects remain
        for (var [depKey, dep] of effect.deps) {
            if (dep.type === "property" && dep.element) {
                var elData = this.runtime.getInternalData(dep.element);
                var handler = elData.reactivePropertyHandler;
                if (handler && handler.effects.size === 0) {
                    handler.remove();
                    // Restore original property descriptors
                    for (var prop in handler.intercepted) {
                        Object.defineProperty(dep.element, prop, handler.intercepted[prop]);
                    }
                    delete elData.reactivePropertyHandler;
                }
            }
        }
        this._effectQueue.delete(effect);
    }
}
