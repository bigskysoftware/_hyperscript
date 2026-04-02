// Parser - Unified API for parsing operations
// Encapsulates both LanguageKernel and Tokens to provide a single parameter to grammar functions

import { ImplicitReturn } from '../parsetree/internals.js';
import { NakedString } from '../parsetree/expressions/literals.js';

// ============================================================
// Parse error types
// ============================================================

export class ParseError {
    constructor(message, token, source, expected) {
        this.message = message;
        this.token = token;
        this.source = source;
        this.expected = expected || null;
        this.line = token?.line ?? null;
        this.column = token?.column ?? null;
    }
}

export class ParseRecoverySentinel extends Error {
    constructor(parseError) {
        super(parseError.message);
        this.parseError = parseError;
    }
}

export function formatErrors(errors) {
    if (!errors.length) return "";
    var source = errors[0].source;
    var lines = source.split("\n");

    // Group errors by line number
    var byLine = new Map();
    for (var e of errors) {
        var lineIdx = e.token?.line ? e.token.line - 1 : lines.length - 1;
        if (!byLine.has(lineIdx)) byLine.set(lineIdx, []);
        byLine.get(lineIdx).push(e);
    }

    var maxLine = Math.max(...byLine.keys()) + 1;
    var gutter = String(maxLine).length;
    var pad = " ".repeat(gutter + 5);
    var sortedLines = [...byLine.entries()].sort((a, b) => a[0] - b[0]);
    var prevLineIdx = -1;
    var out = "";

    for (var [lineIdx, lineErrors] of sortedLines) {
        if (prevLineIdx !== -1 && lineIdx > prevLineIdx + 1) {
            out += " ".repeat(gutter + 1) + "...\n";
        } else if (prevLineIdx === -1 && lineIdx > 0) {
            out += " ".repeat(gutter + 1) + "...\n";
        }
        prevLineIdx = lineIdx;

        var lineNum = String(lineIdx + 1).padStart(gutter);
        var contextLine = lines[lineIdx] || "";
        out += "  " + lineNum + " | " + contextLine + "\n";

        lineErrors.sort((a, b) => (a.column || 0) - (b.column || 0));

        var underlineChars = Array(contextLine.length + 10).fill(" ");
        for (var e of lineErrors) {
            var col = e.token?.line ? e.token.column : Math.max(0, contextLine.length - 1);
            var len = Math.max(1, e.token?.value?.length || 1);
            for (var i = 0; i < len; i++) underlineChars[col + i] = "^";
        }
        out += pad + underlineChars.join("").trimEnd() + "\n";

        for (var e of lineErrors) {
            var col = e.token?.line ? e.token.column : 0;
            out += pad + " ".repeat(col) + e.message + "\n";
        }
    }
    return out;
}

export class Parser {
    #kernel;

    constructor(kernel, tokens) {
        this.#kernel = kernel;
        this.tokens = tokens;
    }

    // ===========================
    // Token delegation methods
    // ===========================

    consumeWhitespace() {
        return this.tokens.consumeWhitespace();
    }

    requireOpToken(value) {
        var token = this.matchOpToken(value);
        if (token) return token;
        this.raiseExpected(value);
    }

    matchAnyOpToken(...ops) {
        return this.tokens.matchAnyOpToken(...ops);
    }

    matchAnyToken(...tokens) {
        return this.tokens.matchAnyToken(...tokens);
    }

    matchOpToken(value) {
        return this.tokens.matchOpToken(value);
    }

    requireTokenType(...types) {
        var token = this.matchTokenType(...types);
        if (token) return token;
        this.raiseExpected(...types);
    }

    matchTokenType(...types) {
        return this.tokens.matchTokenType(...types);
    }

    requireToken(value, type) {
        var token = this.matchToken(value, type);
        if (token) return token;
        this.raiseExpected(value);
    }

    peekToken(value, peek, type) {
        return this.tokens.peekToken(value, peek, type);
    }

    matchToken(value, type) {
        return this.tokens.matchToken(value, type);
    }

    consumeToken() {
        return this.tokens.consumeToken();
    }

    consumeUntil(value, type) {
        return this.tokens.consumeUntil(value, type);
    }

    lastWhitespace() {
        return this.tokens.lastWhitespace();
    }

