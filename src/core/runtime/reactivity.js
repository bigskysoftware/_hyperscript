// Reactivity - Automatic dependency tracking for _hyperscript
//
// When an effect is active, reads via resolveSymbol, resolveProperty,
// and resolveAttribute record dependencies. Writes via setSymbol
// notify subscribers. Property and attribute changes are detected
// via DOM events and MutationObserver.

/**
 * A reactive effect. Re-runs when its dependencies change.
 *
 * @typedef {Object} Effect
 * @property {() => any} expression     - The watched expression.       e.g. () => $price * $qty
 * @property {(v: any) => void} handler - Called when value changes.   e.g. (newValue) => { put newValue into me }
 * @property {Map<string, Dependency>} dependencies - What was read during expression().  e.g. { "symbol:global:$price" => {type:"symbol", ...} }
 * @property {Element|null} element    - Owner element; auto-stops when element disconnects
 * @property {boolean} isStopped       - True after stopEffect(); skips all further processing
 * @property {any} _lastExpressionValue - Last result of expression(), used to skip unchanged
 * @property {number} _consecutiveTriggers    - Counts consecutive triggers; stops runaway loops at 100
 *
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

/** Per-object reactive state, keyed by any object (DOM element or plain JS object) */
const objectState = new WeakMap();

/**
 * Global symbol subscriptions: symbolName -> Set<Effect>
 * When a global variable is written, all effects in its set are scheduled.
 * @type {Map<string, Set<Effect>>}
 */
const globalSubscriptions = new Map();

/** Next ID to assign to an object for dependency dedup keys */
let nextId = 0;

/**
 * Get or create the reactive state object for any object.
 * Assigns a stable unique ID on first access.
 * @param {Object} obj - DOM element or plain JS object
 * @returns {{ id: string, subscriptions: Map|null, propertyHandler: Object|null }}
 */
function getObjectState(obj) {
    var state = objectState.get(obj);
    if (!state) {
        objectState.set(obj, state = {
            id: String(++nextId),
            subscriptions: null,
            propertyHandler: null,
            attributeObservers: null,
        });
    }
    return state;
}

export class Reactivity {
    constructor() {
        /** @type {Effect|null} The effect currently being evaluated */
        this._currentEffect = null;

        /** @type {Set<Effect>} Effects waiting to run in the next microtask */
        this._pendingEffects = new Set();

        /** @type {WeakMap<Element, Set<Effect>>} Effects by owning element */
        this._elementEffects = new WeakMap();

        /** @type {boolean} Whether a microtask is scheduled to run pending effects */
        this._isRunScheduled = false;
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
        // e.g. deps.set("symbol:global:$count", { type: "symbol", name: "$count", scope: "global" })
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
        var elementId = getObjectState(element).id;
        // e.g. deps.set("symbol:element::count:3", { type: "symbol", name: ":count", scope: "element", element: <div> })
        this._currentEffect.dependencies.set("symbol:element:" + name + ":" + elementId,
            { type: "symbol", name: name, scope: "element", element: element });
    }

    /**
     * Track a property read as a dependency.
     * @param {Object} obj - DOM element or plain JS object
     * @param {string} name - Property name
     */
    trackProperty(obj, name) {
        if (obj == null || typeof obj !== "object") return;
        this._currentEffect.dependencies.set("property:" + name + ":" + getObjectState(obj).id,
            { type: "property", object: obj, name: name });
    }

    /**
     * Track a DOM attribute read as a dependency.
     * @param {Element} element
     * @param {string} name - Attribute name
     */
    trackAttribute(element, name) {
        if (!(element instanceof Element)) return;
        // e.g. deps.set("attribute:data-title:2", { type: "attribute", element: <div>, name: "data-title" })
        this._currentEffect.dependencies.set("attribute:" + name + ":" + getObjectState(element).id,
            { type: "attribute", element: element, name: name });
    }

    /**
     * Notify that a global variable was written.
     * @param {string} name - Variable name
     */
    notifyGlobalSymbol(name) {
        var subs = globalSubscriptions.get(name);
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
        var state = getObjectState(element);
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
        if (obj == null || typeof obj !== "object") return;
        var state = objectState.get(obj);
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
        if (effect.isStopped) return;
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
        for (var effect of effects) {
            if (effect.isStopped) continue;
            // Auto-stop if owning element is disconnected
            if (effect.element && !effect.element.isConnected) {
                this.stopEffect(effect);
                continue;
            }
            // Circular dependency guard: count accumulates across microtask
            // flushes so cross-microtask ping-pong (effect writes to own dep)
            // is caught. Reset happens below when the cascade settles.
            effect._consecutiveTriggers++;
            if (effect._consecutiveTriggers > 100) {
                console.error(
                    "Reactivity loop detected: an effect triggered 100 consecutive " +
                    "times without settling. This usually means an effect is modifying " +
                    "a variable it also depends on.",
                    effect.element || effect
                );
                continue;
            }
            this._runEffect(effect);
        }
        // Reset trigger counts when the cascade settles (no more pending
        // effects). Legitimate re-triggers on future user events start
        // fresh, while infinite cross-microtask loops accumulate to 100.
        if (this._pendingEffects.size === 0) {
            for (var i = 0; i < effects.length; i++) {
                if (!effects[i].isStopped) effects[i]._consecutiveTriggers = 0;
            }
        }
    }

