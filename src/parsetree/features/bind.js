/**
 * Bind Feature - Reactive binding (sugar over `when ... changes`)
 *
 * Two forms:
 *
 *   bind <target> to <expression>
 *     One-way (computed/derived). Target always reflects the expression's
 *     value. Equivalent to:
 *       when <expression> changes
 *           set <target> to it
 *
 *   bind <target> and <target>
 *     Two-way. Both sides stay in sync. Changes to either propagate to
 *     the other. Equivalent to:
 *       when <left> changes
 *           set <right> to it
 *       end
 *       when <right> changes
 *           set <left> to it
 *
 * Supports the same targets as `set`: variables ($foo, :bar),
 * attributes (@data-x), properties (my.value), etc.
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

        // Parse the left-hand side. pushFollow prevents "to" and "and"
        // from being consumed as part of the expression.
        parser.pushFollow("to");
        parser.pushFollow("and");
        var left;
        try {
            left = parser.requireElement("expression");
        } finally {
            parser.popFollow();
            parser.popFollow();
        }

        var mode;
        if (parser.matchToken("to")) {
            mode = "to";
        } else if (parser.matchToken("and")) {
            mode = "and";
        } else {
            parser.raiseParseError("Expected 'to' or 'and' after bind expression");
        }

        var right = parser.requireElement("expression");

        return new BindFeature(left, right, mode);
    }

    constructor(left, right, mode) {
        super();
        this.left = left;
        this.right = right;
        this.mode = mode;
        this.displayName = "bind ... " + mode + " ...";
    }

    install(target, source, args, runtime) {
        var feature = this;
        queueMicrotask(function () {
            if (feature.mode === "to") {
                // One-way: right expression drives left target
                runtime.createEffect(
                    function () {
                        return feature.right.evaluate(
                            runtime.makeContext(target, feature, target, null)
                        );
                    },
                    function (newValue) {
                        var ctx = runtime.makeContext(target, feature, target, null);
                        _assignTo(runtime, feature.left, ctx, newValue);
                    },
                    { element: target }
                );
            } else {
                // Two-way: left ↔ right
                // Effect 1: left changes → set right
                runtime.createEffect(
                    function () {
                        return feature.left.evaluate(
                            runtime.makeContext(target, feature, target, null)
                        );
                    },
                    function (newValue) {
                        var ctx = runtime.makeContext(target, feature, target, null);
                        _assignTo(runtime, feature.right, ctx, newValue);
                    },
                    { element: target }
                );
                // Effect 2: right changes → set left
                runtime.createEffect(
                    function () {
                        return feature.right.evaluate(
                            runtime.makeContext(target, feature, target, null)
                        );
                    },
                    function (newValue) {
                        var ctx = runtime.makeContext(target, feature, target, null);
                        _assignTo(runtime, feature.left, ctx, newValue);
                    },
                    { element: target }
                );
            }
        });
    }
}

/**
 * Assign a value to a parsed expression target, mirroring what
 * the `set` command does for each target type.
 * @param {Runtime} runtime
 * @param {ASTNode} target - The parsed expression to assign to
 * @param {Context} ctx - Execution context
 * @param {any} value - Value to assign
 */
function _assignTo(runtime, target, ctx, value) {
    if (target.type === "symbol") {
        runtime.setSymbol(target.name, ctx, target.scope, value);
    } else if (target.type === "attributeRef") {
        var elt = ctx.you || ctx.me;
        if (elt) {
            if (value == null) {
                elt.removeAttribute(target.name);
            } else {
                elt.setAttribute(target.name, value);
            }
        }
    } else if (target.type === "propertyAccess" || target.type === "possessive") {
        var root = target.root ? target.root.evaluate(ctx) : ctx.me;
        var prop = target.prop ? target.prop.value : target.name;
        if (root != null) {
            runtime.implicitLoop(root, function (elt) {
                elt[prop] = value;
            });
        }
    } else if (target.type === "attributeRefAccess") {
        var root = target.root ? target.root.evaluate(ctx) : ctx.me;
        var attr = target.attribute ? target.attribute.name : target.name;
        if (root != null) {
            runtime.implicitLoop(root, function (elt) {
                if (value == null) {
                    elt.removeAttribute(attr);
                } else {
                    elt.setAttribute(attr, value);
                }
            });
        }
    } else if (target.type === "styleRef") {
        var elt = ctx.you || ctx.me;
        if (elt) {
            elt.style[target.name] = value;
        }
    }
}
