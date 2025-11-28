/**
 * Worker Feature - Placeholder for worker plugin
 *
 * Parses: worker ...
 * Note: Requires the _hyperscript worker plugin to function
 */
export class WorkerFeature {
    /**
     * Parse worker feature
     * @param {ParserHelper} helper
     * @returns {WorkerFeature | undefined}
     */
    static parse(helper) {
        if (helper.matchToken("worker")) {
            helper.raiseParseError(
                "In order to use the 'worker' feature, include " +
                    "the _hyperscript worker plugin. See " +
                    "https://hyperscript.org/features/worker/ for " +
                    "more info."
            );
            return undefined
        }
    }
}