    /** @param {Effect} effect */
    _runEffect(effect) {
        // Unsubscribe from current deps
        this._unsubscribeEffect(effect);

        // Re-run expression with tracking
        var oldDeps = effect.dependencies;
        effect.dependencies = new Map();

        var prev = this._currentEffect;
        this._currentEffect = effect;
        var newValue;
        try {
            newValue = effect.expression();
        } catch (e) {
            console.error("Error in reactive expression:", e);
            // Restore old dependencies on error
            effect.dependencies = oldDeps;
            this._currentEffect = prev;
            this._subscribeEffect(effect);
            return;
        }
        this._currentEffect = prev;

        // Subscribe to new deps
        this._subscribeEffect(effect);

        // Compare and fire (Object.is semantics: NaN === NaN, +0 !== -0)
        if (!_sameValue(newValue, effect._lastExpressionValue)) {
            effect._lastExpressionValue = newValue;
            try {
                effect.handler(newValue);
            } catch (e) {
                console.error("Error in reactive handler:", e);
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
                if (!globalSubscriptions.has(dep.name)) {
                    globalSubscriptions.set(dep.name, new Set());
                }
                globalSubscriptions.get(dep.name).add(effect);

            } else if (dep.type === "symbol" && dep.scope === "element") {
                var state = getObjectState(dep.element);
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
        var state = getObjectState(element);

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
        var state = getObjectState(obj);

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
        for (var [depKey, dep] of effect.dependencies) {
            if (dep.type === "symbol" && dep.scope === "global") {
                var subs = globalSubscriptions.get(dep.name);
                if (subs) {
                    subs.delete(effect);
                    if (subs.size === 0) {
                        globalSubscriptions.delete(dep.name);
                    }
                }
            } else if (dep.type === "symbol" && dep.scope === "element") {
                var state = getObjectState(dep.element);
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
                var state = getObjectState(dep.element);
                if (state.attributeObservers && state.attributeObservers[dep.name]) {
                    state.attributeObservers[dep.name].effects.delete(effect);
                }
            } else if (dep.type === "property" && dep.object) {
                var state = getObjectState(dep.object);
                if (state.propertyHandler) {
                    state.propertyHandler.effects.delete(effect);
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
        var effect = {
            expression: expression,
            handler: handler,
            dependencies: new Map(),
            _lastExpressionValue: undefined,
            element: (options && options.element) || null,
            isStopped: false,
            _consecutiveTriggers: 0,
        };

        // Initial tracked evaluation
        var prev = this._currentEffect;
        this._currentEffect = effect;
        try {
            effect._lastExpressionValue = expression();
        } catch (e) {
            console.error("Error in reactive expression:", e);
        }
        this._currentEffect = prev;

        // Subscribe to tracked dependencies
        this._subscribeEffect(effect);

        // Track effect by element for cleanup
        if (effect.element) {
            var set = this._elementEffects.get(effect.element);
            if (!set) {
                set = new Set();
                this._elementEffects.set(effect.element, set);
            }
            set.add(effect);
        }

        // Initial sync: if value already exists, call handler immediately.
        // Both undefined and null are treated as "no value yet" to support
        // left-side-wins initialization in bind.
        if (effect._lastExpressionValue != null) {
            try {
                handler(effect._lastExpressionValue);
            } catch (e) {
                console.error("Error in reactive handler:", e);
            }
        }

        var reactivity = this;
        return function stop() {
            reactivity.stopEffect(effect);
        };
    }

    /** @param {Effect} effect */
    stopEffect(effect) {
        if (effect.isStopped) return;
        effect.isStopped = true;
        this._unsubscribeEffect(effect);
        // Clean up per-element listeners and observers if no effects remain
        for (var [depKey, dep] of effect.dependencies) {
            if (dep.type === "attribute" && dep.element) {
                var state = getObjectState(dep.element);
                if (state.attributeObservers && state.attributeObservers[dep.name]) {
                    var obs = state.attributeObservers[dep.name];
                    if (obs.effects.size === 0) {
                        obs.observer.disconnect();
                        delete state.attributeObservers[dep.name];
                    }
                }
            } else if (dep.type === "property" && dep.object) {
                var state = getObjectState(dep.object);
                if (state.propertyHandler && state.propertyHandler.effects.size === 0) {
                    state.propertyHandler.remove();
                    state.propertyHandler = null;
                }
            }
        }
        this._pendingEffects.delete(effect);
    }

    /** Stop all reactive effects owned by an element. */
    stopElementEffects(element) {
        var set = this._elementEffects.get(element);
        if (!set) return;
        for (var effect of set) {
            this.stopEffect(effect);
        }
        this._elementEffects.delete(element);
    }
}

export const reactivity = new Reactivity();
