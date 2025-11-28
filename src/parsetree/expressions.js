/**
 * Basic expression parse tree elements
 */

/**
 * ParenthesizedExpression - Wraps an expression in parentheses
 *
 * Parses: (expression)
 * Returns: the inner expression
 */
export class ParenthesizedExpression {
    /**
     * Parse a parenthesized expression
     * @param {ParserHelper} helper
     * @returns {any | undefined}
     */
    static parse(helper) {
        if (helper.matchOpToken("(")) {
            var follows = helper.clearFollows();
            try {
                var expr = helper.requireElement("expression");
            } finally {
                helper.restoreFollows(follows);
            }
            helper.requireOpToken(")");
            return expr;
        }
    }
}