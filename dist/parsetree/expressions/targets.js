/**
 * Target expression parse tree elements
 * Elements that represent targets for operations (me, you, etc.)
 */

/**
 * ImplicitMeTarget - Represents the implicit "me" or "you" target
 *
 * Parses: implicit me/you reference
 * Returns: context.you || context.me
 */
export class ImplicitMeTarget {
    constructor() {
        this.type = "implicitMeTarget";
    }

    /**
     * Parse an implicit me target
     * @param {Parser} parser
     * @returns {ImplicitMeTarget}
     */
    static parse(parser) {
        return new ImplicitMeTarget();
    }

    /**
     * Evaluate to me or you from context
     * @param {Context} context
     * @returns {*}
     */
    evaluate(context) {
        return context.you || context.me;
    }
}
