
//====================================================================
// Lexer
//====================================================================

var OP_TABLE = {
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
    $: "DOLLAR",
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
};

/**
 * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
 * @param {string} c
 * @returns boolean
 */
function isValidCSSClassChar(c) {
    return isAlpha(c) || isNumeric(c) || c === "-" || c === "_" || c === ":";
}

/**
 * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
 * @param {string} c
 * @returns boolean
 */
function isValidCSSIDChar(c) {
    return isAlpha(c) || isNumeric(c) || c === "-" || c === "_" || c === ":";
}

/**
 * isWhitespace returns `true` if the provided character is whitespace.
 * @param {string} c
 * @returns boolean
 */
function isWhitespace(c) {
    return c === " " || c === "\t" || isNewline(c);
}

/**
 * positionString returns a string representation of a Token's line and column details.
 * @param {Token} token
 * @returns string
 */
function positionString(token) {
    return "[Line: " + token.line + ", Column: " + token.column + "]";
}

/**
 * isNewline returns `true` if the provided character is a carrage return or newline
 * @param {string} c
 * @returns boolean
 */
function isNewline(c) {
    return c === "\r" || c === "\n";
}

/**
 * isNumeric returns `true` if the provided character is a number (0-9)
 * @param {string} c
 * @returns boolean
 */
function isNumeric(c) {
    return c >= "0" && c <= "9";
}

/**
 * isAlpha returns `true` if the provided character is a letter in the alphabet
 * @param {string} c
 * @returns boolean
 */
function isAlpha(c) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

/**
 * @param {string} c
 * @param {boolean} [dollarIsOp]
 * @returns boolean
 */
function isIdentifierChar(c, dollarIsOp) {
    return c === "_" || c === "$";
}

/**
 * @param {string} c
 * @returns boolean
 */
function isReservedChar(c) {
    return c === "`" || c === "^";
}

/**
 * @param {Token[]} tokens
 * @param {Token[]} consumed
 * @param {string} source
 * @returns {Tokens}
 */
export function makeTokensObject(tokens, consumed, source) {
    /** @type {Tokens} */
    const t = {
        tokens,
        consumed,
        source,
        _lastConsumed: null,
        _follows: [],
    };

    consumeWhitespace(t); // consume initial whitespace

    return t;
}


export function consumeWhitespace(t) {
    while (token(t, 0, true).type === "WHITESPACE") {
        t.consumed.push(t.tokens.shift());
    }
}

/**
 * @param {Tokens} tokens
 * @param {*} error
 */
export function raiseError(tokens, error) {
    raiseParseError(tokens, error);
}

/**
 * @param {Tokens} t
 * @param {string} value
 * @returns {Token}
 */
export function requireOpToken(t, value) {
    var token = matchOpToken(t, value);
    if (token) {
        return token;
    } else {
        raiseError(this, "Expected '" + value + "' but found '" + currentToken(t).value + "'");
    }
}

/**
 * @param {Tokens} t
 * @param {...string} ops
 * @returns {Token | void}
 */
export function matchAnyOpToken(t, ...ops) {
    for (const opToken of ops) {
        var match = matchOpToken(t, opToken);
        if (match) {
            return match;
        }
    }
}

/**
 * @param {Tokens} t
 * @param {...string} tokens
 * @returns {Token | void}
 */
export function matchAnyToken(t, ...tokens) {
    for (const token of tokens) {
        var match = matchToken(t, token);
        if (match) {
            return match;
        }
    }
}

/**
 * @param {Tokens} t
 * @param {string} value
 * @returns {Token | void}
 */
export function matchOpToken(t, value) {
    if (currentToken(t) && currentToken(t).op && currentToken(t).value === value) {
        return consumeToken(t);
    }
}

/**
 * @param {Tokens} t
 * @param {...string} types
 * @returns {Token}
 */
export function requireTokenType(t, ...types) {
    var token = matchTokenType(t, ...types);
    if (token) {
        return token;
    } else {
        raiseError(t, "Expected one of " + JSON.stringify(types));
    }
}

/**
 * @param {Tokens} t
 * @param {...string} types
 * @returns {Token | void}
 */
export function matchTokenType(t, ...types) {
    if (
        currentToken(t) &&
        currentToken(t).type &&
        types.indexOf(currentToken(t).type) >= 0
    ) {
        return consumeToken(t);
    }
}

