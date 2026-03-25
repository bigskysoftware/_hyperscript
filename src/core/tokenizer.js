// Tokenizer - Lexical analysis for _hyperscript

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

// ============================================================
// Tokens - Token stream with matching/consuming API
// ============================================================

export class Tokens {
    #tokens;
    #consumed = [];
    #lastConsumed = null;
    #follows = [];
    source;

    constructor(tokens, source) {
        this.#tokens = tokens;
        this.source = source;
        this.consumeWhitespace();
    }

    get list() {
        return this.#tokens;
    }

    get consumed() {
        return this.#consumed;
    }

    // ----- Token access -----

    /** @returns {Token} */
    currentToken() {
        return this.token(0);
    }

    /**
     * @param {number} n
     * @param {boolean} [includeWhitespace]
     * @returns {Token}
     */
    token(n, includeWhitespace) {
        var token;
        var i = 0;
        do {
            if (!includeWhitespace) {
                while (this.#tokens[i] && this.#tokens[i].type === "WHITESPACE") {
                    i++;
                }
            }
            token = this.#tokens[i];
            n--;
            i++;
        } while (n > -1);
        return token || { type: "EOF", value: "<<<EOF>>>" };
    }

    /** @returns {boolean} */
    hasMore() {
        return this.#tokens.length > 0;
    }

    /** @returns {Token | null} */
    lastMatch() {
        return this.#lastConsumed;
    }

    // ----- Token matching -----

    /**
     * @param {string} value
     * @param {string} [type]
     * @returns {Token | void}
     */
    matchToken(value, type) {
        if (this.#follows.indexOf(value) !== -1) return;
        type = type || "IDENTIFIER";
        if (this.currentToken() && this.currentToken().value === value && this.currentToken().type === type) {
            return this.consumeToken();
        }
    }

    /**
     * @param {string} value
     * @returns {Token | void}
     */
    matchOpToken(value) {
        if (this.currentToken() && this.currentToken().op && this.currentToken().value === value) {
            return this.consumeToken();
        }
    }

    /**
     * @param {...string} types
     * @returns {Token | void}
     */
    matchTokenType(...types) {
        if (this.currentToken() && this.currentToken().type && types.indexOf(this.currentToken().type) >= 0) {
            return this.consumeToken();
        }
    }

    /**
     * @param {...string} tokens
     * @returns {Token | void}
     */
    matchAnyToken(...tokens) {
        for (var i = 0; i < tokens.length; i++) {
            var match = this.matchToken(tokens[i]);
            if (match) return match;
        }
    }

    /**
     * @param {...string} ops
     * @returns {Token | void}
     */
    matchAnyOpToken(...ops) {
        for (var i = 0; i < ops.length; i++) {
            var match = this.matchOpToken(ops[i]);
            if (match) return match;
        }
    }

    // ----- Token requiring -----

    /**
     * @param {string} value
     * @param {string} [type]
     * @returns {Token}
     */
    requireToken(value, type) {
        var token = this.matchToken(value, type);
        if (token) return token;
        this.raiseError("Expected '" + value + "' but found '" + this.currentToken().value + "'");
    }

    /**
     * @param {string} value
     * @returns {Token}
     */
    requireOpToken(value) {
        var token = this.matchOpToken(value);
        if (token) return token;
        this.raiseError("Expected '" + value + "' but found '" + this.currentToken().value + "'");
    }

    /**
     * @param {...string} types
     * @returns {Token}
     */
    requireTokenType(...types) {
        var token = this.matchTokenType(...types);
        if (token) return token;
        this.raiseError("Expected one of " + JSON.stringify(types));
    }

    // ----- Token consuming -----

    /** @returns {Token} */
    consumeToken() {
        var match = this.#tokens.shift();
        this.#consumed.push(match);
        this.#lastConsumed = match;
        this.consumeWhitespace();
        return match;
    }

    consumeWhitespace() {
        while (this.token(0, true).type === "WHITESPACE") {
            this.#consumed.push(this.#tokens.shift());
        }
    }

    /**
     * @param {string | null} value
     * @param {string | null} [type]
     * @returns {Token[]}
     */
    consumeUntil(value, type) {
        var tokenList = [];
        var currentToken = this.token(0, true);
        while (
            (type == null || currentToken.type !== type) &&
            (value == null || currentToken.value !== value) &&
            currentToken.type !== "EOF"
        ) {
            var match = this.#tokens.shift();
            this.#consumed.push(match);
            tokenList.push(currentToken);
            currentToken = this.token(0, true);
        }
        this.consumeWhitespace();
        return tokenList;
    }

    consumeUntilWhitespace() {
        return this.consumeUntil(null, "WHITESPACE");
    }

    // ----- Lookahead -----

    peekToken(value, peek, type) {
        peek = peek || 0;
        type = type || "IDENTIFIER";
        if (this.#tokens[peek] && this.#tokens[peek].value === value && this.#tokens[peek].type === type) {
            return this.#tokens[peek];
        }
    }

    // ----- Whitespace -----

    /** @returns {string} */
    lastWhitespace() {
        var last = this.#consumed[this.#consumed.length - 1];
        return (last && last.type === "WHITESPACE") ? last.value : "";
    }

    // ----- Follow set management -----

    pushFollow(str) {
        this.#follows.push(str);
    }

    popFollow() {
        this.#follows.pop();
    }

    clearFollows() {
        var tmp = this.#follows;
        this.#follows = [];
        return tmp;
    }

    restoreFollows(f) {
        this.#follows = f;
    }

    // ----- Error handling -----

    /**
     * @param {string} [message]
     * @returns {never}
     */
    raiseError(message) {
        message = (message || "Unexpected Token : " + this.currentToken().value) + "\n\n";
        var currentToken = this.currentToken();
        var lines = this.source.split("\n");
        var line = currentToken && currentToken.line ? currentToken.line - 1 : lines.length - 1;
        var contextLine = lines[line];
        var offset = currentToken && currentToken.line ? currentToken.column : contextLine.length - 1;
        message += contextLine + "\n" + " ".repeat(offset) + "^^\n\n";
        var error = new Error(message);
        error["tokens"] = this;
        throw error;
    }
}

// ============================================================
// Tokenizer - Lexical analysis engine
// ============================================================

const OP_TABLE = {
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

export class Tokenizer {

    // ----- Instance state -----
    #source = "";
    #position = 0;
    #column = 0;
    #line = 1;
    #lastToken = "<START>";
    #templateBraceCount = 0;
    #tokens = [];
    #template = false;

    // ----- Character classification -----

    #isAlpha(c) {
        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
    }

    #isNumeric(c) {
        return c >= "0" && c <= "9";
    }

