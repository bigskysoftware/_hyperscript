// Parser - Unified API for parsing operations
// Encapsulates both LanguageKernel and Tokens to provide a single parameter to grammar functions

/**
 * Parser wraps a LanguageKernel and Tokens instance to provide a unified API
 * for grammar parsing functions.
 */
export class Parser {
    /**
     * @param {import('./kernel.js').LanguageKernel} kernel
     * @param {import('./tokens.js').Tokens} tokens
     */
    constructor(kernel, tokens) {
        this.kernel = kernel;
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
    // Kernel delegation methods
    // ===========================

    parseElement(type, root) {
        return this.kernel.parseElement(type, this.tokens, root);
    }

    requireElement(type, message, root) {
        return this.kernel.requireElement(type, this.tokens, message, root);
    }

    parseAnyOf(types) {
        return this.kernel.parseAnyOf(types, this.tokens);
    }

    raiseParseError(message) {
        return this.kernel.raiseParseError(this.tokens, message);
    }

    parseStringTemplate() {
        return this.kernel.parseStringTemplate(this.tokens);
    }

    commandBoundary(token) {
        return this.kernel.commandBoundary(token);
    }

    commandStart(token) {
        return this.kernel.commandStart(token);
    }

    featureStart(token) {
        return this.kernel.featureStart(token);
    }

    setParent(elt, parent) {
        return this.kernel.setParent(elt, parent);
    }

    // Access to parser properties needed by grammars
    get possessivesDisabled() {
        return this.kernel.possessivesDisabled;
    }

    set possessivesDisabled(value) {
        this.kernel.possessivesDisabled = value;
    }

    get GRAMMAR() {
        return this.kernel.GRAMMAR;
    }

    get COMMANDS() {
        return this.kernel.COMMANDS;
    }

    get FEATURES() {
        return this.kernel.FEATURES;
    }

    get LEAF_EXPRESSIONS() {
        return this.kernel.LEAF_EXPRESSIONS;
    }

    get INDIRECT_EXPRESSIONS() {
        return this.kernel.INDIRECT_EXPRESSIONS;
    }

    // Access to runtime for grammars that need it
    get runtime() {
        return this.kernel.runtime;
    }
}