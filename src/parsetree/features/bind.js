/**
 * Bind Feature - Reactive binding (sugar over `when ... changes`)
 *
 *   bind X to Y    (also: bind X and Y, bind X with Y)
 *
 * Initialization: Y (right side) wins when X is writable.
 * If X is not writable, X wins (one-way: X drives Y).
 * If neither side is writable, error.
 *
 * If either side evaluates to a DOM element, bind auto-detects
 * the appropriate property (value, checked, valueAsNumber, etc.).
 */

import { Feature } from '../base.js';

export class BindFeature extends Feature {
    static keyword = "bind";

    /**
     * Parse bind feature
     * @param {Parser} parser
     * @returns {BindFeature | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("bind")) return;

        parser.pushFollow("and");
        parser.pushFollow("with");
        parser.pushFollow("to");
        var left;
        try {
            left = parser.requireElement("expression");
        } finally {
            parser.popFollow();
            parser.popFollow();
            parser.popFollow();
        }

        if (!parser.matchToken("and") && !parser.matchToken("with") && !parser.matchToken("to")) {
            parser.raiseExpected('and', 'with', 'to');
        }

        var right = parser.requireElement("expression");

        return new BindFeature(left, right);
    }

    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this.displayName = "bind";
    }

    install(target, source, args, runtime) {
        var feature = this;
        queueMicrotask(function () {
            try {
                _bind(feature.left, feature.right, target, feature, runtime);
            } catch (e) {
                console.error(e.message || e);
            }
        });
    }
}

/** Register a listener for cleanup when the owning element is removed */
function _registerListener(runtime, elt, listenerTarget, event, handler) {
    var eltData = runtime.getInternalData(elt);
    if (!eltData.listeners) eltData.listeners = [];
    eltData.listeners.push({ target: listenerTarget, event: event, handler: handler });
}

/** Check whether a parsed expression can be assigned to by bind */
function _isAssignable(expr) {
    if (expr.type === "classRef") return true;
    if (expr.type === "attributeRef") return true;
    return typeof expr.set === "function";
}

/**
 * Unified bind: resolve each side, create effects.
 *
 * In `bind X to Y`:
 *   - if X is writable, Y wins as the initial value (right→left first)
 *   - if X is not writable and Y is writable, X wins (left→right only)
 *   - if neither is writable, error
 */
function _bind(left, right, target, feature, runtime) {
    var ctx = runtime.makeContext(target, feature, target, null);

    var leftSide = _resolveSide(left, target, feature, runtime, ctx);
    var rightSide = _resolveSide(right, target, feature, runtime, ctx);

    var leftWritable = leftSide.element || _isAssignable(left);
    var rightWritable = rightSide.element || _isAssignable(right);

    if (!leftWritable && !rightWritable) {
        throw new Error("bind requires at least one writable side");
    }

    // When X (left) is writable, right→left runs first so Y wins on init
    if (leftWritable) {
        runtime.reactivity.createEffect(
            function () { return rightSide.read(); },
            function (newValue) { leftSide.write(newValue); },
            { element: target }
        );
    }

    if (rightWritable) {
        runtime.reactivity.createEffect(
            function () { return leftSide.read(); },
            function (newValue) { rightSide.write(newValue); },
            { element: target }
        );
    }

    _setupFormReset(leftSide, rightSide, target, runtime);
}

/**
 * Evaluate an expression and create the appropriate side.
 * If the expression resolves to a DOM element, create an element side.
 * Otherwise, create an expression side.
 */
function _resolveSide(expr, target, feature, runtime, ctx) {
    var value = expr.evaluate(ctx);
    if (value instanceof Element) {
        return _createElementSide(value, runtime);
    }
    return _createExpressionSide(expr, target, feature, runtime);
}

/** Property lookup: INPUT:type -> property name, or TAG -> property name */
var _bindProperty = {
    "INPUT:checkbox": "checked",
    "INPUT:number":   "valueAsNumber",
    "INPUT:range":    "valueAsNumber",
    "INPUT":          "value",
    "TEXTAREA":       "value",
    "SELECT":         "value",
};

/**
 * Create a read/write side for a DOM element, auto-detecting the
 * appropriate property based on element type.
 */
function _createElementSide(element, runtime) {
    var tag = element.tagName;
    var type = tag === "INPUT" ? (element.getAttribute("type") || "text") : null;

    // Radio buttons have unique semantics: the variable holds the group's
    // selected value, not a per-element property.
    if (tag === "INPUT" && type === "radio") {
        var radioValue = element.value;
        return {
            element: element,
            read: function () {
                var checked = runtime.resolveProperty(element, "checked");
                return checked ? radioValue : undefined;
            },
            write: function (value) {
                element.checked = (value === radioValue);
            }
        };
    }

    // Look up property by INPUT:type, then by TAG
    var prop = _bindProperty[tag + ":" + type] || _bindProperty[tag];

    // Contenteditable elements
    if (!prop && element.hasAttribute("contenteditable") && element.getAttribute("contenteditable") !== "false") {
        prop = "textContent";
    }

    // Custom elements with a value property
    if (!prop && tag.includes("-") && "value" in element) {
        prop = "value";
    }

    if (!prop) {
        throw new Error(
            "bind cannot auto-detect a property for <" + tag.toLowerCase() + ">. " +
            "Use an explicit property (e.g. 'bind $var to #el's value')."
        );
    }

    var isNumeric = prop === "valueAsNumber";
    return {
        element: element,
        read: function () {
            var val = runtime.resolveProperty(element, prop);
            return (isNumeric && val !== val) ? null : val;
        },
        write: function (value) { element[prop] = value; }
    };
}

/**
 * Create a read/write side for a parsed expression (variable, attribute, class, etc).
 */
function _createExpressionSide(expr, target, feature, runtime) {
    if (expr.type === "classRef") {
        return {
            read: function () {
                runtime.resolveAttribute(target, "class");
                return target.classList.contains(expr.className);
            },
            write: function (value) {
                if (value) {
                    target.classList.add(expr.className);
                } else {
                    target.classList.remove(expr.className);
                }
            }
        };
    }

    return {
        read: function () {
            return expr.evaluate(runtime.makeContext(target, feature, target, null));
        },
        write: function (value) {
            var ctx = runtime.makeContext(target, feature, target, null);
            _assignTo(runtime, expr, ctx, value);
        }
    };
}

/**
 * If either side wraps a form element, listen for the form's reset event
 * and re-sync the binding afterward.
 */
function _setupFormReset(leftSide, rightSide, target, runtime) {
    _addResetListener(leftSide, rightSide, target, runtime);
    _addResetListener(rightSide, leftSide, target, runtime);
}

/**
 * If source side has an element inside a form, listen for reset and
 * re-sync source -> dest.
 */
function _addResetListener(source, dest, target, runtime) {
    if (!source.element) return;
    var form = source.element.closest("form");
    if (!form) return;

    var resetHandler = () => {
        setTimeout(() => {
            if (!target.isConnected) return;
            dest.write(source.read());
        }, 0);
    };
    form.addEventListener("reset", resetHandler);
    _registerListener(runtime, target, form, "reset", resetHandler);
}

/** Set an attribute, handling booleans via presence/absence (or "true"/"false" for aria-*) */
function _setAttr(elt, name, value) {
    if (typeof value === "boolean") {
        if (name.startsWith("aria-")) {
            elt.setAttribute(name, String(value));
        } else if (value) {
            elt.setAttribute(name, "");
        } else {
            elt.removeAttribute(name);
        }
    } else if (value == null) {
        elt.removeAttribute(name);
    } else {
        elt.setAttribute(name, value);
    }
}

/**
 * Assign a value to a parsed expression target. Delegates to the
 * expression's own set() method (same contract as the set command),
 * with bind-specific coercion for classes and boolean attributes.
 */
function _assignTo(runtime, target, ctx, value) {
    if (target.type === "classRef") {
        var elt = ctx.you || ctx.me;
        if (elt) value ? elt.classList.add(target.className) : elt.classList.remove(target.className);
    } else if (target.type === "attributeRef" && typeof value === "boolean") {
        var elt = ctx.you || ctx.me;
        if (elt) _setAttr(elt, target.name, value);
    } else {
        var lhs = {};
        if (target.lhs) {
            for (var key in target.lhs) {
                var expr = target.lhs[key];
                lhs[key] = expr && expr.evaluate ? expr.evaluate(ctx) : expr;
            }
        }
        target.set(ctx, lhs, value);
    }
}
