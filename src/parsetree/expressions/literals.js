/**
 * Literal parse tree elements
 * Simple value literals with no dependencies
 */

import { Expression } from '../base.js';

/**
 * NakedString - Represents unquoted strings (consumed until whitespace)
 *
 * Parses: bareword text
 * Returns: string value
 */
export class NakedString extends Expression {
    static grammarName = "nakedString";

    constructor(tokens) {
        super();
        this.type = "nakedString";
        this.tokens = tokens;
    }

    /**
     * Parse a naked string (unquoted string until whitespace)
     * @param {Parser} parser
     * @returns {NakedString | undefined}
     */
    static parse(parser) {
        if (parser.hasMore()) {
            var tokenArr = parser.consumeUntilWhitespace();
            parser.matchTokenType("WHITESPACE");
            return new NakedString(tokenArr);
        }
    }

    resolve(context) {
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
export class BooleanLiteral extends Expression {
    static grammarName = "boolean";
    static expressionType = "leaf";

    constructor(value) {
        super();
        this.type = "boolean";
        this.value = value;
    }

    /**
     * Parse a boolean literal
     * @param {Parser} parser
     * @returns {BooleanLiteral | undefined}
     */
    static parse(parser) {
        var booleanLiteral = parser.matchToken("true") || parser.matchToken("false");
        if (!booleanLiteral) return;
        const value = booleanLiteral.value === "true";
        return new BooleanLiteral(value);
    }

    resolve(context) {
        return this.value;
    }
}

/**
 * NullLiteral - Represents the null keyword
 *
 * Parses: null
 * Returns: null value
 */
export class NullLiteral extends Expression {
    static grammarName = "null";
    static expressionType = "leaf";

    constructor() {
        super();
        this.type = "null";
    }

    /**
     * Parse a null literal
     * @param {Parser} parser
     * @returns {NullLiteral | undefined}
     */
    static parse(parser) {
        if (parser.matchToken("null")) {
            return new NullLiteral();
        }
    }

    resolve(context) {
        return null;
    }
}

/**
 * NumberLiteral - Represents numeric values
 *
 * Parses: 42 | 3.14 | 1e10
 * Returns: number value
 */
export class NumberLiteral extends Expression {
    static grammarName = "number";
    static expressionType = "leaf";

    constructor(value, numberToken) {
        super();
        this.type = "number";
        this.value = value;
        this.numberToken = numberToken;
    }

    /**
     * Parse a number literal
     * @param {Parser} parser
     * @returns {NumberLiteral | undefined}
     */
    static parse(parser) {
        var number = parser.matchTokenType("NUMBER");
        if (!number) return;
        var numberToken = number;
        var value = parseFloat(/** @type {string} */ (number.value));
        return new NumberLiteral(value, numberToken);
    }

    resolve(context) {
        return this.value;
    }
}

/**
 * StringLiteral - Represents string values (with optional template interpolation)
 *
 * Parses: "hello" | "hello ${name}"
 * Returns: string value
 */
export class StringLiteral extends Expression {
    static grammarName = "string";
    static expressionType = "leaf";

    constructor(stringToken, rawValue, args) {
        super();
        this.type = "string";
        this.token = stringToken;
        this.rawValue = rawValue;
        this.args = args;
    }

    /**
     * Parse a string literal
     * @param {Parser} parser
     * @returns {StringLiteral | undefined}
     */
    static parse(parser) {
        var stringToken = parser.matchTokenType("STRING");
        if (!stringToken) return;
        var rawValue = /** @type {string} */ (stringToken.value);
        /** @type {any[]} */
        var args;
        if (stringToken.template) {
            // Import Lexer from the helper's parser
            const Tokenizer = parser.kernel.constructor.Tokenizer || window._hyperscript?.internals?.Tokenizer;
            if (Tokenizer) {
                var innerTokens = Tokenizer.tokenize(rawValue, true);
                var innerParser = new parser.constructor(parser.kernel, innerTokens);
                args = parser.kernel.parseStringTemplate(innerParser);
            } else {
                args = [];
            }
        } else {
            args = [];
        }
        return new StringLiteral(stringToken, rawValue, args);
    }

    resolve(context) {
        if (this.args.length === 0) {
            return this.rawValue;
        }
        var returnStr = "";
        for (var i = 1; i < arguments.length; i++) {
            var val = arguments[i];
            if (val !== undefined) {
                returnStr += val;
            }
        }
        return returnStr;
    }
}

/**
 * ArrayLiteral - Represents array literals
 *
 * Parses: [1, 2, 3] | []
 * Returns: array value
 */
export class ArrayLiteral extends Expression {
    static grammarName = "arrayLiteral";
    static expressionType = "leaf";

    constructor(values) {
        super();
        this.type = "arrayLiteral";
        this.values = values;
        this.args = [values];
    }

    /**
     * Parse an array literal
     * @param {Parser} parser
     * @returns {ArrayLiteral | undefined}
     */
    static parse(parser) {
        if (!parser.matchOpToken("[")) return;
        var values = [];
        if (!parser.matchOpToken("]")) {
            do {
                var expr = parser.requireElement("expression");
                values.push(expr);
            } while (parser.matchOpToken(","));
            parser.requireOpToken("]");
        }
        return new ArrayLiteral(values);
    }

    /**
     * Op function for array literal
     */
    resolve(context, values) {
        return values;
    }
}

/**
 * ObjectKey - Represents an object key (string, identifier, or computed expression)
 *
 * Parses: "key" | key | [expression]
 * Returns: string key value
 */
export class ObjectKey extends Expression {
    static grammarName = "objectKey";

    constructor(key, expr, args) {
        super();
        this.type = "objectKey";
        this.key = key;
        this.expr = expr;
        this.args = args;
    }

    /**
     * Parse an object key
     * @param {Parser} parser
     * @returns {ObjectKey}
     */
    static parse(parser) {
        var token;
        if ((token = parser.matchTokenType("STRING"))) {
            return new ObjectKey(token.value, null, null);
        } else if (parser.matchOpToken("[")) {
            var expr = parser.parseElement("expression");
            parser.requireOpToken("]");
            return new ObjectKey(null, expr, [expr]);
        } else {
            var key = "";
            do {
                token = parser.matchTokenType("IDENTIFIER") || parser.matchOpToken("-");
                if (token) key += token.value;
            } while (token);
            return new ObjectKey(key, null, null);
        }
    }

    resolve(ctx, expr) {
        if (this.expr) {
            return expr;
        }
        return this.key;
    }
}

/**
 * ObjectLiteral - Represents object literals
 *
 * Parses: {foo: bar, baz: qux} | {}
 * Returns: object value
 */
export class ObjectLiteral extends Expression {
    static grammarName = "objectLiteral";
    static expressionType = "leaf";

    constructor(keyExpressions, valueExpressions) {
        super();
        this.type = "objectLiteral";
        this.keyExpressions = keyExpressions;
        this.valueExpressions = valueExpressions;
        this.args = [keyExpressions, valueExpressions];
    }

    /**
     * Parse an object literal
     * @param {Parser} parser
     * @returns {ObjectLiteral | undefined}
     */
    static parse(parser) {
        if (!parser.matchOpToken("{")) return;
        var keyExpressions = [];
        var valueExpressions = [];
        if (!parser.matchOpToken("}")) {
            do {
                var name = parser.requireElement("objectKey");
                parser.requireOpToken(":");
                var value = parser.requireElement("expression");
                valueExpressions.push(value);
                keyExpressions.push(name);
            } while (parser.matchOpToken(",") && !parser.peekToken("}", 0, 'R_BRACE'));
            parser.requireOpToken("}");
        }
        return new ObjectLiteral(keyExpressions, valueExpressions);
    }

    /**
     * Op function for object literal
     */
    resolve(context, keys, values) {
        var returnVal = {};
        for (var i = 0; i < keys.length; i++) {
            returnVal[keys[i]] = values[i];
        }
        return returnVal;
    }
}

/**
 * NamedArgumentList - Represents named argument lists (with or without parentheses)
 *
 * Parses: foo: 1, bar: 2 or (foo: 1, bar: 2)
 * Returns: object with named arguments
 */
export class NamedArgumentList extends Expression {
    static grammarName = "namedArgumentList";

    constructor(fields, valueExpressions) {
        super();
        this.type = "namedArgumentList";
        this.fields = fields;
        this.args = [valueExpressions];
    }

    /**
     * Parse a naked named argument list (without parentheses)
     * @param {Parser} parser
     * @returns {NamedArgumentList}
     */
    static parseNaked(parser) {
        var fields = [];
        var valueExpressions = [];
        if (parser.currentToken().type === "IDENTIFIER") {
            do {
                var name = parser.requireTokenType("IDENTIFIER");
                parser.requireOpToken(":");
                var value = parser.requireElement("expression");
                valueExpressions.push(value);
                fields.push({ name: name, value: value });
            } while (parser.matchOpToken(","));
        }
        return new NamedArgumentList(fields, valueExpressions);
    }

    /**
     * Parse a named argument list with parentheses
     * @param {Parser} parser
     * @returns {NamedArgumentList | undefined}
     */
    static parse(parser) {
        if (!parser.matchOpToken("(")) return;
        var elt = NamedArgumentList.parseNaked(parser);
        parser.requireOpToken(")");
        return elt;
    }

    /**
     * Op function for named arguments
     */
    resolve(context, values) {
        var returnVal = { _namedArgList_: true };
        for (var i = 0; i < values.length; i++) {
            var field = this.fields[i];
            returnVal[field.name.value] = values[i];
        }
        return returnVal;
    }
}