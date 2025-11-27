// Tokens class - manages token stream for parsing

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
        // This will be set by Parser when it's initialized
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