    #isWhitespace(c) {
        return c === " " || c === "\t" || c === "\r" || c === "\n";
    }

    #isNewline(c) {
        return c === "\r" || c === "\n";
    }

    #isValidCSSChar(c) {
        return this.#isAlpha(c) || this.#isNumeric(c) || c === "-" || c === "_" || c === ":";
    }

    #isIdentifierChar(c) {
        return c === "_" || c === "$";
    }

    #isReservedChar(c) {
        return c === "`" || c === "^";
    }

    /**
     * @param {string} string
     * @param {boolean} [template]
     * @returns {Tokens}
     */
    static tokenize(string, template) {
        return new Tokenizer().tokenize(string, template);
    }

    /**
     * @param {string} string
     * @param {boolean} [template]
     * @returns {Tokens}
     */
    tokenize(string, template) {
        this.#source = string;
        this.#position = 0;
        this.#column = 0;
        this.#line = 1;
        this.#lastToken = "<START>";
        this.#templateBraceCount = 0;
        this.#tokens = [];
        this.#template = template || false;
        return this.#tokenize();
    }

    // ----- Character access -----

    #currentChar() {
        return this.#source.charAt(this.#position);
    }

    #nextChar() {
        return this.#source.charAt(this.#position + 1);
    }

    #charAt(offset = 1) {
        return this.#source.charAt(this.#position + offset);
    }

    #consumeChar() {
        this.#lastToken = this.#currentChar();
        this.#position++;
        this.#column++;
        return this.#lastToken;
    }

    // ----- Context checks -----

    #inTemplate() {
        return this.#template && this.#templateBraceCount === 0;
    }

    #possiblePrecedingSymbol() {
        return (
            this.#isAlpha(this.#lastToken) ||
            this.#isNumeric(this.#lastToken) ||
            this.#lastToken === ")" ||
            this.#lastToken === "\"" ||
            this.#lastToken === "'" ||
            this.#lastToken === "`" ||
            this.#lastToken === "}" ||
            this.#lastToken === "]"
        );
    }

    #isValidSingleQuoteStringStart() {
        if (this.#tokens.length > 0) {
            var prev = this.#tokens[this.#tokens.length - 1];
            if (prev.type === "IDENTIFIER" || prev.type === "CLASS_REF" || prev.type === "ID_REF") {
                return false;
            }
            if (prev.op && (prev.value === ">" || prev.value === ")")) {
                return false;
            }
        }
        return true;
    }

    // ----- Token constructors -----

    #makeToken(type, value) {
        return {
            type: type,
            value: value || "",
            start: this.#position,
            end: this.#position + 1,
            column: this.#column,
            line: this.#line,
        };
    }

    #makeOpToken(type, value) {
        var token = this.#makeToken(type, value);
        token.op = true;
        return token;
    }

    // ----- Consume methods -----

    #consumeComment() {
        while (this.#currentChar() && !this.#isNewline(this.#currentChar())) {
            this.#consumeChar();
        }
        this.#consumeChar();
    }

    #consumeMultilineComment() {
        while (this.#currentChar() && !(this.#currentChar() === '*' && this.#nextChar() === '/')) {
            this.#consumeChar();
        }
        this.#consumeChar();
        this.#consumeChar();
    }

    #consumeWhitespace() {
        var ws = this.#makeToken("WHITESPACE");
        var value = "";
        while (this.#currentChar() && this.#isWhitespace(this.#currentChar())) {
            if (this.#isNewline(this.#currentChar())) {
                this.#column = 0;
                this.#line++;
            }
            value += this.#consumeChar();
        }
        ws.value = value;
        ws.end = this.#position;
        return ws;
    }

    #consumeClassReference() {
        var token = this.#makeToken("CLASS_REF");
        var value = this.#consumeChar();
        if (this.#currentChar() === "{") {
            token.template = true;
            value += this.#consumeChar();
            while (this.#currentChar() && this.#currentChar() !== "}") {
                value += this.#consumeChar();
            }
            if (this.#currentChar() !== "}") {
                throw Error("Unterminated class reference");
            } else {
                value += this.#consumeChar();
            }
        } else {
            while (this.#isValidCSSChar(this.#currentChar()) || this.#currentChar() === "\\") {
                if (this.#currentChar() === "\\") this.#consumeChar();
                value += this.#consumeChar();
            }
        }
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeIdReference() {
        var token = this.#makeToken("ID_REF");
        var value = this.#consumeChar();
        if (this.#currentChar() === "{") {
            token.template = true;
            value += this.#consumeChar();
            while (this.#currentChar() && this.#currentChar() !== "}") {
                value += this.#consumeChar();
            }
            if (this.#currentChar() !== "}") {
                throw Error("Unterminated id reference");
            } else {
                this.#consumeChar();
            }
        } else {
            while (this.#isValidCSSChar(this.#currentChar())) {
                value += this.#consumeChar();
            }
        }
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeAttributeReference() {
        var token = this.#makeToken("ATTRIBUTE_REF");
        var value = this.#consumeChar();
        while (this.#position < this.#source.length && this.#currentChar() !== "]") {
            value += this.#consumeChar();
        }
        if (this.#currentChar() === "]") {
            value += this.#consumeChar();
        }
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeShortAttributeReference() {
        var token = this.#makeToken("ATTRIBUTE_REF");
        var value = this.#consumeChar();
        while (this.#isValidCSSChar(this.#currentChar())) {
            value += this.#consumeChar();
        }
        if (this.#currentChar() === '=') {
            value += this.#consumeChar();
            if (this.#currentChar() === '"' || this.#currentChar() === "'") {
                value += this.#consumeString().value;
            } else if (this.#isAlpha(this.#currentChar()) || this.#isNumeric(this.#currentChar()) || this.#isIdentifierChar(this.#currentChar())) {
                value += this.#consumeIdentifier().value;
            }
        }
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeStyleReference() {
        var token = this.#makeToken("STYLE_REF");
        var value = this.#consumeChar();
        while (this.#isAlpha(this.#currentChar()) || this.#currentChar() === "-") {
            value += this.#consumeChar();
        }
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeTemplateIdentifier() {
        var token = this.#makeToken("IDENTIFIER");
        var value = this.#consumeChar();
        var escaped = value === "\\";
        if (escaped) value = "";
        while (this.#isAlpha(this.#currentChar()) ||
               this.#isNumeric(this.#currentChar()) ||
               this.#isIdentifierChar(this.#currentChar()) ||
               this.#currentChar() === "\\" ||
               this.#currentChar() === "{" ||
               this.#currentChar() === "}") {
            if (this.#currentChar() === "$" && !escaped) {
                break;
            } else if (this.#currentChar() === "\\") {
                escaped = true;
                this.#consumeChar();
            } else {
                escaped = false;
                value += this.#consumeChar();
            }
        }
        if (this.#currentChar() === "!" && value === "beep") {
            value += this.#consumeChar();
        }
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeIdentifier() {
        var token = this.#makeToken("IDENTIFIER");
        var value = this.#consumeChar();
        while (this.#isAlpha(this.#currentChar()) || this.#isNumeric(this.#currentChar()) || this.#isIdentifierChar(this.#currentChar())) {
            value += this.#consumeChar();
        }
        if (this.#currentChar() === "!" && value === "beep") {
            value += this.#consumeChar();
        }
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeNumber() {
        var token = this.#makeToken("NUMBER");
        var value = this.#consumeChar();

        // consume integer part: XXX
        while (this.#isNumeric(this.#currentChar())) {
            value += this.#consumeChar();
        }

        // consume decimal part: .YYY
        if (this.#currentChar() === "." && this.#isNumeric(this.#nextChar())) {
            value += this.#consumeChar();
        }
        while (this.#isNumeric(this.#currentChar())) {
            value += this.#consumeChar();
        }

        // consume exponent: (e|E)[-]ZZZ
        if (this.#currentChar() === "e" || this.#currentChar() === "E") {
            if (this.#isNumeric(this.#nextChar())) {
                value += this.#consumeChar();
            } else if (this.#nextChar() === "-") {
                value += this.#consumeChar();
                value += this.#consumeChar();
            }
        }
        while (this.#isNumeric(this.#currentChar())) {
            value += this.#consumeChar();
        }

        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeOp() {
        var token = this.#makeOpToken();
        var value = this.#consumeChar();
        while (this.#currentChar() && OP_TABLE[value + this.#currentChar()]) {
            value += this.#consumeChar();
        }
        token.type = OP_TABLE[value];
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeString() {
        var token = this.#makeToken("STRING");
        var startChar = this.#consumeChar();
        token.template = startChar === "`";
        var value = "";
        while (this.#currentChar() && this.#currentChar() !== startChar) {
            if (this.#currentChar() === "\\") {
                this.#consumeChar();
                let next = this.#consumeChar();
                if (next === "b") value += "\b";
                else if (next === "f") value += "\f";
                else if (next === "n") value += "\n";
                else if (next === "r") value += "\r";
                else if (next === "t") value += "\t";
                else if (next === "v") value += "\v";
                else if (token.template && next === "$") value += "\\$";
                else if (next === "x") {
                    const hex = this.#consumeHexEscape();
                    if (Number.isNaN(hex)) {
                        throw Error("Invalid hexadecimal escape at [Line: " + token.line + ", Column: " + token.column + "]");
                    }
                    value += String.fromCharCode(hex);
                }
                else value += next;
            } else {
                value += this.#consumeChar();
            }
        }
        if (this.#currentChar() !== startChar) {
            throw Error("Unterminated string at [Line: " + token.line + ", Column: " + token.column + "]");
        } else {
            this.#consumeChar();
        }
        token.value = value;
        token.end = this.#position;
        return token;
    }

    #consumeHexEscape() {
        if (!this.#currentChar()) return NaN;
        let result = 16 * Number.parseInt(this.#consumeChar(), 16);
        if (!this.#currentChar()) return NaN;
        result += Number.parseInt(this.#consumeChar(), 16);
        return result;
    }

    // ----- Main tokenization loop -----

    #isLineComment() {
        var c = this.#currentChar(), n = this.#nextChar(), n2 = this.#charAt(2);
        return (c === "-" && n === "-" && (this.#isWhitespace(n2) || n2 === "" || n2 === "-"))
            || (c === "/" && n === "/" && (this.#isWhitespace(n2) || n2 === "" || n2 === "/"));
    }

    #isBlockComment() {
        var c = this.#currentChar(), n = this.#nextChar(), n2 = this.#charAt(2);
        return c === "/" && n === "*" && (this.#isWhitespace(n2) || n2 === "" || n2 === "*");
    }

    #tokenize() {
        while (this.#position < this.#source.length) {
            if (this.#isLineComment()) {
                this.#consumeComment();
            } else if (this.#isBlockComment()) {
                this.#consumeMultilineComment();
            } else if (this.#isWhitespace(this.#currentChar())) {
                this.#tokens.push(this.#consumeWhitespace());
            } else if (
                !this.#possiblePrecedingSymbol() &&
                this.#currentChar() === "." &&
                (this.#isAlpha(this.#nextChar()) || this.#nextChar() === "{" || this.#nextChar() === "-")
            ) {
                this.#tokens.push(this.#consumeClassReference());
            } else if (
                !this.#possiblePrecedingSymbol() &&
                this.#currentChar() === "#" &&
                (this.#isAlpha(this.#nextChar()) || this.#nextChar() === "{")
            ) {
                this.#tokens.push(this.#consumeIdReference());
            } else if (this.#currentChar() === "[" && this.#nextChar() === "@") {
                this.#tokens.push(this.#consumeAttributeReference());
            } else if (this.#currentChar() === "@") {
                this.#tokens.push(this.#consumeShortAttributeReference());
            } else if (this.#currentChar() === "*" && this.#isAlpha(this.#nextChar())) {
                this.#tokens.push(this.#consumeStyleReference());
            } else if (this.#inTemplate() && (this.#isAlpha(this.#currentChar()) || this.#currentChar() === "\\")) {
                this.#tokens.push(this.#consumeTemplateIdentifier());
            } else if (!this.#inTemplate() && (this.#isAlpha(this.#currentChar()) || this.#isIdentifierChar(this.#currentChar()))) {
                this.#tokens.push(this.#consumeIdentifier());
            } else if (this.#isNumeric(this.#currentChar())) {
                this.#tokens.push(this.#consumeNumber());
            } else if (!this.#inTemplate() && (this.#currentChar() === '"' || this.#currentChar() === "`")) {
                this.#tokens.push(this.#consumeString());
            } else if (!this.#inTemplate() && this.#currentChar() === "'") {
                if (this.#isValidSingleQuoteStringStart()) {
                    this.#tokens.push(this.#consumeString());
                } else {
                    this.#tokens.push(this.#consumeOp());
                }
            } else if (OP_TABLE[this.#currentChar()]) {
                if (this.#lastToken === "$" && this.#currentChar() === "{") {
                    this.#templateBraceCount++;
                }
                if (this.#currentChar() === "}") {
                    this.#templateBraceCount--;
                }
                this.#tokens.push(this.#consumeOp());
            } else if (this.#inTemplate() || this.#isReservedChar(this.#currentChar())) {
                this.#tokens.push(this.#makeToken("RESERVED", this.#consumeChar()));
            } else {
                if (this.#position < this.#source.length) {
                    throw Error("Unknown token: " + this.#currentChar() + " ");
                }
            }
        }

        return new Tokens(this.#tokens, this.#source);
    }
}
