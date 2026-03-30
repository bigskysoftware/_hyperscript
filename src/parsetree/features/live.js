/**
 * Live Feature - Reactive commands that re-run when dependencies change
 *
 *   live set $total to ($price * $qty)
 *
 *   live
 *     set $subtotal to ($price * $qty)
 *     set $total to ($subtotal + $tax)
 *     if $total > 100 add .expensive to me else remove .expensive from me end
 *   end
 *
 * Each command in the block becomes an independent tracked effect.
 * Whatever a command reads during execution becomes its dependencies.
 * When any dependency changes, that specific command re-runs.
 */

import { Feature } from '../base.js';
import { reactivity } from '../../core/runtime/reactivity.js';

export class LiveFeature extends Feature {
    static keyword = "live";

    constructor(commands) {
        super();
        this.commands = commands;
        this.displayName = "live";
    }

    static parse(parser) {
        if (!parser.matchToken("live")) return;

        var start = parser.requireElement("commandList");
        var feature = new LiveFeature(start);
        parser.ensureTerminated(start);
        parser.setParent(start, feature);
        return feature;
    }

    install(target, source, args, runtime) {
        var feature = this;
        queueMicrotask(function () {
            reactivity.createEffect(
                function () {
                    feature.commands.execute(
                        runtime.makeContext(target, feature, target, null)
                    );
                },
                function () {},
                { element: target }
            );
        });
    }
}
