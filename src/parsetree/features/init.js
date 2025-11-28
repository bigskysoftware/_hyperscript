/**
 * Init Feature - Run initialization code when element is processed
 *
 * Parses: init [immediately] <commands> end
 * Executes: Runs commands on element initialization
 */
export class InitFeature {
    /**
     * Parse init feature
     * @param {ParserHelper} helper
     * @param {LanguageKernel} parser
     * @returns {InitFeature | undefined}
     */
    static parse(helper, kernel) {
        if (!helper.matchToken("init")) return;

        var immediately = helper.matchToken("immediately");

        var start = helper.requireElement("commandList");
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
        kernel.ensureTerminated(start);
        helper.setParent(start, initFeature);
        return initFeature;
    }
}
