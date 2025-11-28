/**
 * Worker Feature - Placeholder for worker plugin
 *
 * Parses: worker ...
 * Note: Requires the _hyperscript worker plugin to function
 */
export class WorkerFeature {
    /**
     * Parse worker feature
     * @param {Parser} parser
     * @returns {WorkerFeature | undefined}
     */
    static parse(parser) {
        if (parser.matchToken("worker")) {
            parser.raiseParseError(
                "In order to use the 'worker' feature, include " +
                    "the _hyperscript worker plugin. See " +
                    "https://hyperscript.org/features/worker/ for " +
                    "more info."
            );
            return undefined
        }
    }
}
