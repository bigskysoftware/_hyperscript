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
    constructor(token) {
        super();
        this.type = "pseudopossessiveIts";
        this.token = token;
        this.name = token.value;
    }

    evaluate(context) {
        return context.meta.runtime.resolveSymbol("it", context);
    }
}
