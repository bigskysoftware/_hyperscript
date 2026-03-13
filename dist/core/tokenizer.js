// Tokenizer - Tokenization for _hyperscript

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

export class Tokens {
    constructor(tokens, consumed, source) {
        this.tokens = tokens
        this.consumed = consumed
        this.source = source

        this.consumeWhitespace(); // consume initial whitespace
    }

    get list() {
        return this.tokens
    }

    /** @type Token | null */
    _lastConsumed = null;

    consumeWhitespace() {
        while (this.token(0, true).type === "WHITESPACE") {
            this.consumed.push(this.tokens.shift());
        }
    }

    /**
     * @param {Tokens} tokens
     * @param {*} error
     * @returns {never}
     */
    raiseError(tokens, error) {
        // This will be set by LanguageKernel when it's initialized
        if (Tokens._parserRaiseError) {
            Tokens._parserRaiseError(tokens, error);
        } else {
            throw new Error(error);
        }
    }

    /**
     * @param {string} value
     * @returns {Token}
     */
    requireOpToken(value) {
        var token = this.matchOpToken(value);
        if (token) {
            return token;
        } else {
            this.raiseError(this, "Expected '" + value + "' but found '" + this.currentToken().value + "'");
        }
    }

    /**
     * @param {...string} ops
     * @returns {Token | void}
     */
    matchAnyOpToken(...ops) {
        for (var i = 0; i < ops.length; i++) {
            var opToken = ops[i];
            var match = this.matchOpToken(opToken);
            if (match) {
                return match;
            }
        }
    }

    /**
     * @param {...string} tokens
     * @returns {Token | void}
     */
    matchAnyToken(...tokens) {
        for (var i = 0; i < tokens.length; i++) {
            var opToken = tokens[i];
            var match = this.matchToken(opToken);
            if (match) {
                return match;
            }
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
     * @param {string} type1
     * @param {string} [type2]
     * @param {string} [type3]
     * @param {string} [type4]
     * @returns {Token}
     */
    requireTokenType(type1, type2, type3, type4) {
        var token = this.matchTokenType(type1, type2, type3, type4);
        if (token) {
            return token;
        } else {
            this.raiseError(this, "Expected one of " + JSON.stringify([type1, type2, type3]));
        }
    }

    /**
     * @param {string} type1
     * @param {string} [type2]
     * @param {string} [type3]
     * @param {string} [type4]
     * @returns {Token | void}
     */
    matchTokenType(type1, type2, type3, type4) {
        if (
            this.currentToken() &&
            this.currentToken().type &&
            [type1, type2, type3, type4].indexOf(this.currentToken().type) >= 0
        ) {
            return this.consumeToken();
        }
    }

    /**
     * @param {string} value
     * @param {string} [type]
     * @returns {Token}
     */
    requireToken(value, type) {
        var token = this.matchToken(value, type);
        if (token) {
            return token;
        } else {
            this.raiseError(this, "Expected '" + value + "' but found '" + this.currentToken().value + "'");
        }
    }

    peekToken(value, peek, type) {
        peek = peek || 0;
        type = type || "IDENTIFIER";

        //TODO: This feels weird, should we really have to know the tokens value to see it?
        if(this.tokens[peek] && this.tokens[peek].value === value && this.tokens[peek].type === type){
            return this.tokens[peek];
        }
    }

    /**
     * @param {string} value
     * @param {string} [type]
     * @returns {Token | void}
     */
    matchToken(value, type) {
        if (this.follows.indexOf(value) !== -1) {
            return; // disallowed token here
        }
        type = type || "IDENTIFIER";
        if (this.currentToken() && this.currentToken().value === value && this.currentToken().type === type) {
            return this.consumeToken();
        }
    }

    /**
     * @returns {Token}
     */
    consumeToken() {
        var match = this.tokens.shift();
        this.consumed.push(match);
        this._lastConsumed = match;
        this.consumeWhitespace(); // consume any whitespace
        return match;
    }

    /**
     * @param {string | null} value
     * @param {string | null} [type]
     * @returns {Token[]}
     */
    consumeUntil(value, type) {
        /** @type Token[] */
        var tokenList = [];
        var currentToken = this.token(0, true);

        while (
            (type == null || currentToken.type !== type) &&
            (value == null || currentToken.value !== value) &&
            currentToken.type !== "EOF"
        ) {
            var match = this.tokens.shift();
            this.consumed.push(match);
            tokenList.push(currentToken);
            currentToken = this.token(0, true);
        }
        this.consumeWhitespace(); // consume any whitespace
        return tokenList;
    }

    /**
     * @returns {string}
     */
    lastWhitespace() {
        if (this.consumed[this.consumed.length - 1] && this.consumed[this.consumed.length - 1].type === "WHITESPACE") {
            return this.consumed[this.consumed.length - 1].value;
        } else {
            return "";
        }
    }

    consumeUntilWhitespace() {
        return this.consumeUntil(null, "WHITESPACE");
    }

    /**
     * @returns {boolean}
     */
    hasMore() {
        return this.tokens.length > 0;
    }

    /**
     * @param {number} n
     * @param {boolean} [dontIgnoreWhitespace]
     * @returns {Token}
     */
    token(n, dontIgnoreWhitespace) {
        var /**@type {Token}*/ token;
        var i = 0;
        do {
            if (!dontIgnoreWhitespace) {
                while (this.tokens[i] && this.tokens[i].type === "WHITESPACE") {
                    i++;
                }
            }
            token = this.tokens[i];
            n--;
            i++;
        } while (n > -1);
        if (token) {
            return token;
        } else {
            return {
                type: "EOF",
                value: "<<<EOF>>>",
            };
        }
    }

    /**
     * @returns {Token}
     */
    currentToken() {
        return this.token(0);
    }

    /**
     * @returns {Token | null}
     */
    lastMatch() {
        return this._lastConsumed;
    }

    /**
     * @returns {string}
     */
    static sourceFor = function () {
        return this.programSource.substring(this.startToken.start, this.endToken.end);
    }

    /**
     * @returns {string}
     */
    static lineFor = function () {
        return this.programSource.split("\n")[this.startToken.line - 1];
    }

    follows = [];

    pushFollow(str) {
        this.follows.push(str);
    }

    popFollow() {
        this.follows.pop();
    }

    clearFollows() {
        var tmp = this.follows;
        this.follows = [];
        return tmp;
    }

    restoreFollows(f) {
        this.follows = f;
    }
}

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

    // Instance state for tokenization
    #source = "";
    #position = 0;
    #column = 0;
    #line = 1;
    #lastToken = "<START>";
    #templateBraceCount = 0;
    #tokens = [];
    #template = false;

    /**
     * Initialize tokenization state
     * @param {string} string
     * @param {boolean} [template]
     */
    #initializeState(string, template) {
        this.#source = string;
        this.#position = 0;
        this.#column = 0;
        this.#line = 1;
        this.#lastToken = "<START>";
        this.#templateBraceCount = 0;
        this.#tokens = [];
        this.#template = template || false;
    }

