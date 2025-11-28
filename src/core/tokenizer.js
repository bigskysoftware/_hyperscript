// Tokenizer - Tokenization for _hyperscript
import { Tokens } from './tokens.js';

export class Tokenizer {
    static OP_TABLE = {
        "+": "PLUS",
        "-": "MINUS",
        "*": "MULTIPLY",
        "/": "DIVIDE",
        ".": "PERIOD",
        "..": "ELLIPSIS",
        "\\": "BACKSLASH",
        ":": "COLON",
        "%": "PERCENT",
        "|": "PIPE",
        "!": "EXCLAMATION",
        "?": "QUESTION",
        "#": "POUND",
        "&": "AMPERSAND",
        "$": "DOLLAR",
        ";": "SEMI",
        ",": "COMMA",
        "(": "L_PAREN",
        ")": "R_PAREN",
        "<": "L_ANG",
        ">": "R_ANG",
        "<=": "LTE_ANG",
        ">=": "GTE_ANG",
        "==": "EQ",
        "===": "EQQ",
        "!=": "NEQ",
        "!==": "NEQQ",
        "{": "L_BRACE",
        "}": "R_BRACE",
        "[": "L_BRACKET",
        "]": "R_BRACKET",
        "=": "EQUALS",
        "~": "TILDE",
    };

    /**
     * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
     * @param {string} c
     * @returns boolean
     */
    static isValidCSSClassChar(c) {
        return Tokenizer.isAlpha(c) || Tokenizer.isNumeric(c) || c === "-" || c === "_" || c === ":";
    }

    /**
     * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
     * @param {string} c
     * @returns boolean
     */
    static isValidCSSIDChar(c) {
        return Tokenizer.isAlpha(c) || Tokenizer.isNumeric(c) || c === "-" || c === "_" || c === ":";
    }

    /**
     * isWhitespace returns `true` if the provided character is whitespace.
     * @param {string} c
     * @returns boolean
     */
    static isWhitespace(c) {
        return c === " " || c === "\t" || Tokenizer.isNewline(c);
    }

    /**
     * positionString returns a string representation of a Token's line and column details.
     * @param {Token} token
     * @returns string
     */
    static positionString(token) {
        return "[Line: " + token.line + ", Column: " + token.column + "]";
    }

    /**
     * isNewline returns `true` if the provided character is a carriage return or newline
     * @param {string} c
     * @returns boolean
     */
    static isNewline(c) {
        return c === "\r" || c === "\n";
    }

    /**
     * isNumeric returns `true` if the provided character is a number (0-9)
     * @param {string} c
     * @returns boolean
     */
    static isNumeric(c) {
        return c >= "0" && c <= "9";
    }

    /**
     * isAlpha returns `true` if the provided character is a letter in the alphabet
     * @param {string} c
     * @returns boolean
     */
    static isAlpha(c) {
        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
    }

    /**
     * @param {string} c
     * @param {boolean} [dollarIsOp]
     * @returns boolean
     */
    static isIdentifierChar(c, dollarIsOp) {
        return c === "_" || c === "$";
    }

    /**
     * @param {string} c
     * @returns boolean
     */
    static isReservedChar(c) {
        return c === "`" || c === "^";
    }

