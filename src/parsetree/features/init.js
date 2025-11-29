/**
 * Init Feature - Run initialization code when element is processed
 *
 * Parses: init [immediately] <commands> end
 * Executes: Runs commands on element initialization
 */
export class InitFeature {
    /**
     * Parse init feature
     * @param {Parser} parser
     * @returns {InitFeature | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("init")) return;

        var immediately = parser.matchToken("immediately");

        var start = parser.requireElement("commandList");
        var initFeature = {
            start: start,
            install: function (target, source, args, runtime) {
                let handler = function () {
                    start && start.execute(runtime.makeContext(target, initFeature, target, null));
                };
                if (immediately) {
                    handler();
                } else {
                    setTimeout(handler, 0);
                }
            },
        };

        // terminate body
        parser.ensureTerminated(start);
        parser.setParent(start, initFeature);
        return initFeature;
    }
}