    /**
     * @param {string} c
     * @returns {boolean}
     */
    #isValidCSSClassChar(c) {
        return Tokenizer.isAlpha(c) || Tokenizer.isNumeric(c) || c === "-" || c === "_" || c === ":";
    }

    /**
     * @param {string} c
     * @returns {boolean}
     */
    #isValidCSSIDChar(c) {
        return Tokenizer.isAlpha(c) || Tokenizer.isNumeric(c) || c === "-" || c === "_" || c === ":";
    }

    /**
     * @param {string} c
     * @returns {boolean}
     */
    #isIdentifierChar(c) {
        return c === "_" || c === "$";
    }

    /**
     * @param {string} c
     * @returns {boolean}
     */
    #isReservedChar(c) {
        return c === "`" || c === "^";
    }

    /**
     * @param {Token[]} tokens
     * @returns {boolean}
     */
    #isValidSingleQuoteStringStart(tokens) {
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
     * @returns {boolean}
     */
    #inTemplate() {
        return this.#template && this.#templateBraceCount === 0;
    }

    /**
     * @returns {string}
     */
    #currentChar() {
        return this.#source.charAt(this.#position);
    }

    /**
     * @returns {string}
     */
    #nextChar() {
        return this.#source.charAt(this.#position + 1);
    }

    /**
     * @param {number} number
     * @returns {string}
     */
    #nextCharAt(number = 1) {
        return this.#source.charAt(this.#position + number);
    }

    /**
     * @returns {string}
     */
    #consumeChar() {
        this.#lastToken = this.#currentChar();
        this.#position++;
        this.#column++;
        return this.#lastToken;
    }

    /**
     * @returns {boolean}
     */
    #possiblePrecedingSymbol() {
        return (
            Tokenizer.isAlpha(this.#lastToken) ||
            Tokenizer.isNumeric(this.#lastToken) ||
            this.#lastToken === ")" ||
            this.#lastToken === "\"" ||
            this.#lastToken === "'" ||
            this.#lastToken === "`" ||
            this.#lastToken === "}" ||
            this.#lastToken === "]"
        );
    }

    /**
     * @param {string} [type]
     * @param {string} [value]
     * @returns {Token}
     */
    #makeToken(type, value) {
        // Makes a single character token
        return {
            type: type,
            value: value || "",
            start: this.#position,
            end: this.#position + 1,
            column: this.#column,
            line: this.#line,
        };
    }

    /**
     * @param {string} [type]
     * @param {string} [value]
     * @returns {Token}
     */
    #makeOpToken(type, value) { // Examples: +   -   *   /   =   ==   !=   <   >   <=   >=   &&   ||   !
        var token = this.#makeToken(type, value);
        token.op = true;
        return token;
    }

    #consumeComment() {
        while (this.#currentChar() && !Tokenizer.isNewline(this.#currentChar())) {
            this.#consumeChar();
        }
        this.#consumeChar(); // Consume newline
    }

    #consumeCommentMultiline() {
        while (this.#currentChar() && !(this.#currentChar() === '*' && this.#nextChar() === '/')) {
            this.#consumeChar();
        }
        this.#consumeChar(); // Consume "*/"
        this.#consumeChar();
    }

    /**
     * @returns {Token}
     */
    #consumeWhitespace() {
        var whitespace = this.#makeToken("WHITESPACE");
        var value = "";
        while (this.#currentChar() && Tokenizer.isWhitespace(this.#currentChar())) {
            if (Tokenizer.isNewline(this.#currentChar())) {
                this.#column = 0;
                this.#line++;
            }
            value += this.#consumeChar();
        }
        whitespace.value = value;
        whitespace.end = this.#position;
        return whitespace;
    }

    /**
     * @returns {Token}
     */
    #consumeClassReference() {
        var classRef = this.#makeToken("CLASS_REF");
        var value = this.#consumeChar();
        if (this.#currentChar() === "{") {
            classRef.template = true;
            value += this.#consumeChar();
            while (this.#currentChar() && this.#currentChar() !== "}") {
                value += this.#consumeChar();
            }
            if (this.#currentChar() !== "}") {
                throw Error("Unterminated class reference");
            } else {
                value += this.#consumeChar(); // consume final curly
            }
        } else {
            while (this.#isValidCSSClassChar(this.#currentChar()) || this.#currentChar() === "\\") {
                if (this.#currentChar() === "\\") {
                    this.#consumeChar();
                }
                value += this.#consumeChar();
            }
        }
        classRef.value = value;
        classRef.end = this.#position;
        return classRef;
    }

    /**
     * @returns {Token}
     */
    #consumeIdReference() {
        var idRef = this.#makeToken("ID_REF");
        var value = this.#consumeChar();
        if (this.#currentChar() === "{") {
            idRef.template = true;
            value += this.#consumeChar();
            while (this.#currentChar() && this.#currentChar() !== "}") {
                value += this.#consumeChar();
            }
            if (this.#currentChar() !== "}") {
                throw Error("Unterminated id reference");
            } else {
                this.#consumeChar(); // consume final quote
            }
        } else {
            while (this.#isValidCSSIDChar(this.#currentChar())) {
                value += this.#consumeChar();
            }
        }
        idRef.value = value;
        idRef.end = this.#position;
        return idRef;
    }

    /**
     * @returns {Token}
     */
    #consumeAttributeReference() {
        var attributeRef = this.#makeToken("ATTRIBUTE_REF");
        var value = this.#consumeChar();
        while (this.#position < this.#source.length && this.#currentChar() !== "]") {
            value += this.#consumeChar();
        }
        if (this.#currentChar() === "]") {
            value += this.#consumeChar();
        }
        attributeRef.value = value;
        attributeRef.end = this.#position;
        return attributeRef;
    }

    #consumeShortAttributeReference() {
        var attributeRef = this.#makeToken("ATTRIBUTE_REF");
        var value = this.#consumeChar();
        while (this.#isValidCSSIDChar(this.#currentChar())) {
            value += this.#consumeChar();
        }
        if (this.#currentChar() === '=') {
            value += this.#consumeChar();
            if (this.#currentChar() === '"' || this.#currentChar() === "'") {
                let stringValue = this.#consumeString();
                value += stringValue.value;
            } else if(Tokenizer.isAlpha(this.#currentChar()) ||
                Tokenizer.isNumeric(this.#currentChar()) ||
                this.#isIdentifierChar(this.#currentChar())) {
                let id = this.#consumeIdentifier();
                value += id.value;
            }
        }
        attributeRef.value = value;
        attributeRef.end = this.#position;
        return attributeRef;
    }

    #consumeStyleReference() {
        var styleRef = this.#makeToken("STYLE_REF");
        var value = this.#consumeChar();
        while (Tokenizer.isAlpha(this.#currentChar()) || this.#currentChar() === "-") {
            value += this.#consumeChar();
        }
        styleRef.value = value;
        styleRef.end = this.#position;
        return styleRef;
    }

    /**
     * @returns {Token}
     */
    #consumeTemplateIdentifier() {
        var identifier = this.#makeToken("IDENTIFIER");
        var value = this.#consumeChar();
        var escd = value === "\\";
        if (escd) {
            value = "";
        }
        while (Tokenizer.isAlpha(this.#currentChar()) ||
               Tokenizer.isNumeric(this.#currentChar()) ||
               this.#isIdentifierChar(this.#currentChar()) ||
               this.#currentChar() === "\\" ||
               this.#currentChar() === "{" ||
               this.#currentChar() === "}" ) {
            if (this.#currentChar() === "$" && escd === false) {
                break;
            } else if (this.#currentChar() === "\\") {
                escd = true;
                this.#consumeChar();
            } else {
                escd = false;
                value += this.#consumeChar();
            }
        }
        if (this.#currentChar() === "!" && value === "beep") {
            value += this.#consumeChar();
        }
        identifier.value = value;
        identifier.end = this.#position;
        return identifier;
    }

    /**
     * @returns {Token}
     */
    #consumeIdentifier() {
        var identifier = this.#makeToken("IDENTIFIER");
        var value = this.#consumeChar();
        while (Tokenizer.isAlpha(this.#currentChar()) ||
               Tokenizer.isNumeric(this.#currentChar()) ||
               this.#isIdentifierChar(this.#currentChar())) {
            value += this.#consumeChar();
        }
        if (this.#currentChar() === "!" && value === "beep") {
            value += this.#consumeChar();
        }
        identifier.value = value;
        identifier.end = this.#position;
        return identifier;
    }

    /**
     * @returns {Token}
     */
    #consumeNumber() {
        var number = this.#makeToken("NUMBER");
        var value = this.#consumeChar();

        // given possible XXX.YYY(e|E)[-]ZZZ consume XXX
        while (Tokenizer.isNumeric(this.#currentChar())) {
            value += this.#consumeChar();
        }

        // consume .YYY
        if (this.#currentChar() === "." && Tokenizer.isNumeric(this.#nextChar())) {
            value += this.#consumeChar();
        }
        while (Tokenizer.isNumeric(this.#currentChar())) {
            value += this.#consumeChar();
        }

        // consume (e|E)[-]
        if (this.#currentChar() === "e" || this.#currentChar() === "E") {
            // possible scientific notation, e.g. 1e6 or 1e-6
            if (Tokenizer.isNumeric(this.#nextChar())) {
                // e.g. 1e6
                value += this.#consumeChar();
            } else if (this.#nextChar() === "-") {
                // e.g. 1e-6
                value += this.#consumeChar();
                // consume the - as well since otherwise we would stop on the next loop
                value += this.#consumeChar();
            }
        }

        // consume ZZZ
        while (Tokenizer.isNumeric(this.#currentChar())) {
            value += this.#consumeChar();
        }
        number.value = value;
        number.end = this.#position;
        return number;
    }

    /**
     * @returns {Token}
     */
    #consumeOp() {
        var op = this.#makeOpToken();
        var value = this.#consumeChar(); // consume leading char
        while (this.#currentChar() && Tokenizer.OP_TABLE[value + this.#currentChar()]) {
            value += this.#consumeChar();
        }
        op.type = Tokenizer.OP_TABLE[value];
        op.value = value;
        op.end = this.#position;
        return op;
    }

    /**
     * @returns {Token}
     */
    #consumeString() {
        var string = this.#makeToken("STRING");
        var startChar = this.#consumeChar(); // consume leading quote
        string.template = startChar === "`";
        var value = "";
        while (this.#currentChar() && this.#currentChar() !== startChar) {
            if (this.#currentChar() === "\\") {
                this.#consumeChar(); // consume escape char and get the next one
                let nextChar = this.#consumeChar();
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
                    const hex = this.#consumeHexEscape();
                    if (Number.isNaN(hex)) {
                        throw Error("Invalid hexadecimal escape at " + Tokenizer.positionString(string));
                    }
                    value += String.fromCharCode(hex);
                } else {
                    value += nextChar;
                }
            } else {
                value += this.#consumeChar();
            }
        }
        if (this.#currentChar() !== startChar) {
            throw Error("Unterminated string at " + Tokenizer.positionString(string));
        } else {
            this.#consumeChar(); // consume final quote
        }
        string.value = value;
        string.end = this.#position;
        return string;
    }

    /**
     * @returns {number}
     */
    #consumeHexEscape() {
        const BASE = 16;
        if (!this.#currentChar()) {
            return NaN;
        }
        let result = BASE * Number.parseInt(this.#consumeChar(), BASE);
        if (!this.#currentChar()) {
            return NaN;
        }
        result += Number.parseInt(this.#consumeChar(), BASE);

        return result;
    }

    /**
     * Main tokenization implementation
     * @returns {Tokens}
     */
    #tokenizeImpl() {
        while (this.#position < this.#source.length) {
            if ((this.#currentChar() === "-" && this.#nextChar() === "-" && (Tokenizer.isWhitespace(this.#nextCharAt(2)) || this.#nextCharAt(2) === "" || this.#nextCharAt(2) === "-"))
                || (this.#currentChar() === "/" && this.#nextChar() === "/" && (Tokenizer.isWhitespace(this.#nextCharAt(2)) || this.#nextCharAt(2) === "" || this.#nextCharAt(2) === "/"))) {
                this.#consumeComment();
            } else if (this.#currentChar() === "/" && this.#nextChar() === "*" && (Tokenizer.isWhitespace(this.#nextCharAt(2)) || this.#nextCharAt(2) === "" || this.#nextCharAt(2) === "*")) {
                this.#consumeCommentMultiline();
            } else {
                if (Tokenizer.isWhitespace(this.#currentChar())) {
                    this.#tokens.push(this.#consumeWhitespace());
                } else if (
                    !this.#possiblePrecedingSymbol() &&
                    this.#currentChar() === "." &&
                    (Tokenizer.isAlpha(this.#nextChar()) || this.#nextChar() === "{" || this.#nextChar() === "-")
                ) {
                    this.#tokens.push(this.#consumeClassReference());
                } else if (
                    !this.#possiblePrecedingSymbol() &&
                    this.#currentChar() === "#" &&
                    (Tokenizer.isAlpha(this.#nextChar()) || this.#nextChar() === "{")
                ) {
                    this.#tokens.push(this.#consumeIdReference());
                } else if (this.#currentChar() === "[" && this.#nextChar() === "@") {
                    this.#tokens.push(this.#consumeAttributeReference());
                } else if (this.#currentChar() === "@") {
                    this.#tokens.push(this.#consumeShortAttributeReference());
                } else if (this.#currentChar() === "*" && Tokenizer.isAlpha(this.#nextChar())) {
                    this.#tokens.push(this.#consumeStyleReference());
                } else if (this.#inTemplate() && (Tokenizer.isAlpha(this.#currentChar()) || this.#currentChar() === "\\")) {
                    this.#tokens.push(this.#consumeTemplateIdentifier());
                } else if (!this.#inTemplate() && (Tokenizer.isAlpha(this.#currentChar()) || this.#isIdentifierChar(this.#currentChar()))) {
                    this.#tokens.push(this.#consumeIdentifier());
                } else if (Tokenizer.isNumeric(this.#currentChar())) {
                    this.#tokens.push(this.#consumeNumber());
                } else if (!this.#inTemplate() && (this.#currentChar() === '"' || this.#currentChar() === "`")) {
                    this.#tokens.push(this.#consumeString());
                } else if (!this.#inTemplate() && this.#currentChar() === "'") {
                    if (this.#isValidSingleQuoteStringStart(this.#tokens)) {
                        this.#tokens.push(this.#consumeString());
                    } else {
                        this.#tokens.push(this.#consumeOp());
                    }
                } else if (Tokenizer.OP_TABLE[this.#currentChar()]) {
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
        }

        return new Tokens(this.#tokens, [], this.#source);
    }

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
        const tokenizer = new Tokenizer();
        return tokenizer.tokenize(string, template);
    }

    /**
     * Instance tokenize method
     * @param {string} string
     * @param {boolean} [template]
     * @returns {Tokens}
     */
    tokenize(string, template) {
        this.#initializeState(string, template);
        return this.#tokenizeImpl();
    }
}
