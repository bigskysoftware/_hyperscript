/**
 * Existential expression parse tree elements
 * Expressions that check for existence, emptiness, etc.
 */

/**
 * NoExpression - Represents the "no" keyword for empty/null checks
 *
 * Parses: no <expression>
 * Returns: true if the expression is empty/null, false otherwise
 */
export class NoExpression {
    constructor(root) {
        this.type = "noExpression";
        this.root = root;
        this.args = [root];
    }

    /**
     * Parse a no expression
     * @param {ParserHelper} helper
     * @returns {NoExpression | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("no")) return;
        var root = helper.requireElement("unaryExpression");
        return new NoExpression(root);
    }

    /**
     * Op function for no expression
     */
    op(context, val) {
        return context.meta.runtime.isEmpty(val);
    }

    /**
     * Evaluate the no expression
     * @param {Context} context
     * @returns {boolean}
     */
    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

/**
 * SomeExpression - Represents the "some" keyword for existential checks
 *
 * Parses: some <expression>
 * Returns: true if the expression is not empty/null, false otherwise
 */
export class SomeExpression {
    constructor(root) {
        this.type = "noExpression"; // Note: currently shares type with NoExpression
        this.root = root;
        this.args = [root];
    }

    /**
     * Parse a some expression
     * @param {ParserHelper} helper
     * @returns {SomeExpression | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("some")) return;
        var root = helper.requireElement("expression");
        return new SomeExpression(root);
    }

    /**
     * Op function for some expression
     */
    op(context, val) {
        return !context.meta.runtime.isEmpty(val);
    }

    /**
     * Evaluate the some expression
     * @param {Context} context
     * @returns {boolean}
     */
    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}
