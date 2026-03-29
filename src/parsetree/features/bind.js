/**
 * Bind Feature - Two-way reactive binding (sugar over `when ... changes`)
 *
 *   bind <variable> and <target>
 *   bind <variable> with <target>
 *     Two-way. Both sides stay in sync. Equivalent to:
 *       when <left> changes set <right> to it end
 *       when <right> changes set <left> to it
 *
 *   bind <variable>
 *     Shorthand on form elements. Auto-detects the bound property:
 *       input[type=checkbox/radio]    -> checked
 *       input[type=number/range]      -> valueAsNumber
 *       input, textarea, select       -> value
 */

import { Feature } from '../base.js';
import { reactivity } from '../../core/runtime/reactivity.js';

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

        var right = null;
        if (parser.matchToken("and") || parser.matchToken("with") || parser.matchToken("to")) {
            right = parser.requireElement("expression");
        }

        if (!_isAssignable(left)) {
            parser.raiseParseError("bind requires a writable expression, but '" + left.type + "' cannot be assigned to");
        }
        if (right && !_isAssignable(right)) {
            parser.raiseParseError("bind requires a writable expression, but '" + right.type + "' cannot be assigned to");
        }

        return new BindFeature(left, right);
    }

    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this.displayName = right ? "bind ... and ..." : "bind (shorthand)";
    }

    install(target, source, args, runtime) {
        var feature = this;
        queueMicrotask(function () {
            if (feature.right) {
                _twoWayBind(feature.left, feature.right, target, feature, runtime);
            } else {
                _shorthandBind(feature.left, target, feature, runtime);
            }
        });
    }
}

/** Check whether a parsed expression can be assigned to by bind */
function _isAssignable(expr) {
    if (expr.type === "classRef") return true;
    if (expr.type === "attributeRef") return true;
    return typeof expr.set === "function";
}

/**
 * Two-way bind between two parsed expressions. Left side wins on init:
 * Effect 1 (left→right) runs first, establishing the initial state.
 */
function _twoWayBind(left, right, target, feature, runtime) {
    // Read the current value of a bind side. Class refs are read as
    // booleans (does the element have this class?) rather than evaluated
    // as expressions (which would return an ElementCollection).
    // This mirrors how `add .dark` treats .dark as a class name, not
    // as a query.
    function read(expr) {
        if (expr.type === "classRef") {
            runtime.resolveAttribute(target, "class");
            return target.classList.contains(expr.className);
        }
        return expr.evaluate(runtime.makeContext(target, feature, target, null));
    }

    // Effect 1: left changes -> set right
    reactivity.createEffect(
        function () { return read(left); },
        function (newValue) {
            var ctx = runtime.makeContext(target, feature, target, null);
            _assignTo(runtime, right, ctx, newValue);
        },
        { element: target }
    );
    // Effect 2: right changes -> set left
    reactivity.createEffect(
        function () { return read(right); },
        function (newValue) {
            var ctx = runtime.makeContext(target, feature, target, null);
            _assignTo(runtime, left, ctx, newValue);
        },
        { element: target }
    );
}

/**
 * Shorthand bind: auto-detect property from element type,
 * read/write it directly without a synthetic expression object.
 */
function _shorthandBind(left, target, feature, runtime) {
    var propName = _detectProperty(target);

    // Radio buttons work fundamentally differently from other inputs.
    // The variable holds the value of the selected radio in the group,
    // not a per-element property. See _radioBind for details.
    if (propName === "radio") {
        return _radioBind(left, target, feature, runtime);
    }

    // Effect 1: variable changes -> write property to element
    reactivity.createEffect(
        function () {
            return left.evaluate(runtime.makeContext(target, feature, target, null));
        },
        function (newValue) {
            target[propName] = newValue;
        },
        { element: target }
    );

    var isNumeric = propName === "valueAsNumber";

    // Effect 2: element property changes -> write to variable
    reactivity.createEffect(
        function () {
            var val = runtime.resolveProperty(target, propName);
            return (isNumeric && val !== val) ? null : val;
        },
        function (newValue) {
            var ctx = runtime.makeContext(target, feature, target, null);
            _assignTo(runtime, left, ctx, newValue);
        },
        { element: target }
    );

    // form.reset() changes input values without firing input/change events.
    // Listen for the reset event and re-sync after the browser resets values.
    var form = target.closest("form");
    if (form) {
        form.addEventListener("reset", function () {
            setTimeout(function () {
                if (!target.isConnected) return;
                var val = target[propName];
                if (isNumeric && val !== val) val = null;
                var ctx = runtime.makeContext(target, feature, target, null);
                _assignTo(runtime, left, ctx, val);
            }, 0);
        });
    }
}

/**
 * Radio button bind. Unlike normal bind which syncs a variable with a
 * single element's property, radio bind syncs a variable with a GROUP
 * of radio buttons that share the same name attribute.
 *
 * The variable holds the value of the selected radio (e.g. "red").
 * - User clicks a radio: variable is set to that radio's value attribute
 * - Variable changes: the radio whose value matches is checked, others unchecked
 *
 * Each radio in the group has its own bind. They all share the same variable.
 */
function _radioBind(left, target, feature, runtime) {
    var radioValue = target.value;
    var groupName = target.getAttribute("name");

    // Effect 1: variable changes -> check/uncheck this radio
    reactivity.createEffect(
        function () {
            return left.evaluate(runtime.makeContext(target, feature, target, null));
        },
        function (newValue) {
            target.checked = (newValue === radioValue);
        },
        { element: target }
    );

    // Effect 2: this radio is checked -> set variable to this radio's value
    // Only fires when this specific radio is clicked (change event).
    target.addEventListener("change", function () {
        if (target.checked) {
            var ctx = runtime.makeContext(target, feature, target, null);
            _assignTo(runtime, left, ctx, radioValue);
        }
    });
}

/**
 * Detect the default property for shorthand bind based on element type.
 * @param {Element} element
 * @returns {string} Property name ("value", "checked", "valueAsNumber", or "radio")
 */
function _detectProperty(element) {
    var tag = element.tagName;
    if (tag === "INPUT") {
        var type = element.getAttribute("type") || "text";
        if (type === "radio") return "radio";
        if (type === "checkbox") return "checked";
        if (type === "number" || type === "range") return "valueAsNumber";
        return "value";
    }
    if (tag === "TEXTAREA" || tag === "SELECT") return "value";
    throw new Error(
        "bind shorthand is not supported on <" + tag.toLowerCase() + "> elements. " +
        "Use 'bind $var and my value' explicitly."
    );
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
