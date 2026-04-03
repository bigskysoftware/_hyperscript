/**
 * Init Feature - Run initialization code when element is processed
 *
 * Parses: init [immediately] <commands> end
 * Executes: Runs commands on element initialization
 */

import { Feature } from '../base.js';

export class InitFeature extends Feature {
    static keyword = "init";

    constructor(start, immediately) {
        super();
        this.start = start;
        this.immediately = immediately;
    }

    install(target, source, args, runtime) {
        var handler = () => {
            this.start?.execute(runtime.makeContext(target, this, target, null));
        };
        if (this.immediately) {
            handler();
        } else {
            queueMicrotask(handler);
        }
    }

    static parse(parser) {
        if (!parser.matchToken("init")) return;

        var immediately = parser.matchToken("immediately");
        var start = parser.requireElement("commandList");
        var initFeature = new InitFeature(start, immediately);

        // terminate body
        parser.ensureTerminated(start);
        parser.setParent(start, initFeature);
        return initFeature;
    }
}
