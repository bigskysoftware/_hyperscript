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

/**
 * BlockLiteral - Represents lambda-style block expressions
 *
 * Parses: \x -> expr or \x, y -> expr
 * Returns: function that evaluates the expression with bound arguments
 */
export class BlockLiteral {
    constructor(args, expr) {
        this.type = "blockLiteral";
        this.args = args;
        this.expr = expr;
    }

    /**
     * Parse a block literal (lambda expression)
     * @param {ParserHelper} helper
     * @returns {BlockLiteral | undefined}
     */
    static parse(helper) {
        if (!helper.matchOpToken("\\")) return;
        var args = [];
        var arg1 = helper.matchTokenType("IDENTIFIER");
        if (arg1) {
            args.push(arg1);
            while (helper.matchOpToken(",")) {
                args.push(helper.requireTokenType("IDENTIFIER"));
            }
        }
        // TODO compound op token
        helper.requireOpToken("-");
        helper.requireOpToken(">");
        var expr = helper.requireElement("expression");
        return new BlockLiteral(args, expr);
    }

    /**
     * Evaluate to a function
     * @param {Context} ctx
     * @returns {Function}
     */
    evaluate(ctx) {
        var args = this.args;
        var expr = this.expr;
        var returnFunc = function () {
            //TODO - push scope
            for (var i = 0; i < args.length; i++) {
                ctx.locals[args[i].value] = arguments[i];
            }
            return expr.evaluate(ctx); //OK
        };
        return returnFunc;
    }
}