/**
 * Literal parse tree elements
 * Simple value literals with no dependencies
 */

import { Expression } from '../base.js';
import { Tokenizer } from '../../core/tokenizer.js';

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
        this.tokens = tokens;
    }

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
        this.value = value;
    }

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
    }

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
        this.value = value;
        this.numberToken = numberToken;
    }

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
        this.token = stringToken;
        this.rawValue = rawValue;
        this.args = args.length > 0 ? { parts: args } : null;
    }

    static parse(parser) {
        var stringToken = parser.matchTokenType("STRING");
        if (!stringToken) return;
        var rawValue = /** @type {string} */ (stringToken.value);
        /** @type {any[]} */
        var args;
        if (stringToken.template) {
            var innerTokens = Tokenizer.tokenize(rawValue, true);
            var innerParser = parser.createChildParser(innerTokens);
            args = innerParser.parseStringTemplate();
        } else {
            args = [];
        }
        return new StringLiteral(stringToken, rawValue, args);
    }

    resolve(context, { parts } = {}) {
        if (!parts || parts.length === 0) {
            return this.rawValue;
        }
        var returnStr = "";
        for (var i = 0; i < parts.length; i++) {
            var val = parts[i];
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
        this.values = values;
        this.args = { values };
    }

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

    resolve(context, { values }) {
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
        this.key = key;
        this.expr = expr;
        this.args = args;
    }

    static parse(parser) {
        var token;
        if ((token = parser.matchTokenType("STRING"))) {
            return new ObjectKey(token.value, null, null);
        } else if (parser.matchOpToken("[")) {
            var expr = parser.parseElement("expression");
            parser.requireOpToken("]");
            return new ObjectKey(null, expr, { value: expr });
        } else {
            var key = "";
            do {
                token = parser.matchTokenType("IDENTIFIER") || parser.matchOpToken("-");
                if (token) key += token.value;
            } while (token);
            return new ObjectKey(key, null, null);
        }
    }

    resolve(ctx, { value } = {}) {
        if (this.expr) {
            return value;
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
        this.keyExpressions = keyExpressions;
        this.valueExpressions = valueExpressions;
        this.args = { keys: keyExpressions, values: valueExpressions };
    }

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

    resolve(context, { keys, values }) {
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
        this.fields = fields;
        this.args = { values: valueExpressions };
    }

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

    static parse(parser) {
        if (!parser.matchOpToken("(")) return;
        var elt = NamedArgumentList.parseNaked(parser);
        parser.requireOpToken(")");
        return elt;
    }

    resolve(context, { values }) {
        var returnVal = { _namedArgList_: true };
        for (var i = 0; i < values.length; i++) {
            var field = this.fields[i];
            returnVal[field.name.value] = values[i];
        }
        return returnVal;
    }
}

/**
 * NakedNamedArgumentList - Registration proxy for the naked (no parens) variant
 */
export class NakedNamedArgumentList extends Expression {
    static grammarName = "nakedNamedArgumentList";
    static parse = NamedArgumentList.parseNaked;
}

/**
 * StringLike - Matches either a quoted string or a naked string
 */
export class StringLike extends Expression {
    static grammarName = "stringLike";

    static parse(parser) {
        return parser.parseAnyOf(["string", "nakedString"]);
    }
}