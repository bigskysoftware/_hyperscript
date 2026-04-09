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
    static grammarName = "noExpression";
    static expressionType = "unary";

    constructor(root) {
        super();
        this.root = root;
        this.args = { value: root };
    }

    static parse(parser) {
        if (!parser.matchToken("no")) return;
        var root = parser.requireElement("collectionExpression");
        return new NoExpression(root);
    }

    resolve(context, { value: val }) {
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
    static grammarName = "some";
    static expressionType = "leaf";

    constructor(root) {
        super();
        this.root = root;
        this.args = { value: root };
    }

    static parse(parser) {
        if (!parser.matchToken("some")) return;
        var root = parser.requireElement("expression");
        return new SomeExpression(root);
    }

    resolve(context, { value: val }) {
        return !context.meta.runtime.isEmpty(val);
    }
}
