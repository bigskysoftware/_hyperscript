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

/**
 * NegativeNumber - Represents unary minus operator
 *
 * Parses: -expression
 * Returns: negated numeric value
 */
export class NegativeNumber {
    constructor(root) {
        this.type = "negativeNumber";
        this.root = root;
        this.args = [root];
    }

    /**
     * Parse a negative number
     * @param {ParserHelper} helper
     * @returns {NegativeNumber | any}
     */
    static parse(helper) {
        if (helper.matchOpToken("-")) {
            var root = helper.requireElement("negativeNumber");
            return new NegativeNumber(root);
        } else {
            return helper.requireElement("primaryExpression");
        }
    }

    /**
     * Op function for negation
     */
    op(context, value) {
        return -1 * value;
    }

    /**
     * Evaluate negated value
     * @param {Context} context
     * @returns {number}
     */
    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

/**
 * LogicalNot - Represents logical NOT operator
 *
 * Parses: not expression
 * Returns: boolean negation
 */
export class LogicalNot {
    constructor(root) {
        this.type = "logicalNot";
        this.root = root;
        this.args = [root];
    }

    /**
     * Parse a logical not expression
     * @param {ParserHelper} helper
     * @returns {LogicalNot | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("not")) return;
        var root = helper.requireElement("unaryExpression");
        return new LogicalNot(root);
    }

    /**
     * Op function for logical not
     */
    op(context, val) {
        return !val;
    }

    /**
     * Evaluate logical not
     * @param {Context} context
     * @returns {boolean}
     */
    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}

/**
 * SymbolRef - Represents variable/symbol references
 *
 * Parses: identifier | global identifier | local identifier | :identifier | $identifier
 * Returns: resolved symbol value
 */
export class SymbolRef {
    constructor(token, scope, name) {
        this.type = "symbol";
        this.token = token;
        this.scope = scope;
        this.name = name;
    }

    /**
     * Parse a symbol reference
     * @param {ParserHelper} helper
     * @returns {SymbolRef | undefined}
     */
    static parse(helper) {
        var scope = "default";
        if (helper.matchToken("global")) {
            scope = "global";
        } else if (helper.matchToken("element") || helper.matchToken("module")) {
            scope = "element";
            // optional possessive
            if (helper.matchOpToken("'")) {
                helper.requireToken("s");
            }
        } else if (helper.matchToken("local")) {
            scope = "local";
        }

        // TODO better look ahead here
        let eltPrefix = helper.matchOpToken(":");
        let identifier = helper.matchTokenType("IDENTIFIER");
        if (identifier && identifier.value) {
            var name = identifier.value;
            if (eltPrefix) {
                name = ":" + name;
            }
            if (scope === "default") {
                if (name.indexOf("$") === 0) {
                    scope = "global";
                }
                if (name.indexOf(":") === 0) {
                    scope = "element";
                }
            }
            return new SymbolRef(identifier, scope, name);
        }
    }

    /**
     * Evaluate symbol reference
     * @param {Context} context
     * @returns {any}
     */
    evaluate(context) {
        return context.meta.runtime.resolveSymbol(this.name, context, this.scope);
    }
}

/**
 * BeepExpression - Debug operator that logs expression values
 *
 * Parses: beep! expression
 * Returns: expression value (after logging to console)
 */
export class BeepExpression {
    constructor(expression) {
        this.type = "beepExpression";
        this.expression = expression;
        this.expression['booped'] = true;
    }

    /**
     * Parse a beep expression
     * @param {ParserHelper} helper
     * @returns {any | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("beep!")) return;
        var expression = helper.parseElement("unaryExpression");
        if (expression) {
            return new BeepExpression(expression);
        }
    }

    /**
     * Evaluate expression and log to console
     * @param {Context} ctx
     * @returns {any}
     */
    evaluate(ctx) {
        let value = this.expression.evaluate(ctx);
        let element = ctx.me;
        ctx.meta.runtime.beepValueToConsole(element, this.expression, value);
        return value;
    }
}