/**
 * Set Feature - Set initial element-scoped values
 *
 * Parses: set <element-scoped-variable> to <value>
 * Executes: Sets initial value for element-scoped variable when element is processed
 */

import { Feature } from '../base.js';

export class SetFeature extends Feature {
    static keyword = "set";

    constructor(setCmd) {
        super();
        this.start = setCmd;
    }

    install(target, source, args, runtime) {
        this.start && this.start.execute(runtime.makeContext(target, this, target, null));
    }

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
            let setFeature = new SetFeature(setCmd);
            parser.ensureTerminated(setCmd);
            return setFeature;
        }
    }
}