    /**
     * @param {Token[]} tokens
     * @returns {boolean}
     */
    static isValidSingleQuoteStringStart(tokens) {
        if (tokens.length > 0) {
            var previousToken = tokens[tokens.length - 1];
            if (
                previousToken.type === "IDENTIFIER" ||
                previousToken.type === "CLASS_REF" ||
                previousToken.type === "ID_REF"
            ) {
                return false;
            }
            if (previousToken.op && (previousToken.value === ">" || previousToken.value === ")")) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param {string} string
     * @param {boolean} [template]
     * @returns {Tokens}
     */
    static tokenize(string, template) {

        var tokens = /** @type {Token[]}*/ [];
        var source = string;
        var position = 0;
        var column = 0;
        var line = 1;
        var lastToken = "<START>";
        var templateBraceCount = 0;

        function inTemplate() {
            return template && templateBraceCount === 0;
        }

        while (position < source.length) {
            if ((currentChar() === "-" && nextChar() === "-" && (Tokenizer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "-"))
                || (currentChar() === "/" && nextChar() === "/" && (Tokenizer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "/"))) {
                consumeComment();
            } else if (currentChar() === "/" && nextChar() === "*" && (Tokenizer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "*")) {
                consumeCommentMultiline();
            } else {
                if (Tokenizer.isWhitespace(currentChar())) {
                    tokens.push(consumeWhitespace());
                } else if (
                    !possiblePrecedingSymbol() &&
                    currentChar() === "." &&
                    (Tokenizer.isAlpha(nextChar()) || nextChar() === "{" || nextChar() === "-")
                ) {
                    tokens.push(consumeClassReference());
                } else if (
                    !possiblePrecedingSymbol() &&
                    currentChar() === "#" &&
                    (Tokenizer.isAlpha(nextChar()) || nextChar() === "{")
                ) {
                    tokens.push(consumeIdReference());
                } else if (currentChar() === "[" && nextChar() === "@") {
                    tokens.push(consumeAttributeReference());
                } else if (currentChar() === "@") {
                    tokens.push(consumeShortAttributeReference());
                } else if (currentChar() === "*" && Tokenizer.isAlpha(nextChar())) {
                    tokens.push(consumeStyleReference());
                } else if (inTemplate() && (Tokenizer.isAlpha(currentChar()) || currentChar() === "\\")) {
                    tokens.push(consumeTemplateIdentifier());
                } else if (!inTemplate() && (Tokenizer.isAlpha(currentChar()) || Tokenizer.isIdentifierChar(currentChar()))) {
                    tokens.push(consumeIdentifier());
                } else if (Tokenizer.isNumeric(currentChar())) {
                    tokens.push(consumeNumber());
                } else if (!inTemplate() && (currentChar() === '"' || currentChar() === "`")) {
                    tokens.push(consumeString());
                } else if (!inTemplate() && currentChar() === "'") {
                    if (Tokenizer.isValidSingleQuoteStringStart(tokens)) {
                        tokens.push(consumeString());
                    } else {
                        tokens.push(consumeOp());
                    }
                } else if (Tokenizer.OP_TABLE[currentChar()]) {
                    if (lastToken === "$" && currentChar() === "{") {
                        templateBraceCount++;
                    }
                    if (currentChar() === "}") {
                        templateBraceCount--;
                    }
                    tokens.push(consumeOp());
                } else if (inTemplate() || Tokenizer.isReservedChar(currentChar())) {
                    tokens.push(makeToken("RESERVED", consumeChar()));
                } else {
                    if (position < source.length) {
                        throw Error("Unknown token: " + currentChar() + " ");
                    }
                }
            }
        }

        return new Tokens(tokens, [], source);

        /**
         * @param {string} [type]
         * @param {string} [value]
         * @returns {Token}
         */
        function makeOpToken(type, value) {
            var token = makeToken(type, value);
            token.op = true;
            return token;
        }

        /**
         * @param {string} [type]
         * @param {string} [value]
         * @returns {Token}
         */
        function makeToken(type, value) {
            return {
                type: type,
                value: value || "",
                start: position,
                end: position + 1,
                column: column,
                line: line,
            };
        }

        function consumeComment() {
            while (currentChar() && !Tokenizer.isNewline(currentChar())) {
                consumeChar();
            }
            consumeChar(); // Consume newline
        }

        function consumeCommentMultiline() {
            while (currentChar() && !(currentChar() === '*' && nextChar() === '/')) {
                consumeChar();
            }
            consumeChar(); // Consume "*/"
            consumeChar();
        }

        /**
         * @returns Token
         */
        function consumeClassReference() {
            var classRef = makeToken("CLASS_REF");
            var value = consumeChar();
            if (currentChar() === "{") {
                classRef.template = true;
                value += consumeChar();
                while (currentChar() && currentChar() !== "}") {
                    value += consumeChar();
                }
                if (currentChar() !== "}") {
                    throw Error("Unterminated class reference");
                } else {
                    value += consumeChar(); // consume final curly
                }
            } else {
                while (Tokenizer.isValidCSSClassChar(currentChar()) || currentChar() === "\\") {
                    if (currentChar() === "\\") {
                        consumeChar();
                    }
                    value += consumeChar();
                }
            }
            classRef.value = value;
            classRef.end = position;
            return classRef;
        }

        /**
         * @returns Token
         */
        function consumeAttributeReference() {
            var attributeRef = makeToken("ATTRIBUTE_REF");
            var value = consumeChar();
            while (position < source.length && currentChar() !== "]") {
                value += consumeChar();
            }
            if (currentChar() === "]") {
                value += consumeChar();
            }
            attributeRef.value = value;
            attributeRef.end = position;
            return attributeRef;
        }

        function consumeShortAttributeReference() {
            var attributeRef = makeToken("ATTRIBUTE_REF");
            var value = consumeChar();
            while (Tokenizer.isValidCSSIDChar(currentChar())) {
                value += consumeChar();
            }
            if (currentChar() === '=') {
                value += consumeChar();
                if (currentChar() === '"' || currentChar() === "'") {
                    let stringValue = consumeString();
                    value += stringValue.value;
                } else if(Tokenizer.isAlpha(currentChar()) ||
                    Tokenizer.isNumeric(currentChar()) ||
                    Tokenizer.isIdentifierChar(currentChar())) {
                    let id = consumeIdentifier();
                    value += id.value;
                }
            }
            attributeRef.value = value;
            attributeRef.end = position;
            return attributeRef;
        }

        function consumeStyleReference() {
            var styleRef = makeToken("STYLE_REF");
            var value = consumeChar();
            while (Tokenizer.isAlpha(currentChar()) || currentChar() === "-") {
                value += consumeChar();
            }
            styleRef.value = value;
            styleRef.end = position;
            return styleRef;
        }

        /**
         * @returns Token
         */
        function consumeIdReference() {
            var idRef = makeToken("ID_REF");
            var value = consumeChar();
            if (currentChar() === "{") {
                idRef.template = true;
                value += consumeChar();
                while (currentChar() && currentChar() !== "}") {
                    value += consumeChar();
                }
                if (currentChar() !== "}") {
                    throw Error("Unterminated id reference");
                } else {
                    consumeChar(); // consume final quote
                }
            } else {
                while (Tokenizer.isValidCSSIDChar(currentChar())) {
                    value += consumeChar();
                }
            }
            idRef.value = value;
            idRef.end = position;
            return idRef;
        }

        /**
         * @returns Token
         */
        function consumeTemplateIdentifier() {
            var identifier = makeToken("IDENTIFIER");
            var value = consumeChar();
            var escd = value === "\\";
            if (escd) {
                value = "";
            }
            while (Tokenizer.isAlpha(currentChar()) ||
                   Tokenizer.isNumeric(currentChar()) ||
                   Tokenizer.isIdentifierChar(currentChar()) ||
                   currentChar() === "\\" ||
                   currentChar() === "{" ||
                   currentChar() === "}" ) {
                if (currentChar() === "$" && escd === false) {
                    break;
                } else if (currentChar() === "\\") {
                    escd = true;
                    consumeChar();
                } else {
                    escd = false;
                    value += consumeChar();
                }
            }
            if (currentChar() === "!" && value === "beep") {
                value += consumeChar();
            }
            identifier.value = value;
            identifier.end = position;
            return identifier;
        }

        /**
         * @returns Token
         */
        function consumeIdentifier() {
            var identifier = makeToken("IDENTIFIER");
            var value = consumeChar();
            while (Tokenizer.isAlpha(currentChar()) ||
                   Tokenizer.isNumeric(currentChar()) ||
                   Tokenizer.isIdentifierChar(currentChar())) {
                value += consumeChar();
            }
            if (currentChar() === "!" && value === "beep") {
                value += consumeChar();
            }
            identifier.value = value;
            identifier.end = position;
            return identifier;
        }

        /**
         * @returns Token
         */
        function consumeNumber() {
            var number = makeToken("NUMBER");
            var value = consumeChar();

            // given possible XXX.YYY(e|E)[-]ZZZ consume XXX
            while (Tokenizer.isNumeric(currentChar())) {
                value += consumeChar();
            }

            // consume .YYY
            if (currentChar() === "." && Tokenizer.isNumeric(nextChar())) {
                value += consumeChar();
            }
            while (Tokenizer.isNumeric(currentChar())) {
                value += consumeChar();
            }

            // consume (e|E)[-]
            if (currentChar() === "e" || currentChar() === "E") {
                // possible scientific notation, e.g. 1e6 or 1e-6
                if (Tokenizer.isNumeric(nextChar())) {
                    // e.g. 1e6
                    value += consumeChar();
                } else if (nextChar() === "-") {
                    // e.g. 1e-6
                    value += consumeChar();
                    // consume the - as well since otherwise we would stop on the next loop
                    value += consumeChar();
                }
            }

            // consume ZZZ
            while (Tokenizer.isNumeric(currentChar())) {
                value += consumeChar();
            }
            number.value = value;
            number.end = position;
            return number;
        }

        /**
         * @returns Token
         */
        function consumeOp() {
            var op = makeOpToken();
            var value = consumeChar(); // consume leading char
            while (currentChar() && Tokenizer.OP_TABLE[value + currentChar()]) {
                value += consumeChar();
            }
            op.type = Tokenizer.OP_TABLE[value];
            op.value = value;
            op.end = position;
            return op;
        }

        /**
         * @returns Token
         */
        function consumeString() {
            var string = makeToken("STRING");
            var startChar = consumeChar(); // consume leading quote
            string.template = startChar === "`";
            var value = "";
            while (currentChar() && currentChar() !== startChar) {
                if (currentChar() === "\\") {
                    consumeChar(); // consume escape char and get the next one
                    let nextChar = consumeChar();
                    if (nextChar === "b") {
                        value += "\b";
                    } else if (nextChar === "f") {
                        value += "\f";
                    } else if (nextChar === "n") {
                        value += "\n";
                    } else if (nextChar === "r") {
                        value += "\r";
                    } else if (nextChar === "t") {
                        value += "\t";
                    } else if (nextChar === "v") {
                        value += "\v";
                    } else if (string.template && nextChar === "$") {
                        value += "\\$";
                    } else if (nextChar === "x") {
                        const hex = consumeHexEscape();
                        if (Number.isNaN(hex)) {
                            throw Error("Invalid hexadecimal escape at " + Tokenizer.positionString(string));
                        }
                        value += String.fromCharCode(hex);
                    } else {
                        value += nextChar;
                    }
                } else {
                    value += consumeChar();
                }
            }
            if (currentChar() !== startChar) {
                throw Error("Unterminated string at " + Tokenizer.positionString(string));
            } else {
                consumeChar(); // consume final quote
            }
            string.value = value;
            string.end = position;
            return string;
        }

        /**
         * @returns number
         */
        function consumeHexEscape() {
            const BASE = 16;
            if (!currentChar()) {
                return NaN;
            }
            let result = BASE * Number.parseInt(consumeChar(), BASE);
            if (!currentChar()) {
                return NaN;
            }
            result += Number.parseInt(consumeChar(), BASE);

            return result;
        }

        /**
         * @returns string
         */
        function currentChar() {
            return source.charAt(position);
        }

        /**
         * @returns string
         */
        function nextChar() {
            return source.charAt(position + 1);
        }

        function nextCharAt(number = 1) {
            return source.charAt(position + number);
        }

        /**
         * @returns string
         */
        function consumeChar() {
            lastToken = currentChar();
            position++;
            column++;
            return lastToken;
        }

        /**
         * @returns boolean
         */
        function possiblePrecedingSymbol() {
            return (
                Tokenizer.isAlpha(lastToken) ||
                Tokenizer.isNumeric(lastToken) ||
                lastToken === ")" ||
                lastToken === "\"" ||
                lastToken === "'" ||
                lastToken === "`" ||
                lastToken === "}" ||
                lastToken === "]"
            );
        }

        /**
         * @returns Token
         */
        function consumeWhitespace() {
            var whitespace = makeToken("WHITESPACE");
            var value = "";
            while (currentChar() && Tokenizer.isWhitespace(currentChar())) {
                if (Tokenizer.isNewline(currentChar())) {
                    column = 0;
                    line++;
                }
                value += consumeChar();
            }
            whitespace.value = value;
            whitespace.end = position;
            return whitespace;
        }
    }

    /**
     * @param {string} string
     * @param {boolean} [template]
     * @returns {Tokens}
     */
    tokenize(string, template) {
        return Tokenizer.tokenize(string, template)
    }
}

/**
 * @typedef {Object} Token
 * @property {string} [type]
 * @property {string} value
 * @property {number} [start]
 * @property {number} [end]
 * @property {number} [column]
 * @property {number} [line]
 * @property {boolean} [op] `true` if this token represents an operator
 * @property {boolean} [template] `true` if this token is a template, for class refs, id refs, strings
 */
