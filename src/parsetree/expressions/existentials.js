/**
 * Existential expression parse tree elements
 * Expressions that check for existence, emptiness, etc.
 */

import { Expression } from '../base.js';

/**
 * NoExpression - Represents the "no" keyword for empty/null checks
 *
 * Parses: no <expression>
 * Returns: true if the expression is empty/null, false otherwise
 */
export class NoExpression extends Expression {
    constructor(root) {
        super();
        this.type = "noExpression";
        this.root = root;
        this.args = [root];
    }

    /**
     * Parse a no expression
     * @param {Parser} parser
     * @returns {NoExpression | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("no")) return;
        var root = parser.requireElement("unaryExpression");
        return new NoExpression(root);
    }

    /**
     * Op function for no expression
     */
    resolve(context, val) {
        return context.meta.runtime.isEmpty(val);
    }
}

/**
 * SomeExpression - Represents the "some" keyword for existential checks
 *
 * Parses: some <expression>
 * Returns: true if the expression is not empty/null, false otherwise
 */
export class SomeExpression extends Expression {
    constructor(root) {
        super();
        this.type = "noExpression"; // Note: currently shares type with NoExpression
        this.root = root;
        this.args = [root];
    }

    /**
     * Parse a some expression
     * @param {Parser} parser
     * @returns {SomeExpression | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("some")) return;
        var root = parser.requireElement("expression");
        return new SomeExpression(root);
    }

    /**
     * Op function for some expression
     */
    resolve(context, val) {
        return !context.meta.runtime.isEmpty(val);
    }
}
