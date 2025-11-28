/**
 * Literal parse tree elements
 * Simple value literals with no dependencies
 */

/**
 * NakedString - Represents unquoted strings (consumed until whitespace)
 *
 * Parses: bareword text
 * Returns: string value
 */
export class NakedString {
    constructor(tokens) {
        this.type = "nakedString";
        this.tokens = tokens;
    }

    /**
     * Parse a naked string (unquoted string until whitespace)
     * @param {ParserHelper} helper
     * @returns {NakedString | undefined}
     */
    static parse(helper) {
        if (helper.hasMore()) {
            var tokenArr = helper.consumeUntilWhitespace();
            helper.matchTokenType("WHITESPACE");
            return new NakedString(tokenArr);
        }
    }

    /**
     * Evaluate to joined token values
     * @param {Context} context
     * @returns {string}
     */
    evaluate(context) {
        return this.tokens
            .map(function (t) {
                return t.value;
            })
            .join("");
    }
}

/**
 * BooleanLiteral - Represents true/false keywords
 *
 * Parses: true | false
 * Returns: boolean value
 */
export class BooleanLiteral {
    constructor(value) {
        this.type = "boolean";
        this.value = value;
    }

    /**
     * Parse a boolean literal
     * @param {ParserHelper} helper
     * @returns {BooleanLiteral | undefined}
     */
    static parse(helper) {
        var booleanLiteral = helper.matchToken("true") || helper.matchToken("false");
        if (!booleanLiteral) return;
        const value = booleanLiteral.value === "true";
        return new BooleanLiteral(value);
    }

    /**
     * Evaluate to boolean value
     * @param {Context} context
     * @returns {boolean}
     */
    evaluate(context) {
        return this.value;
    }
}

/**
 * NullLiteral - Represents the null keyword
 *
 * Parses: null
 * Returns: null value
 */
export class NullLiteral {
    constructor() {
        this.type = "null";
    }

    /**
     * Parse a null literal
     * @param {ParserHelper} helper
     * @returns {NullLiteral | undefined}
     */
    static parse(helper) {
        if (helper.matchToken("null")) {
            return new NullLiteral();
        }
    }

    /**
     * Evaluate to null
     * @param {Context} context
     * @returns {null}
     */
    evaluate(context) {
        return null;
    }
}

/**
 * NumberLiteral - Represents numeric values
 *
 * Parses: 42 | 3.14 | 1e10
 * Returns: number value
 */
export class NumberLiteral {
    constructor(value, numberToken) {
        this.type = "number";
        this.value = value;
        this.numberToken = numberToken;
    }

    /**
     * Parse a number literal
     * @param {ParserHelper} helper
     * @returns {NumberLiteral | undefined}
     */
    static parse(helper) {
        var number = helper.matchTokenType("NUMBER");
        if (!number) return;
        var numberToken = number;
        var value = parseFloat(/** @type {string} */ (number.value));
        return new NumberLiteral(value, numberToken);
    }

    /**
     * Evaluate to numeric value
     * @param {Context} context
     * @returns {number}
     */
    evaluate(context) {
        return this.value;
    }
}

/**
 * StringLiteral - Represents string values (with optional template interpolation)
 *
 * Parses: "hello" | "hello ${name}"
 * Returns: string value
 */
export class StringLiteral {
    constructor(stringToken, rawValue, args) {
        this.type = "string";
        this.token = stringToken;
        this.rawValue = rawValue;
        this.args = args;
    }

    /**
     * Parse a string literal
     * @param {ParserHelper} helper
     * @returns {StringLiteral | undefined}
     */
    static parse(helper) {
        var stringToken = helper.matchTokenType("STRING");
        if (!stringToken) return;
        var rawValue = /** @type {string} */ (stringToken.value);
        /** @type {any[]} */
        var args;
        if (stringToken.template) {
            // Import Lexer from the helper's parser
            const Lexer = helper.parser.constructor.Lexer || window._hyperscript?.internals?.Lexer;
            if (Lexer) {
                var innerTokens = Lexer.tokenize(rawValue, true);
                args = helper.parser.parseStringTemplate(innerTokens);
            } else {
                args = [];
            }
        } else {
            args = [];
        }
        return new StringLiteral(stringToken, rawValue, args);
    }

    /**
     * Op function for template strings
     */
    op(context) {
        var returnStr = "";
        for (var i = 1; i < arguments.length; i++) {
            var val = arguments[i];
            if (val !== undefined) {
                returnStr += val;
            }
        }
        return returnStr;
    }

    /**
     * Evaluate string value
     * @param {Context} context
     * @returns {string}
     */
    evaluate(context) {
        if (this.args.length === 0) {
            return this.rawValue;
        } else {
            return context.meta.runtime.unifiedEval(this, context);
        }
    }
}

/**
 * ArrayLiteral - Represents array literals
 *
 * Parses: [1, 2, 3] | []
 * Returns: array value
 */
export class ArrayLiteral {
    constructor(values) {
        this.type = "arrayLiteral";
        this.values = values;
        this.args = [values];
    }

    /**
     * Parse an array literal
     * @param {ParserHelper} helper
     * @returns {ArrayLiteral | undefined}
     */
    static parse(helper) {
        if (!helper.matchOpToken("[")) return;
        var values = [];
        if (!helper.matchOpToken("]")) {
            do {
                var expr = helper.requireElement("expression");
                values.push(expr);
            } while (helper.matchOpToken(","));
            helper.requireOpToken("]");
        }
        return new ArrayLiteral(values);
    }

    /**
     * Op function for array literal
     */
    op(context, values) {
        return values;
    }

    /**
     * Evaluate array value
     * @param {Context} context
     * @returns {Array}
     */
    evaluate(context) {
        return context.meta.runtime.unifiedEval(this, context);
    }
}