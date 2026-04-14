/**
 * Set Feature - Run a `set` once when the feature is installed on an element
 *
 * Parses: set <target> to <value>
 *
 * Allowed targets at the feature level:
 *   - element-scoped variables (`:foo`)
 *   - inherited / DOM-scoped variables (`^foo`)
 *   - global variables (`$foo`)
 *   - attribute references (`@data-foo`)
 *   - property and style refs on `me`
 *
 * Local (handler-scoped) variables are rejected because they would be
 * written and immediately discarded - the install context has nowhere
 * for them to live past the call.
 *
 * Executes: Runs the `set` command once with `me` bound to the element
 * being processed. For attribute targets that means setAttribute on the
 * element; for variable targets it writes into the appropriate scope.
 */

import { Feature } from '../base.js';

export class SetFeature extends Feature {
    static keyword = "set";

    constructor(setCmd) {
        super();
        this.start = setCmd;
    }

    install(target, source, args, runtime) {
        queueMicrotask(() => {
            this.start && this.start.execute(runtime.makeContext(target, this, target, null));
        });
    }

    static parse(parser) {
        let setCmd = parser.parseElement("setCommand");
        if (setCmd) {
            if (setCmd.target.scope === "local") {
                parser.raiseError(
                    "variables declared at the feature level cannot be locally scoped " +
                    "(use :foo, ^foo, $foo, or an @attribute target instead)."
                );
            }
            let setFeature = new SetFeature(setCmd);
            parser.ensureTerminated(setCmd);
            return setFeature;
        }
    }
}
