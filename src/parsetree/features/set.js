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

    static parse(parser) {
        let setCmd = parser.parseElement("setCommand");
        if (setCmd) {
            if (setCmd.target.scope !== "element" && setCmd.target.scope !== "inherited") {
                parser.raiseError("variables declared at the feature level must be element or DOM scoped.");
            }
            let setFeature = new SetFeature(setCmd);
            parser.ensureTerminated(setCmd);
            return setFeature;
        }
    }
}