/**
 * @param {Tokens} t
 * @param {string} value
 * @param {string} [type]
 * @returns {Token}
 */
export function requireToken(t, value, type) {
    var token = matchToken(t, value, type);
    if (token) {
        return token;
    } else {
        raiseError(this, "Expected '" + value + "' but found '" + currentToken(t).value + "'");
    }
}

/**
 * @param {Tokens} t
 * @param {string} value
 * @param {string} [type]
 * @returns {Token | void}
 */
export function matchToken(t, value, type) {
    if (t._follows.indexOf(value) !== -1) {
        return; // disallowed token here
    }
    var type = type || "IDENTIFIER";
    if (currentToken(t) && currentToken(t).value === value && currentToken(t).type === type) {
        return consumeToken(t);
    }
}

/**
 * @param {Tokens} t
 * @returns {Token}
 */
export function consumeToken(t) {
    var match = t.tokens.shift();
    t.consumed.push(match);
    t._lastConsumed = match;
    consumeWhitespace(t); // consume any whitespace
    return match;
}

/**
 * @param {Tokens} t
 * @param {string} value
 * @param {string} [type]
 * @returns {Token[]}
 */
export function consumeUntil(t, value, type) {
    /** @type Token[] */
    var tokenList = [];
    var currentToken = token(t, 0, true);

    while (
        (type == null || currentToken.type !== type) &&
        (value == null || currentToken.value !== value) &&
        currentToken.type !== "EOF"
    ) {
        var match = t.tokens.shift();
        t.consumed.push(match);
        tokenList.push(currentToken);
        currentToken = token(t, 0, true);
    }
    consumeWhitespace(t); // consume any whitespace
    return tokenList;
}

/**
 * @param {Tokens} t
 * @returns {string}
 */
export function lastWhitespace(t) {
    if (t.consumed[t.consumed.length - 1] && t.consumed[t.consumed.length - 1].type === "WHITESPACE") {
        return t.consumed[t.consumed.length - 1].value;
    } else {
        return "";
    }
}

export function consumeUntilWhitespace(t) {
    return consumeUntil(t, null, "WHITESPACE");
}

/**
 * @param {Tokens} t
 * @returns {boolean}
 */
export function hasMore(t) {
    return t.tokens.length > 0;
}

/**
 * @param {Tokens} t
 * @param {number} n
 * @param {boolean} [dontIgnoreWhitespace]
 * @returns {Token}
 */
