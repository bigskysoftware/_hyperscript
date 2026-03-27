/**
 * When Feature - Reactive effect
 *
 * Parses: when <expression> [or <expression>]* changes <commands>
 * Executes: Re-runs commands when the watched expression's value changes.
 *           Dependencies are tracked automatically via createEffect.
 */

import { Feature } from '../base.js';
import { reactivity } from '../../core/runtime/reactivity.js';

export class WhenFeature extends Feature {
    static keyword = "when";

    /**
     * Parse when feature
     * @param {Parser} parser
     * @returns {WhenFeature | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("when")) return;

        // Collect one or more watched expressions, separated by "or".
        // pushFollow("or") tells the expression parser to stop before "or"
        // instead of consuming it as a logical operator.
        var exprs = [];
        do {
            parser.pushFollow("or");
            try {
                exprs.push(parser.requireElement("expression"));
            } finally {
                parser.popFollow();
            }
        } while (parser.matchToken("or"));

        // Check for bare local variables that can't be reactive
        for (var i = 0; i < exprs.length; i++) {
            var expr = exprs[i];
            if (expr.type === "symbol" && expr.scope === "default"
                && !expr.name.startsWith("$") && !expr.name.startsWith(":")) {
                parser.raiseParseError(
                    "Cannot watch local variable '" + expr.name + "'. " +
                    "Local variables are not reactive. Use '$" + expr.name +
                    "' (global) or ':" + expr.name + "' (element-scoped) instead."
                );
            }
        }

        parser.requireToken("changes");
        var start = parser.requireElement("commandList");
        parser.ensureTerminated(start);
        var feature = new WhenFeature(exprs, start);
        parser.setParent(start, feature);
        return feature;
    }

    constructor(exprs, start) {
        super();
        this.exprs = exprs;
        this.start = start;
        this.displayName = "when ... changes";
    }

    install(target, source, args, runtime) {
        var feature = this;
        // Defer effect creation to a microtask so that ID references (e.g.
        // #reactive-input) can be resolved after the element is appended to
        // the DOM.
        queueMicrotask(function () {
            // Create one effect per watched expression. Each triggers the
            // same command list, mirroring how `on` handles `or` for events.
            for (var i = 0; i < feature.exprs.length; i++) {
                (function (expr) {
                    reactivity.createEffect(
                        function () {
                            return expr.evaluate(
                                runtime.makeContext(target, feature, target, null)
                            );
                        },
                        function (newValue) {
                            var ctx = runtime.makeContext(target, feature, target, null);
                            ctx.result = newValue;
                            ctx.meta.reject = function (err) {
                                console.error(err.message ? err.message : err);
                                runtime.triggerEvent(target, "exception", { error: err });
                            };
                            ctx.meta.onHalt = function () {};
                            feature.start.execute(ctx);
                        },
                        { element: target }
                    );
                })(feature.exprs[i]);
            }
        });
    }
}
