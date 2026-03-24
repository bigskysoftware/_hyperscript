// Parser - Unified API for parsing operations
// Encapsulates both LanguageKernel and Tokens to provide a single parameter to grammar functions

import { ImplicitReturn } from '../parsetree/internals.js';

export class Parser {
    constructor(kernel, tokens) {
        this.kernel = kernel;
        this.tokens = tokens;
        this.possessivesDisabled = false;
    }

    // ===========================
    // Token delegation methods
    // ===========================

    consumeWhitespace() {
        return this.tokens.consumeWhitespace();
    }

    requireOpToken(value) {
        return this.tokens.requireOpToken(value);
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

    requireTokenType(type1, type2, type3, type4) {
        return this.tokens.requireTokenType(type1, type2, type3, type4);
    }

    matchTokenType(type1, type2, type3, type4) {
        return this.tokens.matchTokenType(type1, type2, type3, type4);
    }

    requireToken(value, type) {
        return this.tokens.requireToken(value, type);
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

    token(n, dontIgnoreWhitespace) {
        return this.tokens.token(n, dontIgnoreWhitespace);
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
        return new Parser(this.kernel, tokens);
    }

    // ===========================
    // Kernel delegation methods
    // ===========================

    parseElement(type, root = null) {
        return this.kernel.parseElement(type, this, root);
    }

    requireElement(type, message, root) {
        return this.kernel.requireElement(type, this, message, root);
    }

    parseAnyOf(types) {
        return this.kernel.parseAnyOf(types, this);
    }

    raiseParseError(message) {
        return this.kernel.raiseParseError(this.tokens, message);
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
        return this.kernel.COMMANDS[token.value || ""];
    }

    featureStart(token) {
        return this.kernel.FEATURES[token.value || ""];
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

    ensureTerminated(commandList) {
        var implicitReturn = new ImplicitReturn();
        var end = commandList;
        while (end.next) {
            end = end.next;
        }
        end.next = implicitReturn;
    }
}
