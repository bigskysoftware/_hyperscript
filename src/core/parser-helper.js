// ParserHelper - Unified API for parsing operations
// Encapsulates both Parser and Tokens to provide a single parameter to grammar functions

/**
 * ParserHelper wraps a Parser and Tokens instance to provide a unified API
 * for grammar parsing functions.
 */
export class ParserHelper {
    /**
     * @param {import('./parser.js').Parser} parser
     * @param {import('./tokens.js').Tokens} tokens
     */
    constructor(parser, tokens) {
        this.parser = parser;
        this.tokens = tokens;
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

    // ===========================
    // Parser delegation methods
    // ===========================

    parseElement(type, root) {
        return this.parser.parseElement(type, this.tokens, root);
    }

    requireElement(type, message, root) {
        return this.parser.requireElement(type, this.tokens, message, root);
    }

    parseAnyOf(types) {
        return this.parser.parseAnyOf(types, this.tokens);
    }

    raiseParseError(message) {
        return this.parser.raiseParseError(this.tokens, message);
    }

    parseStringTemplate() {
        return this.parser.parseStringTemplate(this.tokens);
    }

    commandBoundary(token) {
        return this.parser.commandBoundary(token);
    }

    commandStart(token) {
        return this.parser.commandStart(token);
    }

    featureStart(token) {
        return this.parser.featureStart(token);
    }

    setParent(elt, parent) {
        return this.parser.setParent(elt, parent);
    }

    // Access to parser properties needed by grammars
    get possessivesDisabled() {
        return this.parser.possessivesDisabled;
    }

    set possessivesDisabled(value) {
        this.parser.possessivesDisabled = value;
    }

    get GRAMMAR() {
        return this.parser.GRAMMAR;
    }

    get COMMANDS() {
        return this.parser.COMMANDS;
    }

    get FEATURES() {
        return this.parser.FEATURES;
    }

    get LEAF_EXPRESSIONS() {
        return this.parser.LEAF_EXPRESSIONS;
    }

    get INDIRECT_EXPRESSIONS() {
        return this.parser.INDIRECT_EXPRESSIONS;
    }

    // Access to runtime for grammars that need it
    get runtime() {
        return this.parser.runtime;
    }
}