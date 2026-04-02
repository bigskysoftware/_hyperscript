/**
 * Worker Feature - Placeholder for worker plugin
 *
 * Parses: worker ...
 * Note: Requires the _hyperscript worker plugin to function
 */

import { Feature } from '../base.js';

export class WorkerFeature extends Feature {
    static keyword = "worker";

    static parse(parser) {
        if (parser.matchToken("worker")) {
            parser.raiseError(
                "In order to use the 'worker' feature, include " +
                    "the _hyperscript worker plugin. See " +
                    "https://hyperscript.org/features/worker/ for " +
                    "more info."
            );
            return undefined
        }
    }
}