export function token(t, n, dontIgnoreWhitespace) {
    var /**@type {Token}*/ token;
    var i = 0;
    do {
        if (!dontIgnoreWhitespace) {
            while (t.tokens[i] && t.tokens[i].type === "WHITESPACE") {
                i++;
            }
        }
        token = t.tokens[i];
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
 * @param {Tokens} t
 * @returns {Token}
 */
export function currentToken(t) {
    return token(t, 0);
}

/**
 * @param {Tokens} t
 * @returns {Token | null}
 */
export function lastMatch(t) {
    return t._lastConsumed;
}

/**
 * @param {Tokens} t
 * @returns {string}
 */
export function sourceFor(t) {
    return t.source.substring(this.startToken.start, this.endToken.end);
}

/**
 * @param {Tokens} t
 * @returns {string}
 */
export function lineFor(t) {
    return t.source.split("\n")[this.startToken.line - 1];
}

/**
 * @param {Tokens} t 
 * @param {string} str 
 */
export function pushFollow(t, str) {
    t._follows.push(str);
}

/**
 * @param {Tokens} t 
 */
export function popFollow(t) {
    t._follows.pop();
}

/**
 * @param {Tokens} t 
 * @returns {string[]}
 */
export function clearFollows(t) {
    var tmp = t._follows;
    t._follows = [];
    return tmp;
}

/**
 * @param {Tokens} t 
 * @param {string[]} f 
 */
export function restoreFollows(t, f) {
    t._follows = f;
}


/**
 * @param {Token[]} tokens
 * @returns {boolean}
 */
function isValidSingleQuoteStringStart(tokens) {
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
export function tokenize(string, template) {
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
        if (currentChar() === "-" && nextChar() === "-" && (isWhitespace(charAfterThat()) || charAfterThat() === "")) {
            consumeComment();
        } else {
            if (isWhitespace(currentChar())) {
                tokens.push(consumeWhitespace());
            } else if (
                !possiblePrecedingSymbol() &&
                currentChar() === "." &&
                (isAlpha(nextChar()) || nextChar() === "{")
            ) {
                tokens.push(consumeClassReference());
            } else if (
                !possiblePrecedingSymbol() &&
                currentChar() === "#" &&
                (isAlpha(nextChar()) || nextChar() === "{")
            ) {
                tokens.push(consumeIdReference());
            } else if (currentChar() === "[" && nextChar() === "@") {
                tokens.push(consumeAttributeReference());
            } else if (currentChar() === "@") {
                tokens.push(consumeShortAttributeReference());
            } else if (isAlpha(currentChar()) || (!inTemplate() && isIdentifierChar(currentChar()))) {
                tokens.push(consumeIdentifier());
            } else if (isNumeric(currentChar())) {
                tokens.push(consumeNumber());
            } else if (!inTemplate() && (currentChar() === '"' || currentChar() === "`")) {
                tokens.push(consumeString());
            } else if (!inTemplate() && currentChar() === "'") {
                if (isValidSingleQuoteStringStart(tokens)) {
                    tokens.push(consumeString());
                } else {
                    tokens.push(consumeOp());
                }
            } else if (OP_TABLE[currentChar()]) {
                if (lastToken === "$" && currentChar() === "{") {
                    templateBraceCount++;
                }
                if (currentChar() === "}") {
                    templateBraceCount--;
                }
                tokens.push(consumeOp());
            } else if (inTemplate() || isReservedChar(currentChar())) {
                tokens.push(makeToken("RESERVED", consumeChar()));
            } else {
                if (position < source.length) {
                    throw Error("Unknown token: " + currentChar() + " ");
                }
            }
        }
    }

    return makeTokensObject(tokens, [], source);

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
            value: value,
            start: position,
            end: position + 1,
            column: column,
            line: line,
        };
    }

    function consumeComment() {
        while (currentChar() && !isNewline(currentChar())) {
            consumeChar();
        }
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
            while (isValidCSSClassChar(currentChar())) {
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
        while (isValidCSSIDChar(currentChar())) {
            value += consumeChar();
        }
        attributeRef.value = value;
        attributeRef.end = position;
        return attributeRef;
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
            while (isValidCSSIDChar(currentChar())) {
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
    function consumeIdentifier() {
        var identifier = makeToken("IDENTIFIER");
        var value = consumeChar();
        while (isAlpha(currentChar()) || isIdentifierChar(currentChar())) {
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
        while (isNumeric(currentChar())) {
            value += consumeChar();
        }
        if (currentChar() === "." && isNumeric(nextChar())) {
            value += consumeChar();
        }
        while (isNumeric(currentChar())) {
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
        while (currentChar() && OP_TABLE[value + currentChar()]) {
            value += consumeChar();
        }
        op.type = OP_TABLE[value];
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
        var value = "";
        while (currentChar() && currentChar() !== startChar) {
            if (currentChar() === "\\") {
                consumeChar(); // consume escape char and move on
            }
            value += consumeChar();
        }
        if (currentChar() !== startChar) {
            throw Error("Unterminated string at " + positionString(string));
        } else {
            consumeChar(); // consume final quote
        }
        string.value = value;
        string.end = position;
        string.template = startChar === "`";
        return string;
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

    function charAfterThat() {
        return source.charAt(position + 2);
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
            isAlpha(lastToken) ||
            isNumeric(lastToken) ||
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
        while (currentChar() && isWhitespace(currentChar())) {
            if (isNewline(currentChar())) {
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
 *
 * @param {Tokens} tokens
 * @returns string
 */
function createParserContext(tokens) {
    var currentToken = currentToken(tokens);
    var source = tokens.source;
    var lines = source.split("\n");
    var line = currentToken && currentToken.line ? currentToken.line - 1 : lines.length - 1;
    var contextLine = lines[line];
    var offset = currentToken && currentToken.line ? currentToken.column : contextLine.length - 1;
    return contextLine + "\n" + " ".repeat(offset) + "^^\n\n";
}

/**
 * @param {Tokens} tokens
 * @param {string} [message]
 */
export function raiseParseError(tokens, message) {
	message =
		(message || "Unexpected Token : " + currentToken(tokens).value) + "\n\n" + createParserContext(tokens);
	var error = new Error(message);
	error["tokens"] = tokens;
	throw error;
}
