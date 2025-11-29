/**
 * Set Feature - Set initial element-scoped values
 *
 * Parses: set <element-scoped-variable> to <value>
 * Executes: Sets initial value for element-scoped variable when element is processed
 */
export class SetFeature {
    static keyword = "set";

    /**
     * Parse set feature
     * @param {Parser} parser
     * @returns {SetFeature | undefined}
     */
    static parse(parser) {
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
            parser.ensureTerminated(setCmd);
            return setFeature;
        }
    }
}
