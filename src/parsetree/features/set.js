/**
 * Set Feature - Set initial element-scoped values
 *
 * Parses: set <element-scoped-variable> to <value>
 * Executes: Sets initial value for element-scoped variable when element is processed
 */
export class SetFeature {
    /**
     * Parse set feature
     * @param {Parser} parser
     * @param {LanguageKernel} kernel
     * @returns {SetFeature | undefined}
     */
    static parse(parser, kernel) {
        let setCmd = parser.parseElement("setCommand");
        if (setCmd) {
            if (setCmd.target.scope !== "element") {
                parser.raiseParseError("variables declared at the feature level must be element scoped.");
            }
            let setFeature = {
                start: setCmd,
                install: function (target, source, args, runtime) {
                    setCmd && setCmd.execute(runtime.makeContext(target, setFeature, target, null));
                },
            };
            kernel.ensureTerminated(setCmd);
            return setFeature;
        }
    }
}
