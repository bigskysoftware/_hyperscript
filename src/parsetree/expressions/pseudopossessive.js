/**
 * Pseudopossessive expressions
 * Handles "its" possessive references used in multiple commands
 */

import { Expression } from '../base.js';

/**
 * PseudopossessiveIts - Represents the "its" possessive reference
 *
 * Resolves to the "it" symbol at runtime
 */
export class PseudopossessiveIts extends Expression {
    static grammarName = "pseudopossessiveIts";

    constructor(token) {
        super();
        this.type = "pseudopossessiveIts";
        this.token = token;
        this.name = token.value;
    }

    static parse(parser) {
        if (parser.currentToken().type === "IDENTIFIER" && parser.currentToken().value === "its") {
            return new PseudopossessiveIts(parser.matchToken("its"));
        }
    }

    resolve(context) {
        return context.meta.runtime.resolveSymbol("it", context);
    }
}
