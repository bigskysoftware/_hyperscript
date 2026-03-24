/**
 * Target expression parse tree elements
 * Elements that represent targets for operations (me, you, etc.)
 */

import { Expression } from '../base.js';

/**
 * ImplicitMeTarget - Represents the implicit "me" or "you" target
 *
 * Parses: implicit me/you reference
 * Returns: context.you || context.me
 */
export class ImplicitMeTarget extends Expression {
    static grammarName = "implicitMeTarget";

    constructor() {
        super();
        this.type = "implicitMeTarget";
    }

    static parse(parser) {
        return new ImplicitMeTarget();
    }

    resolve(context) {
        return context.you || context.me;
    }
}