    consumeUntilWhitespace() {
        return this.tokens.consumeUntilWhitespace();
    }

    hasMore() {
        return this.tokens.hasMore();
    }

    token(n, includeWhitespace) {
        return this.tokens.token(n, includeWhitespace);
    }

    currentToken() {
        return this.tokens.currentToken();
    }

    lastMatch() {
        return this.tokens.lastMatch();
    }

    pushFollow(str) {
        return this.tokens.pushFollow(str);
    }

    popFollow() {
        return this.tokens.popFollow();
    }

    clearFollows() {
        return this.tokens.clearFollows();
    }

    restoreFollows(f) {
        return this.tokens.restoreFollows(f);
    }

    get source() {
        return this.tokens.source;
    }

    get consumed() {
        return this.tokens.consumed;
    }

    get list() {
        return this.tokens.list;
    }

    createChildParser(tokens) {
        return new Parser(this.#kernel, tokens);
    }

    // ===========================
    // Kernel delegation methods
    // ===========================

    parseElement(type, root = null) {
        return this.#kernel.parseElement(type, this, root);
    }

    requireElement(type, message, root) {
        return this.#kernel.requireElement(type, this, message, root);
    }

    parseAnyOf(types) {
        return this.#kernel.parseAnyOf(types, this);
    }

    raiseError(message, expected) {
        message = message || "Unexpected Token : " + this.currentToken().value;
        var parseError = new ParseError(message, this.currentToken(), this.source, expected);
        throw new ParseRecoverySentinel(parseError);
    }

    raiseExpected(...expected) {
        var msg = expected.length === 1
            ? "Expected '" + expected[0] + "' but found '" + this.currentToken().value + "'"
            : "Expected one of: " + expected.map(e => "'" + e + "'").join(", ");
        this.raiseError(msg, expected);
    }

    // ===========================
    // Parser-owned methods
    // ===========================

    parseStringTemplate() {
        var returnArr = [""];
        do {
            returnArr.push(this.lastWhitespace());
            if (this.currentToken().value === "$") {
                this.consumeToken();
                var startingBrace = this.matchOpToken("{");
                returnArr.push(this.requireElement("expression"));
                if (startingBrace) {
                    this.requireOpToken("}");
                }
                returnArr.push("");
            } else if (this.currentToken().value === "\\") {
                this.consumeToken(); // skip next
                this.consumeToken();
            } else {
                var token = this.consumeToken();
                returnArr[returnArr.length - 1] += token ? token.value : "";
            }
        } while (this.hasMore());
        returnArr.push(this.lastWhitespace());
        return returnArr;
    }

    commandBoundary(token) {
        if (
            token.value == "end" ||
            token.value == "then" ||
            token.value == "else" ||
            token.value == "otherwise" ||
            token.value == ")" ||
            this.commandStart(token) ||
            this.featureStart(token) ||
            token.type == "EOF"
        ) {
            return true;
        }
        return false;
    }

    commandStart(token) {
        return this.#kernel.commandStart(token);
    }

    featureStart(token) {
        return this.#kernel.featureStart(token);
    }

    setParent(elt, parent) {
        if (typeof elt === 'object') {
            elt.parent = parent;
            if (typeof parent === 'object') {
                parent.children = (parent.children || new Set());
                parent.children.add(elt)
            }
            this.setParent(elt.next, parent);
        }
    }

    parseURLOrExpression() {
        var cur = this.currentToken();
        if (cur.value === "/" && cur.type === "DIVIDE") {
            // starts with / — naked URL
            var tokens = this.consumeUntilWhitespace();
            this.matchTokenType("WHITESPACE");
            return new NakedString(tokens);
        }
        if (cur.type === "IDENTIFIER" && (cur.value === "http" || cur.value === "https" || cur.value === "ws" || cur.value === "wss")) {
            // starts with http/https — naked URL
            var tokens = this.consumeUntilWhitespace();
            this.matchTokenType("WHITESPACE");
            return new NakedString(tokens);
        }
        return this.requireElement("expression");
    }

    ensureTerminated(commandList) {
        var implicitReturn = new ImplicitReturn();
        var end = commandList;
        while (end.next) {
            end = end.next;
        }
        end.next = implicitReturn;
    }
}
