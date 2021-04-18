///=========================================================================
/// This module provides the core runtime and grammar for hyperscript
///=========================================================================
//AMD insanity

/** @var {HyperscriptObject} _hyperscript */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root._hyperscript = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    return (function () {
            'use strict';

            //====================================================================
            // Utilities
            //====================================================================

            /**
             * mergeObjects combines the keys from obj2 into obj2, then returns obj1
             * 
             * @param {object} obj1 
             * @param {object} obj2 
             * @returns object
             */
            function mergeObjects(obj1, obj2) {
                for (var key in obj2) {
                    if (obj2.hasOwnProperty(key)) {
                        obj1[key] = obj2[key];
                    }
                }
                return obj1;
            }

            /**
             * parseJSON parses a JSON string into a corresponding value.  If the 
             * value passed in is not valid JSON, then it logs an error and returns `null`.
             * 
             * @param {string} jString 
             * @returns any
             */
            function parseJSON(jString) {
                try {
                    return JSON.parse(jString);
                } catch(error) {
                    logError(error);
                    return null;
                }
            }

            /**
             * logError writes an error message to the Javascript console.  It can take any 
             * value, but msg should commonly be a simple string.
             * @param {*} msg 
             */
            function logError(msg) {
                if(console.error) {
                    console.error(msg);
                } else if (console.log) {
                    console.log("ERROR: ", msg);
                }
            }

            // TODO: JSDoc description of what's happening here
            function varargConstructor(Cls, args) {
                return new (Cls.bind.apply(Cls, [Cls].concat(args)));
            }

            var globalScope = (typeof self !== 'undefined') ? self : ((typeof global !== 'undefined') ? global : this);

            //====================================================================
            // Lexer
            //====================================================================

            /** @type LexerObject */
            var _lexer = function () {
                var OP_TABLE = {
                    '+': 'PLUS',
                    '-': 'MINUS',
                    '*': 'MULTIPLY',
                    '/': 'DIVIDE',
                    '.': 'PERIOD',
                    '..': 'ELLIPSIS',
                    '\\': 'BACKSLASH',
                    ':': 'COLON',
                    '%': 'PERCENT',
                    '|': 'PIPE',
                    '!': 'EXCLAMATION',
                    '?': 'QUESTION',
                    '#': 'POUND',
                    '&': 'AMPERSAND',
                    '$': 'DOLLAR',
                    ';': 'SEMI',
                    ',': 'COMMA',
                    '(': 'L_PAREN',
                    ')': 'R_PAREN',
                    '<': 'L_ANG',
                    '>': 'R_ANG',
                    '<=': 'LTE_ANG',
                    '>=': 'GTE_ANG',
                    '==': 'EQ',
                    '===': 'EQQ',
                    '!=': 'NEQ',
                    '!==': 'NEQQ',
                    '{': 'L_BRACE',
                    '}': 'R_BRACE',
                    '[': 'L_BRACKET',
                    ']': 'R_BRACKET',
                    '=': 'EQUALS'
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
                    return "[Line: " + token.line + ", Column: " + token.col + "]"
                }

                /**
                 * isNewline returns `true` if the provided character is a carrage return or newline
                 * @param {string} c 
                 * @returns boolean
                 */
                function isNewline(c) {
                    return c === '\r' || c === '\n';
                }

                /**
                 * isNumeric returns `true` if the provided character is a number (0-9)
                 * @param {string} c 
                 * @returns boolean
                 */
                function isNumeric(c) {
                    return c >= '0' && c <= '9';
                }

                /**
                 * isAlpha returns `true` if the provided character is a letter in the alphabet
                 * @param {string} c 
                 * @returns boolean
                 */
                function isAlpha(c) {
                    return (c >= 'a' && c <= 'z') ||
                        (c >= 'A' && c <= 'Z');
                }

                /**
                 * @param {string} c
                 * @param {boolean} [dollarIsOp]
                 * @returns boolean
                 */
                function isIdentifierChar(c) {
                    return (c === "_" || c === "$");
                }

                /**
                 * @param {string} c 
                 * @returns boolean
                 */
                function isReservedChar(c) {
                    return (c === "`" || c === "^");
                }

                /**
                 * @param {Token[]} tokens 
                 * @param {Token[]} consumed 
                 * @param {string} source 
                 * @returns {TokensObject}
                 */
                function makeTokensObject(tokens, consumed, source) {

                    consumeWhitespace(); // consume initial whitespace

                    /** @type Token | null */
                    var _lastConsumed = null;

                    function consumeWhitespace(){
                        while(token(0, true).type === "WHITESPACE") {
                            consumed.push(tokens.shift());
                        }
                    }

                    /**
                     * @param {Token[]} tokens 
                     * @param {*} error 
                     */
                    function raiseError(tokens, error) {
                        _parser.raiseParseError(tokens, error);
                    }

                    /**
                     * @param {string} value 
                     * @returns {Token}
                     */
                    function requireOpToken(value) {
                        var token = matchOpToken(value);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected '" + value + "' but found '" + currentToken().value + "'");
                        }
                    }

                    /**
                     * @param {string} op1 
                     * @param {string} [op2]
                     * @param {string} [op3]
                     * @returns {Token | void}
                     */
                    function matchAnyOpToken(op1, op2, op3) {
                        for (var i = 0; i < arguments.length; i++) {
                            var opToken = arguments[i];
                            var match = matchOpToken(opToken);
                            if (match) {
                                return match;
                            }
                        }
                    }

                    /**
                     * @param {string} op1
                     * @param {string} [op2]
                     * @param {string} [op3]
                     * @returns {Token | void}
                     */
                     function matchAnyToken(op1, op2, op3) {
                        for (var i = 0; i < arguments.length; i++) {
                            var opToken = arguments[i];
                            var match = matchToken(opToken);
                            if (match) {
                                return match;
                            }
                        }
                    }

                    /**
                     * @param {string} value 
                     * @returns {Token | void}
                     */
                    function matchOpToken(value) {
                        if (currentToken() && currentToken().op && currentToken().value === value) {
                            return consumeToken();
                        }
                    }

                    /**
                     * @param {string} type1 
                     * @param {string} [type2]
                     * @param {string} [type3]
                     * @param {string} [type4]
                     * @returns {Token | void}
                     */
                    function requireTokenType(type1, type2, type3, type4) {
                        var token = matchTokenType(type1, type2, type3, type4);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected one of " + JSON.stringify([type1, type2, type3]));
                        }
                    }

                    /**
                     * @param {string} type1 
                     * @param {string} [type2]
                     * @param {string} [type3]
                     * @param {string} [type4]
                     * @returns {Token | void}
                     */
                    function matchTokenType(type1, type2, type3, type4) {
                        if (currentToken() && currentToken().type && [type1, type2, type3, type4].indexOf(currentToken().type) >= 0) {
                            return consumeToken();
                        }
                    }

                    /**
                     * @param {string} value 
                     * @param {string} [type]
                     * @returns {Token}
                     */
                    function requireToken(value, type) {
                        var token = matchToken(value, type);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected '" + value + "' but found '" + currentToken().value + "'");
                        }
                    }

                    /**
                     * @param {string} value 
                     * @param {string} [type]
                     * @returns {Token | void}
                     */
                    function matchToken(value, type) {
                        if (follows.indexOf(value) !== -1) {
                            return; // disallowed token here
                        }
                        var type = type || "IDENTIFIER";
                        if (currentToken() && currentToken().value === value && currentToken().type === type) {
                            return consumeToken();
                        }
                    }

                    /**
                     * @returns {Token}
                     */
                    function consumeToken() {
                        var match = tokens.shift();
                        consumed.push(match);
                        _lastConsumed = match;
                        consumeWhitespace(); // consume any whitespace
                        return match;
                    }

                    /**
                     * @param {string} value 
                     * @param {string} [type]
                     * @returns {Token[]}
                     */
                    function consumeUntil(value, type) {

                        /** @type Token[] */
                        var tokenList = [];
                        var currentToken = token(0, true);

                        while ((type == null || currentToken.type !== type) &&
                               (value == null || currentToken.value !== value) &&
                                currentToken.type !== "EOF") {
                            var match = tokens.shift();
                            consumed.push(match);
                            tokenList.push(currentToken);
                            currentToken = token(0, true);
                        }
                        consumeWhitespace(); // consume any whitespace
                        return tokenList;
                    }

                    /**
                     * @returns {string}
                     */
                    function lastWhitespace() {
                        if (consumed[consumed.length - 1] && consumed[consumed.length - 1].type === "WHITESPACE") {
                            return consumed[consumed.length - 1].value;
                        } else {
                            return "";
                        }
                    }

                    function consumeUntilWhitespace() {
                        return consumeUntil(null, "WHITESPACE");
                    }

                    /**
                     * @returns {boolean}
                     */
                    function hasMore() {
                        return tokens.length > 0;
                    }

                    /**
                     * @param {number} n 
                     * @param {boolean} [dontIgnoreWhitespace]
                     * @returns {Token}
                     */
                    function token(n, dontIgnoreWhitespace) {
                        var /**@type {Token}*/ token;
                        var i = 0;
                        do {
                            if (!dontIgnoreWhitespace) {
                                while (tokens[i] && tokens[i].type === "WHITESPACE") {
                                    i++;
                                }
                            }
                            token = tokens[i];
                            n--;
                            i++;
                        } while (n > -1)
                        if (token) {
                            return token;
                        } else {
                            return {
                                type:"EOF",
                                value:"<<<EOF>>>"
                            }
                        }
                    }

                    /**
                     * @returns {Token}
                     */
                    function currentToken() {
                        return token(0);
                    }

                    /**
                     * @returns {Token | null}
                     */
                    function lastMatch() {
                        return _lastConsumed;
                    }

                    /**
                     * @returns {string}
                     */
                    function sourceFor() {
                        return source.substring(this.startToken.start, this.endToken.end);
                    }

                    /**
                     * @returns {string}
                     */
                     function lineFor() {
                        return source
                            .split("\n")[this.startToken.line - 1];
                    }

                    var follows = [];

                     function pushFollow(str) {
                         follows.push(str);
                     }

                     function popFollow() {
                         follows.pop();
                     }

                     function clearFollows() {
                         var tmp = follows;
                         follows = [];
                         return tmp;
                     }

                     function restoreFollows(f) {
                         follows = f;
                     }

                    /** @type {TokensObject} */
                    return {
                        pushFollow: pushFollow,
                        popFollow: popFollow,
                        clearFollow: clearFollows,
                        restoreFollow: restoreFollows,
                        matchAnyToken: matchAnyToken,
                        matchAnyOpToken: matchAnyOpToken,
                        matchOpToken: matchOpToken,
                        requireOpToken: requireOpToken,
                        matchTokenType: matchTokenType,
                        requireTokenType: requireTokenType,
                        consumeToken: consumeToken,
                        matchToken: matchToken,
                        requireToken: requireToken,
                        list: tokens,
                        consumed: consumed,
                        source: source,
                        hasMore: hasMore,
                        currentToken: currentToken,
                        lastMatch: lastMatch,
                        token: token,
                        consumeUntil: consumeUntil,
                        consumeUntilWhitespace: consumeUntilWhitespace,
                        lastWhitespace: lastWhitespace,
                        sourceFor: sourceFor,
                        lineFor: lineFor
                    }
                }


                /**
                 * @param {Token[]} tokens
                 * @returns {boolean}
                 */
                function isValidSingleQuoteStringStart(tokens) {
                    if (tokens.length > 0) {
                        var previousToken = tokens[tokens.length - 1];
                        if (previousToken.type === "IDENTIFIER" || previousToken.type === "CLASS_REF" || previousToken.type === "ID_REF") {
                            return false;
                        }
                        if(previousToken.op && (previousToken.value === '>' || previousToken.value === ')')){
                            return false;
                        }
                    }
                    return true;
                }

                /**
                 * @param {string} string 
                 * @param {boolean} [template]
                 * @returns {TokensObject}
                 */
                function tokenize(string, template) {
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
                        if (currentChar() === "-" && nextChar() === "-") {
                            consumeComment();
                        } else {
                            if (isWhitespace(currentChar())) {
                                tokens.push(consumeWhitespace());
                            } else if (!possiblePrecedingSymbol() && currentChar() === "." && isAlpha(nextChar())) {
                                tokens.push(consumeClassReference());
                            } else if (!possiblePrecedingSymbol() && currentChar() === "#" && isAlpha(nextChar())) {
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
                                if (lastToken === '$' && currentChar() === '{') {
                                    templateBraceCount++;
                                }
                                if (currentChar() === '}') {
                                    templateBraceCount--;
                                }
                                tokens.push(consumeOp());
                            } else if (inTemplate() || isReservedChar(currentChar())) {
                                tokens.push(makeToken('RESERVED', consumeChar()))
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
                            line: line
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
                        while (isValidCSSClassChar(currentChar())) {
                            value += consumeChar();
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
                        while (position < source.length && currentChar() !== ']') {
                            value += consumeChar();
                        }
                        if (currentChar() === ']') {
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
                        while (isValidCSSIDChar(currentChar())) {
                            value += consumeChar();
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
                        if ((currentChar() === ".") && isNumeric(nextChar())) {
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
                        return isAlpha(lastToken) || isNumeric(lastToken) || lastToken === ")" || lastToken === "}" || lastToken === "]"
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

                return {
                    tokenize: tokenize,
                    makeTokensObject: makeTokensObject
                }
            }();

            //====================================================================
            // Parser
            //====================================================================

            /** @type ParserObject */
            var _parser = function () {

                /** @type {Object<string,GrammarDefinition>} */ 
                var GRAMMAR = {}

                /** @type {Object<string,GrammarDefinition>} */
                var COMMANDS = {}

                /** @type {Object<string,GrammarDefinition>} */
                var FEATURES = {}
                
                var LEAF_EXPRESSIONS = [];
                var INDIRECT_EXPRESSIONS = [];

                /**
                 * @param {*} parseElement 
                 * @param {*} start 
                 * @param {TokensObject} tokens 
                 */
                function initElt(parseElement, start, tokens) {
                    parseElement.startToken = start;
                    parseElement.sourceFor = tokens.sourceFor;
                    parseElement.lineFor = tokens.lineFor;
                    parseElement.programSource = tokens.source;
                }

                /**
                 * @param {string} type 
                 * @param {TokensObject} tokens 
                 * @param {*} root 
                 * @returns GrammarElement
                 */
                 function parseElement(type, tokens, root) {
                    var elementDefinition = GRAMMAR[type];
                    if (elementDefinition) {
                        var start = tokens.currentToken();
                        var parseElement = elementDefinition(_parser, _runtime, tokens, root);
                        if (parseElement) {
                            initElt(parseElement, start, tokens);
                            parseElement.endToken = parseElement.endToken || tokens.lastMatch()
                            var root = parseElement.root;
                            while (root != null) {
                                initElt(root, start, tokens);
                                root = root.root;
                            }
                        }
                        return parseElement;
                    }
                }

                /**
                 * @param {string} type 
                 * @param {TokensObject} tokens 
                 * @param {string} [message]
                 * @param {*} [root]
                 * @returns {GrammarElement}
                 */
                function requireElement(type, tokens, message, root) {
                    var result = parseElement(type, tokens, root);
                    return result || raiseParseError(tokens, message || "Expected " + type);
                }

                /**
                 * @param {string[]} types 
                 * @param {TokensObject} tokens 
                 * @returns {GrammarElement}
                 */
                function parseAnyOf(types, tokens) {
                    for (var i = 0; i < types.length; i++) {
                        var type = types[i];
                        var expression = parseElement(type, tokens);
                        if (expression) {
                            return expression;
                        }
                    }
                }

                /**
                 * @param {string} name 
                 * @param {GrammarDefinition} definition 
                 */
                function addGrammarElement(name, definition) {
                    GRAMMAR[name] = definition;
                }

                /**
                 * @param {string} keyword 
                 * @param {GrammarDefinition} definition
                 */
                function addCommand(keyword, definition) {
                    var commandGrammarType = keyword + "Command";
                    var commandDefinitionWrapper = function (parser, runtime, tokens) {
                        var commandElement = definition(parser, runtime, tokens);
                        if (commandElement) {
                            commandElement.type = commandGrammarType;
                            commandElement.execute = function (context) {
                            	context.meta.command = commandElement;
                                return runtime.unifiedExec(this, context);
                            }
                            return commandElement;
                        }
                    };
                    GRAMMAR[commandGrammarType] = commandDefinitionWrapper;
                    COMMANDS[keyword] = commandDefinitionWrapper;
                }

                /**
                 * @param {string} keyword 
                 * @param {GrammarDefinition} definition
                 */
                function addFeature(keyword, definition) {
                    var featureGrammarType = keyword + "Feature";

                    /** @type {GrammarDefinition} */
                    var featureDefinitionWrapper = function (parser, runtime, tokens) {
                        var featureElement = definition(parser, runtime, tokens);
                        if (featureElement) {
                            featureElement.keyword = keyword;
                            featureElement.type = featureGrammarType;
                            return featureElement;
                        }
                    };
                    GRAMMAR[featureGrammarType] = featureDefinitionWrapper;
                    FEATURES[keyword] = featureDefinitionWrapper;
                }

                /**
                 * @param {string} name 
                 * @param {GrammarDefinition} definition
                 */
                function addLeafExpression(name, definition) {
                    LEAF_EXPRESSIONS.push(name);
                    addGrammarElement(name, definition);
                }

                /**
                 * @param {string} name 
                 * @param {GrammarDefinition} definition
                 */
                function addIndirectExpression(name, definition) {
                    INDIRECT_EXPRESSIONS.push(name);
                    addGrammarElement(name, definition);
                }

                /* ============================================================================================ */
                /* Core hyperscript Grammar Elements                                                            */
                /* ============================================================================================ */
                addGrammarElement("feature", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("(")) {
                        var featureElement = parser.requireElement("feature", tokens);
                        tokens.requireOpToken(")");
                        return featureElement;
                    }

                    var featureDefinition = FEATURES[tokens.currentToken().value];
                    if (featureDefinition) {
                        return featureDefinition(parser, runtime, tokens);
                    }
                })

                addGrammarElement("command", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("(")) {
                        var commandElement = parser.requireElement("command", tokens);
                        tokens.requireOpToken(")");
                        return commandElement;
                    }

                    var commandDefinition = COMMANDS[tokens.currentToken().value];
                    if (commandDefinition) {
                        var commandElement = commandDefinition(parser, runtime, tokens);
                    } else if (tokens.currentToken().type === "IDENTIFIER" && tokens.token(1).value === "(") {
                        var commandElement = parser.requireElement("pseudoCommand", tokens);
                    }
                    if (commandElement) {
                        return parser.parseElement("indirectStatement", tokens, commandElement);
                    }

                    return commandElement;
                })

                addGrammarElement("commandList", function(parser, runtime, tokens) {
                    var cmd = parser.parseElement("command", tokens);
                    if (cmd) {
                        tokens.matchToken("then");
                        cmd.next = parser.parseElement("commandList", tokens);
                        return cmd;
                    }
                })

                addGrammarElement("leaf", function(parser, runtime, tokens) {
                    var result = parseAnyOf(LEAF_EXPRESSIONS, tokens);
                    // symbol is last so it doesn't consume any constants
                    if (result == null) {
                        return parseElement('symbol', tokens);
                    }

                    return result;
                })

                addGrammarElement("indirectExpression", function(parser, runtime, tokens, root) {
                    for (var i = 0; i < INDIRECT_EXPRESSIONS.length; i++) {
                        var indirect = INDIRECT_EXPRESSIONS[i];
                        root.endToken = tokens.lastMatch();
                        var result = parser.parseElement(indirect, tokens, root);
                        if(result){
                            return result;
                        }
                    }
                    return root;
                });

                addGrammarElement("indirectStatement", function(parser, runtime, tokens, root) {
                    if (tokens.matchToken('unless')) {
                        root.endToken = tokens.lastMatch();
                        var conditional = parser.requireElement('expression', tokens);
                        var unless = {
                            type: 'unlessStatementModifier',
                            args: [conditional],
                            op: function (context, conditional) {
                                if (conditional) {
                                    return this.next;
                                } else {
                                    return root;
                                }
                            },
                            execute: function(context) {
                                return runtime.unifiedExec(this, context);
                            }
                        };
                        root.parent = unless;
                        return unless
                    }
                    return root;
                });

                addGrammarElement("primaryExpression", function(parser, runtime, tokens) {
                    var leaf = parser.parseElement("leaf", tokens);
                    if (leaf) {
                        return parser.parseElement("indirectExpression", tokens, leaf);
                    }
                    parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
                });

                /* ============================================================================================ */
                /* END Core hyperscript Grammar Elements                                                        */
                /* ============================================================================================ */

                /**
                 * 
                 * @param {TokensObject} tokens 
                 * @returns string
                 */
                function createParserContext(tokens) {
                    var currentToken = tokens.currentToken();
                    var source = tokens.source;
                    var lines = source.split("\n");
                    var line = (currentToken && currentToken.line) ? currentToken.line - 1 : lines.length - 1;
                    var contextLine = lines[line];
                    var offset = (currentToken && currentToken.line) ? currentToken.column : contextLine.length - 1;
                    return contextLine + "\n" + " ".repeat(offset) + "^^\n\n";
                }

                /**
                 * @param {TokensObject} tokens
                 * @param {string} message 
                 */
                function raiseParseError(tokens, message) {
                    message = (message || "Unexpected Token : " + tokens.currentToken().value) + "\n\n" +
                        createParserContext(tokens);
                    var error = new Error(message);
                    error['tokens'] = tokens;
                    throw error
                }

                /**
                 * @param {TokensObject} tokens 
                 * @returns {GrammarElement}
                 */
                function parseHyperScript(tokens) {
                    var result = parseElement("hyperscript", tokens);
                    if (tokens.hasMore()) raiseParseError(tokens);
                    return result;
                }

                /**
                 * @param {GrammarElement} elt
                 * @param {GrammarElement} parent
                 */
                function setParent(elt, parent) {
                    if (elt) {
                        elt.parent = parent;
                        setParent(elt.next, parent);
                    }
                }

                /**
                 * @param {Token} token 
                 * @returns {GrammarDefinition}
                 */
                function commandStart(token){
                    return COMMANDS[token.value];
                }

                /**
                 * @param {Token} token 
                 * @returns {GrammarDefinition}
                 */
                function featureStart(token){
                    return FEATURES[token.value];
                }

                /**
                 * @param {Token} token 
                 * @returns {true | void}
                 */
                function commandBoundary(token) {
                    if (token.value == "end" ||
                        token.value == "then" ||
                        token.value == "else" ||
                        token.value == ")" ||
                        commandStart(token) ||
                        featureStart(token) ||
                        token.type == "EOF") {
                        return true;
                    }
                }

                /**
                 * @param {TokensObject} tokens 
                 * @returns {(string | Token)[]}
                 */
                function parseStringTemplate(tokens) {
                    /** @type (string | Token)[] */
                    var returnArr = [""];
                    do {
                        returnArr.push(tokens.lastWhitespace());
                        if (tokens.currentToken().value === "$") {
                            tokens.consumeToken();
                            var startingBrace = tokens.matchOpToken('{');
                            returnArr.push(requireElement("expression", tokens));
                            if(startingBrace){
                                tokens.requireOpToken("}");
                            }
                            returnArr.push("");
                        } else if (tokens.currentToken().value === "\\") {
                            tokens.consumeToken(); // skip next
                            tokens.consumeToken()
                        } else {
                            var token = tokens.consumeToken();
                            returnArr[returnArr.length - 1] += token ? token.value : '';
                        }
                    } while (tokens.hasMore())
                    returnArr.push(tokens.lastWhitespace());
                    return returnArr;
                }

                // parser API
                return {
                    setParent: setParent,
                    requireElement: requireElement,
                    parseElement: parseElement,
                    featureStart: featureStart,
                    commandStart: commandStart,
                    commandBoundary: commandBoundary,
                    parseAnyOf: parseAnyOf,
                    parseHyperScript: parseHyperScript,
                    raiseParseError: raiseParseError,
                    addGrammarElement: addGrammarElement,
                    addCommand: addCommand,
                    addFeature: addFeature,
                    addLeafExpression: addLeafExpression,
                    addIndirectExpression: addIndirectExpression,
                    parseStringTemplate: parseStringTemplate,
                }
            }();

            //====================================================================
            // Runtime
            //====================================================================

            /** @type ConversionMap */
            var CONVERSIONS = {
                dynamicResolvers : /** @type DynamicConversionFunction[] */ [],
                "String" : function(val){
                    if(val.toString){
                        return val.toString();
                    } else {
                        return "" + val;
                    }
                },
                "Int" : function(val){
                    return parseInt(val);
                },
                "Float" : function(val){
                    return parseFloat(val);
                },
                "Number" : function(val){
                    return Number(val);
                },
                "Date" : function(val){
                    return Date(val);
                },
                "Array" : function(val){
                    return Array.from(val);
                },
                "JSON" : function(val){
                    return JSON.stringify(val);
                },
                "Object" : function(val){
                    if (val instanceof String) {
                        val = val.toString()
                    }
                    if (typeof val === 'string') {
                        return JSON.parse(val);
                    } else {
                        return mergeObjects({}, val);
                    }
                }
            }

            /********************************************
             * RUNTIME OBJECT
             ********************************************/

            /** @type {RuntimeObject} */
            var _runtime = function () {

                /**
                 * @param {HTMLElement} elt 
                 * @param {string} selector 
                 * @returns boolean
                 */
                function matchesSelector(elt, selector) {
                    // noinspection JSUnresolvedVariable
                    var matchesFunction = elt.matches ||
                        elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                        || elt.webkitMatchesSelector || elt.oMatchesSelector;
                    return matchesFunction && matchesFunction.call(elt, selector);
                }

                /**
                 * @param {string} eventName 
                 * @param {Object} [detail]
                 * @returns {Event}
                 */
                function makeEvent(eventName, detail) {
                    var evt;
                    if (window.CustomEvent && typeof window.CustomEvent === 'function') {
                        evt = new CustomEvent(eventName, {bubbles: true, cancelable: true, detail: detail});
                    } else {
                        evt = document.createEvent('CustomEvent');
                        evt.initCustomEvent(eventName, true, true, detail);
                    }
                    return evt;
                }

                /**
                 * @param {HTMLElement} elt 
                 * @param {string} eventName 
                 * @param {Object} [detail]
                 * @returns {boolean}
                 */
                function triggerEvent(elt, eventName, detail) {
                    detail = detail || {};
                    detail["sentBy"] = elt;
                    var event = makeEvent(eventName, detail);
                    var eventResult = elt.dispatchEvent(event);
                    return eventResult;
                }

                /**
                 * isArrayLike returns `true` if the provided value is an array or
                 * a NodeList (which is close enough to being an array for our purposes).
                 * 
                 * @param {any} value 
                 * @returns {value is Array | NodeList}
                 */
                function isArrayLike(value) {
                    return Array.isArray(value) || value instanceof NodeList;
                }

                /**
                 * forEach executes the provided `func` on every item in the `value` array.
                 * if `value` is a single item (and not an array) then `func` is simply called
                 * once.  If `value` is null, then no further actions are taken.
                 *
                 * @template T
                 * @param {NodeList | T | T[]} value
                 * @param {(item:Node | T) => void} func
                 */
                function forEach(value, func) {
                    if (value == null) {
                        // do nothing
                    } else if (isArrayLike(value)) {
                        for (var i = 0; i < value.length; i++) {
                            func(value[i]);
                        }
                    } else {
                        func(value);
                    }
                }

                var ARRAY_SENTINEL = {array_sentinel:true}

                function linearize(args) {
                    var arr = [];
                    for (var i = 0; i < args.length; i++) {
                        var arg = args[i];
                        if (Array.isArray(arg)) {
                            arr.push(ARRAY_SENTINEL);
                            for (var j = 0; j < arg.length; j++) {
                                arr.push(arg[j]);
                            }
                            arr.push(ARRAY_SENTINEL);
                        } else {
                            arr.push(arg);
                        }
                    }
                    return arr;
                }

                function delinearize(values){
                    var arr = [];
                    for (var i = 0; i < values.length; i++) {
                        var value = values[i];
                        if (value === ARRAY_SENTINEL) {
                            value = values[++i];
                            var valueArray = [];
                            arr.push(valueArray);
                            while (value !== ARRAY_SENTINEL) {
                                valueArray.push(value);
                                value = values[++i];
                            }
                        } else {
                            arr.push(value);
                        }
                    }
                    return arr;
                }

                function unwrapAsyncs(values) {
                    for (var i = 0; i < values.length; i++) {
                        var value = values[i];
                        if (value.asyncWrapper) {
                            values[i] = value.value;
                        }
                        if (Array.isArray(value)) {
                            for (var j = 0; j < value.length; j++) {
                                var valueElement = value[j];
                                if (valueElement.asyncWrapper) {
                                    value[j] = valueElement.value;
                                }
                            }
                        }
                    }
                }

                var HALT = {halt_flag:true};

                /**
                 * @param {GrammarDefinition} command
                 * @param {Context} ctx 
                 */
                function unifiedExec(command,  ctx) {
                    while(true) {
                        try {
                            var next = unifiedEval(command, ctx);
                        } catch(e) {
                            _runtime.registerHyperTrace(ctx, e);
                            if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
                                ctx.meta.handlingError = true;
                                ctx[ctx.meta.errorSymmbol] = e;
                                command = ctx.meta.errorHandler;
                                continue;
                            } else if (ctx.meta.reject) {
                                ctx.meta.reject(e);
                                next = HALT;
                            } else {
                                throw e;
                            }
                        }
                        if (next == null) {
                            console.error(command, " did not return a next element to execute! context: " , ctx)
                            return;
                        } else if (next.then) {
                            next.then(function (resolvedNext) {
                                unifiedExec(resolvedNext, ctx);
                            }).catch(function(reason){
                                 _runtime.registerHyperTrace(ctx, reason);
                                if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
                                    ctx.meta.handlingError = true;
                                    ctx[ctx.meta.errorSymmbol] = reason;
                                    unifiedExec(ctx.meta.errorHandler, ctx);
                                } else if(ctx.meta.reject) {
                                    ctx.meta.reject(reason);
                                } else {
                                    throw reason;
                                }
                            });
                            return;
                        } else if (next === HALT) {
                            // done
                            return;
                        }  else {
                            command = next; // move to the next command
                        }
                    }
                }

                /**
                 * @param {*} parseElement 
                 * @param {Context} ctx 
                 * @returns {*}
                 */
                function unifiedEval(parseElement,  ctx) {
                    
                    /** @type any[] */ 
                    var args = [ctx];
                    var async = false;
                    var wrappedAsyncs = false;
                    
                    if (parseElement.args) {
                        for (var i = 0; i < parseElement.args.length; i++) {
                            var argument = parseElement.args[i];
                            if (argument == null) {
                                args.push(null);
                            } else if (Array.isArray(argument)) {
                                var arr = [];
                                for (var j = 0; j < argument.length; j++) {
                                    var element = argument[j];
                                    var value = element ? element.evaluate(ctx) : null; // OK
                                    if (value) {
                                        if (value.then) {
                                            async = true;
                                        } else if (value.asyncWrapper) {
                                            wrappedAsyncs = true;
                                        }
                                    }
                                    arr.push(value);
                                }
                                args.push(arr);
                            } else if (argument.evaluate) {
                                var value = argument.evaluate(ctx); // OK
                                if (value) {
                                    if (value.then) {
                                        async = true;
                                    } else if (value.asyncWrapper) {
                                        wrappedAsyncs = true;
                                    }
                                }
                                args.push(value);
                            } else {
                                args.push(argument);
                            }
                        }
                    }
                    if (async) {
                        return new Promise(function(resolve, reject){
                            var linearized = linearize(args);
                            Promise.all(linearized).then(function(values){
                                values = delinearize(values);
                                if (wrappedAsyncs) {
                                    unwrapAsyncs(values);
                                }
                                try{
                                    var apply = parseElement.op.apply(parseElement, values);
                                    resolve(apply);
                                } catch(e) {
                                    reject(e);
                                }
                            }).catch(function(reason){
                                if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
                                    ctx.meta.handlingError = true;
                                    ctx[ctx.meta.errorSymmbol] = reason;
                                    unifiedExec(ctx.meta.errorHandler, ctx);
                                } else if(ctx.meta.reject) {
                                    ctx.meta.reject(reason);
                                } else {
                                    // TODO: no meta context to reject with, trigger event?
                                }
                            })
                        })
                    } else {
                        if (wrappedAsyncs) {
                            unwrapAsyncs(args);
                        }
                        return parseElement.op.apply(parseElement, args);
                    }
                }

                var _scriptAttrs = null;

                /**
                 * getAttributes returns the attribute name(s) to use when 
                 * locating hyperscript scripts in a DOM element.  If no value
                 * has been configured, it defaults to _hyperscript.config.attributes
                 * @returns string[]
                 */
                function getScriptAttributes() {
                    if (_scriptAttrs == null) {
                        _scriptAttrs = _hyperscript.config.attributes.replace(/ /g,'').split(",")
                    }
                    return _scriptAttrs;
                }

                /**
                 * @param {HTMLElement} elt 
                 * @returns {string | null}
                 */
                function getScript(elt) {
                    for (var i = 0; i < getScriptAttributes().length; i++) {
                        var scriptAttribute = getScriptAttributes()[i];
                        if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
                            return elt.getAttribute(scriptAttribute)
                        }
                    }
                    if (elt['type'] === "text/hyperscript") {
                        return elt.innerText;
                    }
                    return null;
                }

                /**
                 * @param {Object} owner
                 * @param {Context} ctx
                 */
                function addFeatures(owner, ctx) {
                    if(owner) {
                        if (owner.hyperscriptFeatures) {
                            mergeObjects(ctx, owner.hyperscriptFeatures);
                        }
                        addFeatures(owner.parentElement, ctx);
                    }
                }

                /**
                 * @param {*} owner 
                 * @param {*} feature 
                 * @param {*} hyperscriptTarget 
                 * @param {*} event 
                 * @returns {Context}
                 */
                function makeContext(owner, feature, hyperscriptTarget, event, extras) {

                    /** @type {Context} */
                    var ctx = {
                        meta: {
                            parser: _parser,
                            lexer: _lexer,
                            runtime: _runtime,
                            owner: owner,
                            feature: feature,
                            iterators: {}
                        },
                        me: hyperscriptTarget,
                        event: event,
                        target: event ? event.target : null,
                        detail: event ? event.detail : null,
                        body: 'document' in globalScope ? document.body : null
                    }
                    ctx.meta.ctx = ctx;
                    addFeatures(owner, ctx);
                    if (typeof extras === 'object') mergeObjects(ctx, extras)
                    return ctx;
                }

                /**
                 * @returns string
                 */
                function getScriptSelector() {
                    return getScriptAttributes().map(function (attribute) {
                        return "[" + attribute + "]";
                    }).join(", ");
                }

                /**
                 * @param {any} value
                 * @param {string} type 
                 * @returns {any}
                 */
                function convertValue(value,  type) {

                    var dynamicResolvers = CONVERSIONS.dynamicResolvers;
                    for (var i = 0; i < dynamicResolvers.length; i++) {
                        var dynamicResolver = dynamicResolvers[i];
                        var converted = dynamicResolver(type, value);
                        if (converted !== undefined) {
                            return converted;
                        }
                    }

                    if (value == null) {
                        return null;
                    }
                    var converter = CONVERSIONS[type];
                    if (converter) {
                        return converter(value);
                    }

                    throw "Unknown conversion : " + type;
                }

                // TODO: There do not seem to be any references to this function.  
                // Is it still in use, or can it be removed?
                function isType(o, type) {
                    return Object.prototype.toString.call(o) === "[object " + type + "]";
                }

                /**
                 * @param {string} src 
                 * @returns {GrammarElement}
                 */
                function parse(src) {
                    var tokens = _lexer.tokenize(src);
                    if (_parser.commandStart(tokens.currentToken())) {
                        var commandList = _parser.parseElement("commandList", tokens);
                        var last = commandList;
                        while (last.next) {
                            last = last.next;
                        }
                        last.next = {
                            op : function() {
                                return HALT;
                            }
                        }
                        return commandList
                    } else if (_parser.featureStart(tokens.currentToken())) {
                        var hyperscript = _parser.parseElement("hyperscript", tokens);
                        return hyperscript;
                    } else {
                        var expression = _parser.parseElement("expression", tokens);
                        return expression;
                    }
                }

                /**
                 * @param {string} src 
                 * @param {Context} ctx
                 * @returns {any}
                 */
                function evaluate(src, ctx) {
                    ctx = mergeObjects(makeContext(document.body, null,
                        document.body, null), ctx || {});
                    var element = parse(src);
                    if (element.execute) {
                        return element.execute(ctx);
                    } else if (element.apply) {
                        element.apply(document.body, null);
                    } else {
                        return element.evaluate(ctx);
                    }
                }

                /**
                 * @param {HTMLElement} elt 
                 */
                function processNode(elt) {
                    var selector = _runtime.getScriptSelector();
                    if (matchesSelector(elt, selector)) {
                        initElement(elt, elt);
                    }
                    if (elt['type'] === "text/hyperscript") {
                        initElement(elt, document.body);
                    }
                    if (elt.querySelectorAll) {
                        forEach(elt.querySelectorAll(selector + ", [type=\'text/hyperscript\']"), function (elt) {
                            initElement(elt, elt.type === 'text/hyperscript' ? document.body : elt);
                        });
                    }
                }

                /**
                 * @param {HTMLElement} elt 
                 * @param {HTMLElement} [target]
                 */
                function initElement(elt, target) {
                    if (elt.closest && elt.closest(_hyperscript.config.disableSelector)) {
                        return;
                    }
                    var internalData = getInternalData(elt);
                    if (!internalData.initialized) {
                        var src = getScript(elt);
                        if (src) {
                            try {
                                internalData.initialized = true;
                                internalData.script = src;
                                var tokens = _lexer.tokenize(src);
                                var hyperScript = _parser.parseHyperScript(tokens);
                                hyperScript.apply(target || elt, elt);
                                setTimeout(function () {
                                    triggerEvent(target || elt, 'load', {'hyperscript':true});
                                }, 1);
                            } catch(e) {
                                _runtime.triggerEvent(elt, 'exception', {error: e})
                                console.error("hyperscript errors were found on the following element:", elt, "\n\n", e.message, e.stack);
                            }
                        }
                    }
                }

                /**
                 * @param {HTMLElement} elt 
                 * @returns {Object}
                 */
                function getInternalData(elt) {
                    var dataProp = 'hyperscript-internal-data';
                    var data = elt[dataProp];
                    if (!data) {
                        data = elt[dataProp] = {};
                    }
                    return data;
                }

                /**
                 * @param {any} value 
                 * @param {string} typeString 
                 * @param {boolean} [nullOk]
                 * @returns {boolean}
                 */
                function typeCheck(value, typeString, nullOk) {
                    if (value == null && nullOk) {
                        return true;
                    }
                    var typeName = Object.prototype.toString.call(value).slice(8, -1);
                    return typeName === typeString;
                }

                /**
                 * @param {string} str 
                 * @param {Context} context 
                 * @returns {any}
                 */
                function resolveSymbol(str, context) {
                    if (str === "me" || str === "my" || str === "I") {
                        return context["me"];
                    } if (str === "it" || str === "its") {
                        return context["result"];
                    } if (str === "your" || str === "you") {
                        return context["beingTold"];
                    } else {
                        if (context.meta && context.meta.context) {
                            var fromMetaContext = context.meta.context[str];
                            if (typeof fromMetaContext !== "undefined") {
                                return fromMetaContext;
                            }
                        }
                        var fromContext = context[str];
                        if (typeof fromContext !== "undefined") {
                            return fromContext;
                        } else {
                            return globalScope[str];
                        }
                    }
                }

                /**
                 * @param {GrammarElement} command
                 * @param {Context} context 
                 * @returns {undefined | GrammarElement}
                 */
                function findNext(command, context) {
                    if (command) {
                        if (command.resolveNext) {
                            return command.resolveNext(context);
                        } else if (command.next) {
                            return command.next;
                        } else {
                            return findNext(command.parent, context)
                        }
                    }
                }

                /**
                 * @param {Object<string,any>} root 
                 * @param {string} property 
                 * @param {boolean} attribute
                 * @returns {any}
                 */
                function resolveProperty(root, property, attribute) {
                    if (root != null) {
                        var val = attribute && root.getAttribute ? root.getAttribute(property) : root[property];
                        if (typeof val !== 'undefined') {
                            return val;
                        }

                        if (isArrayLike(root)) {
                            // flat map
                            var result = [];
                            for (var i = 0; i < root.length; i++) {
                                var component = root[i];
                                var componentValue = attribute ? component.getAttribute(property) : component[property];
                                if (componentValue) {
                                    result.push(componentValue);
                                }
                            }
                            return result;
                        }
                    }
                }

                /**
                 * @param {Element} elt
                 * @param {string[]} nameSpace
                 * @param {string} name
                 * @param {any} value 
                 */
                function assignToNamespace(elt, nameSpace, name, value) {
                    if (typeof document === 'undefined' || elt === document.body) {
                        var root = globalScope;
                    } else {
                        var root = elt['hyperscriptFeatures'];
                        if (root == null) {
                            root = {}
                            elt['hyperscriptFeatures'] = root;
                        }
                    }
                    while (nameSpace.length > 0) {
                        var propertyName = nameSpace.shift();
                        var newRoot = root[propertyName];
                        if (newRoot == null) {
                            newRoot = {};
                            root[propertyName] = newRoot;
                        }
                        root = newRoot;
                    }

                    root[name] = value;
                }

                function getHyperTrace(ctx, thrown) {
                    var trace = [];
                    var root = ctx;
                    while(root.meta.caller) {
                        root = root.meta.caller;
                    }
                    if (root.meta.traceMap) {
                        return root.meta.traceMap.get(thrown, trace);
                    }
                }

                function registerHyperTrace(ctx, thrown) {
                    var trace = [];
                    var root = null;
                    while(ctx != null) {
                        trace.push(ctx);
                        root = ctx;
                        ctx = ctx.meta.caller;
                    }
                    if (root.meta.traceMap == null) {
                        root.meta.traceMap = new Map(); // TODO - WeakMap?
                    }
                    if (!root.meta.traceMap.get(thrown)) {
                        var traceEntry = {
                            trace: trace,
                            print : function(logger) {
                                logger = logger || console.error;
                                logger("hypertrace /// ")
                                var maxLen = 0;
                                for (var i = 0; i < trace.length; i++) {
                                    maxLen = Math.max(maxLen, trace[i].meta.feature.displayName.length);
                                }
                                for (var i = 0; i < trace.length; i++) {
                                    var traceElt = trace[i];
                                    logger("  ->", traceElt.meta.feature.displayName.padEnd(maxLen + 2), "-", traceElt.meta.owner)
                                }
                            }
                        };
                        root.meta.traceMap.set(thrown, traceEntry);
                    }
                }

                /**
                 * @param {string} str 
                 * @returns {string}
                 */
                function escapeSelector(str) {
                    return str.replace(/:/g, function(str){
                        return "\\" + str;
                    });
                }

                /**
                 * @param {any} value
                 * @param {*} elt
                 */
                function nullCheck(value, elt) {
                    if (value == null) {
                        throw new Error(elt.sourceFor() + " is null");
                    }
                }

                /**
                 * @param {any} value 
                 * @returns {boolean}
                 */
                function isEmpty(value) {
                    return (value == undefined) || (value.length === 0);
                }

                /** @type string | null */
                var hyperscriptUrl = ('document' in globalScope) ? document.currentScript.src : null

                /** @type {RuntimeObject} */
                return {
                    typeCheck: typeCheck,
                    forEach: forEach,
                    triggerEvent: triggerEvent,
                    matchesSelector: matchesSelector,
                    getScript: getScript,
                    processNode: processNode,
                    evaluate: evaluate,
                    parse: parse,
                    getScriptSelector: getScriptSelector,
                    resolveSymbol: resolveSymbol,
                    makeContext: makeContext,
                    findNext: findNext,
                    unifiedEval: unifiedEval,
                    convertValue: convertValue,
                    unifiedExec: unifiedExec,
                    resolveProperty: resolveProperty,
                    assignToNamespace: assignToNamespace,
                    registerHyperTrace: registerHyperTrace,
                    getHyperTrace: getHyperTrace,
                    getInternalData: getInternalData,
                    escapeSelector: escapeSelector,
                    nullCheck: nullCheck,
                    isEmpty: isEmpty,
                    hyperscriptUrl: hyperscriptUrl,
                    HALT: HALT
                }
            }();

            //====================================================================
            // Grammar
            //====================================================================
            {
                _parser.addLeafExpression("parenthesized", function(parser, _runtime, tokens) {
                    if (tokens.matchOpToken('(')) {
                        var follows = tokens.clearFollow();
                        try {
                            var expr = parser.requireElement("expression", tokens);
                        } finally {
                            tokens.restoreFollow(follows);
                        }
                        tokens.requireOpToken(")");
                        return expr;
                    }
                })

                _parser.addLeafExpression("string", function(parser, runtime, tokens) {
                    var stringToken = tokens.matchTokenType('STRING');
                    if (stringToken) {
                        var rawValue = stringToken.value;
                        if (stringToken.template) {
                            var innerTokens = _lexer.tokenize(rawValue, true);
                            var args = parser.parseStringTemplate(innerTokens);
                        } else {
                            var args = [];
                        }
                        return {
                            type: "string",
                            token: stringToken,
                            args: args,
                            op: function (context) {
                                var returnStr = "";
                                for (var i = 1; i < arguments.length; i++) {
                                    var val = arguments[i];
                                    if (val !== undefined) {
                                        returnStr += val;
                                    }
                                }
                                return returnStr;
                            },
                            evaluate: function (context) {
                                if (args.length === 0) {
                                    return rawValue;
                                } else {
                                    return runtime.unifiedEval(this, context);
                                }
                            }
                        };
                    }
                })

                _parser.addGrammarElement("nakedString", function(parser, runtime, tokens) {
                    if (tokens.hasMore()) {
                        var tokenArr = tokens.consumeUntilWhitespace();
                        tokens.matchTokenType("WHITESPACE");
                        return {
                            type: "nakedString",
                            tokens: tokenArr,
                            evaluate: function (context) {
                                return tokenArr.map(function (t) {return t.value}).join("");
                            }
                        }
                    }
                })

                _parser.addLeafExpression("number", function(parser, runtime, tokens) {
                    var number = tokens.matchTokenType('NUMBER');
                    if (number) {
                        var numberToken = number;
                        var value = parseFloat(number.value)
                        return {
                            type: "number",
                            value: value,
                            numberToken: numberToken,
                            evaluate: function () {
                                return value;
                            }
                        }
                    }
                })

                _parser.addLeafExpression("idRef", function(parser, runtime, tokens) {
                    var elementId = tokens.matchTokenType('ID_REF');
                    if (elementId) {
                        return {
                            type: "idRef",
                            css: elementId.value,
                            value: elementId.value.substr(1),
                            evaluate: function (context) {
                                return context.me.getRootNode().getElementById(this.value)
                                	|| document.getElementById(this.value);
                            }
                        };
                    }
                })

                _parser.addLeafExpression("classRef", function(parser, runtime, tokens) {
                    var classRef = tokens.matchTokenType('CLASS_REF');

                    if (classRef) {
                        return {
                            type: "classRef",
                            css: classRef.value,
                            className: function () {
                                return this.css.substr(1);
                            },
                            evaluate: function (context) {
                                return context.me.getRootNode().querySelectorAll(runtime.escapeSelector(this.css));
                            }
                        };
                    }
                })

                _parser.addLeafExpression("queryRef", function(parser, runtime, tokens) {
                    var queryStart = tokens.matchOpToken('<');
                    if (queryStart) {
                        var queryTokens = tokens.consumeUntil("/");
                        tokens.requireOpToken("/");
                        tokens.requireOpToken(">");
                        var queryValue = queryTokens.map(function(t){
                            if (t.type === "STRING") {
                                return '"' + t.value + '"';
                            } else {
                                return t.value;
                            }
                        }).join("");

                        if (queryValue.indexOf('$') >= 0) {
                            var template = true;
                            var innerTokens = _lexer.tokenize(queryValue, true);
                            var args = parser.parseStringTemplate(innerTokens);
                        }

                        return {
                            type: "queryRef",
                            css: queryValue,
                            args: args,
                            op: function (context, args) {
                                var query = queryValue;
                                if (template) {
                                    query = '';
                                    for (var i = 1; i < arguments.length; i++) {
                                        var val = arguments[i];
                                        if (val) {
                                            query += val;
                                        }
                                    }
                                }
                                return context.me.getRootNode().querySelectorAll(query);
                            },
                            evaluate: function(context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                })

                _parser.addLeafExpression("attributeRef", function(parser, runtime, tokens) {
                    var attributeRef = tokens.matchTokenType("ATTRIBUTE_REF");
                    if (attributeRef) {
                        var outerVal = attributeRef.value;
                        if (outerVal.indexOf('[') === 0) {
                            var innerValue = outerVal.substring(2, outerVal.length - 1);
                        } else {
                            var innerValue = outerVal.substring(1);
                        }
                        var css = "[" + innerValue + "]";
                        var split = innerValue.split('=');
                        var name = split[0];
                        var value = split[1];
                        if (value) {
                            // strip quotes
                            if (value.indexOf('"') === 0) {
                                value = value.substring(1, value.length - 1);
                            }
                        }
                        return {
                            type: "attributeRef",
                            name: name,
                            css: css,
                            value: value,
                            op:function(context){
                                var target = context.beingTold || context.me;
                                if (target) {
                                    return target.getAttribute(name);
                                };
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                })

                _parser.addGrammarElement("objectKey", function(parser, runtime, tokens) {
                	var token;
                	if (token = tokens.matchTokenType("STRING")) {
                		return {
                			type: "objectKey",
                			key: token.value,
                			evaluate: function() { return this.key }
                		};
                	} else if (tokens.matchOpToken("[")) {
                		var expr = parser.parseElement("expression", tokens);
                		tokens.requireOpToken("]");
                		return {
                			type: "objectKey",
                			expr: expr,
                			args: [expr],
                			op: function (ctx, expr) { return expr },
                			evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                		}
                	} else {
                		var key = "";
                		do {
                			token = tokens.matchTokenType("IDENTIFIER") || tokens.matchOpToken("-");
							if (token) key += token.value;
                		} while (token)
                		return {
	               			type: "objectKey",
	               			key: key,
	               			evaluate: function() { return this.key }
	               		};
                	}
                })

                _parser.addLeafExpression("objectLiteral", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("{")) {
                        var keyExpressions = []
                        var valueExpressions = []
                        if (!tokens.matchOpToken("}")) {
                            do {
                                var name = parser.requireElement("objectKey", tokens);
                                tokens.requireOpToken(":");
                                var value = parser.requireElement("expression", tokens);
                                valueExpressions.push(value);
                                keyExpressions.push(name);
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken("}");
                        }
                        return {
                            type: "objectLiteral",
                            args: [keyExpressions, valueExpressions],
                            op:function(context, keys, values){
                                var returnVal = {};
                                for (var i = 0; i < keys.length; i++) {
                                    returnVal[keys[i]] = values[i];
                                }
                                return returnVal;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    }
                })

                _parser.addGrammarElement("namedArgumentList", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("(")) {
                        var fields = []
                        var valueExpressions = []
                        if (!tokens.matchOpToken(")")) {
                            do {
                                var name = tokens.requireTokenType("IDENTIFIER");
                                tokens.requireOpToken(":");
                                var value = parser.requireElement("expression", tokens);
                                valueExpressions.push(value);
                                fields.push({name: name, value: value});
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(")");
                        }
                        return {
                            type: "namedArgumentList",
                            fields: fields,
                            args:[valueExpressions],
                            op:function(context, values){
                                var returnVal = {_namedArgList_:true};
                                for (var i = 0; i < values.length; i++) {
                                    var field = fields[i];
                                    returnVal[field.name.value] = values[i];
                                }
                                return returnVal;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    }


                })

                _parser.addGrammarElement("symbol", function(parser, runtime, tokens) {
                    var identifier = tokens.matchTokenType('IDENTIFIER');
                    if (identifier) {
                        return {
                            type: "symbol",
                            token: identifier,
                            name: identifier.value,
                            evaluate: function (context) {
                                return runtime.resolveSymbol(identifier.value, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("implicitMeTarget", function(parser, runtime, tokens) {
                    return {
                        type: "implicitMeTarget",
                        evaluate: function (context) {
                            return context.beingTold || context.me;
                        }
                    };
                });

                _parser.addLeafExpression("boolean", function(parser, runtime, tokens) {
                    var booleanLiteral = tokens.matchToken("true") || tokens.matchToken("false");
                    if (booleanLiteral) {
                        return {
                            type: "boolean",
                            evaluate: function (context) {
                                return booleanLiteral.value === "true";
                            }
                        }
                    }
                });

                _parser.addLeafExpression("null", function(parser, runtime, tokens) {
                    if (tokens.matchToken('null')) {
                        return {
                            type: "null",
                            evaluate: function (context) {
                                return null;
                            }
                        }
                    }
                });

                _parser.addLeafExpression("arrayLiteral", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken('[')) {
                        var values = [];
                        if (!tokens.matchOpToken(']')) {
                            do {
                                var expr = parser.requireElement("expression", tokens);
                                values.push(expr);
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken("]");
                        }
                        return {
                            type: "arrayLiteral",
                            values: values,
                            args: [values],
                            op:function(context, values){
                                return values;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    }
                });

                _parser.addLeafExpression("blockLiteral", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken('\\')) {
                        var args = []
                        var arg1 = tokens.matchTokenType("IDENTIFIER");
                        if (arg1) {
                            args.push(arg1);
                            while (tokens.matchOpToken(",")) {
                                args.push(tokens.requireTokenType("IDENTIFIER"));
                            }
                        }
                        // TODO compound op token
                        tokens.requireOpToken("-");
                        tokens.requireOpToken(">");
                        var expr = parser.requireElement("expression", tokens);
                        return {
                            type: "blockLiteral",
                            args: args,
                            expr: expr,
                            evaluate: function (ctx) {
                                var returnFunc = function(){
                                    //TODO - push scope
                                    for (var i = 0; i < args.length; i++) {
                                        ctx[args[i].value] = arguments[i];
                                    }
                                    return expr.evaluate(ctx) //OK
                                }
                                return returnFunc;
                            }
                        }
                    }
                });

                _parser.addGrammarElement("timeExpression", function(parser, runtime, tokens){
                    var time = parser.requireElement("expression", tokens);
                    var factor = 1;
                    if (tokens.matchToken("s") || tokens.matchToken("seconds")) {
                        factor = 1000;
                    } else if (tokens.matchToken("ms") || tokens.matchToken("milliseconds")) {
                        // do nothing
                    }
                    return {
                        type:"timeExpression",
                        time: time,
                        factor: factor,
                        args: [time],
                        op: function (_context, val) {
                            return val * this.factor
                        },
                        evaluate: function (context) {
                            return runtime.unifiedEval(this, context);
                        }
                    }
                })

                _parser.addIndirectExpression("propertyAccess", function(parser, runtime, tokens, root) {
                    if (tokens.matchOpToken(".")) {
                        var prop = tokens.requireTokenType("IDENTIFIER");
                        var propertyAccess = {
                            type: "propertyAccess",
                            root: root,
                            prop: prop,
                            args: [root],
                            op:function(_context, rootVal){
                                var value = runtime.resolveProperty(rootVal, prop.value);
                                return value;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                        return parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addIndirectExpression("of", function(parser, runtime, tokens, root) {
                    if (tokens.matchToken("of")) {
                        var newRoot = parser.requireElement('expression', tokens);
                        // find the urroot
                        var childOfUrRoot = null;
                        var urRoot = root;
                        while (urRoot.root) {
                            childOfUrRoot = urRoot;
                            urRoot = urRoot.root;
                        }
                        if (urRoot.type !== 'symbol' && urRoot.type !== 'attributeRef') {
                            parser.raiseParseError(tokens, "Cannot take a property of a non-symbol: " + urRoot.type);
                        }
                        var attribute = urRoot.type === 'attributeRef';
                        var prop = urRoot.name;
                        var propertyAccess = {
                            type: "ofExpression",
                            prop: urRoot.token,
                            root: newRoot,
                            attribute: attribute,
                            expression: root,
                            args: [newRoot],
                            op:function(context, rootVal){
                                return runtime.resolveProperty(rootVal, prop, attribute);
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };

                        if (urRoot.type === "attributeRef") {
                            propertyAccess.attribute = urRoot;
                        }
                        if (childOfUrRoot) {
                            childOfUrRoot.root = propertyAccess;
                            childOfUrRoot.args = [propertyAccess];
                        } else {
                            root = propertyAccess;
                        }

                        return parser.parseElement("indirectExpression", tokens, root);
                    }
                });

                _parser.addIndirectExpression("possessive", function(parser, runtime, tokens, root) {
                    if (parser.possessivesDisabled) {
                        return;
                    }
                    var apostrophe = tokens.matchOpToken("'");
                    if (apostrophe ||
                        (root.type === "symbol" && (root.name === "my" || root.name === "its" || root.name === "your") && tokens.currentToken().type === "IDENTIFIER")) {
                        if (apostrophe) {
                            tokens.requireToken("s");
                        }
                        var attribute = parser.parseElement('attributeRef', tokens);
                        if (attribute == null) {
                            var prop = tokens.requireTokenType("IDENTIFIER");
                        }
                        var propertyAccess = {
                            type: "possessive",
                            root: root,
                            attribute: attribute,
                            prop: prop,
                            args: [root],
                            op:function(context, rootVal){
                                if(attribute){
                                    var value = runtime.resolveProperty(rootVal, attribute.name, true);
                                } else {
                                    var value = runtime.resolveProperty(rootVal, prop.value, false);
                                }
                                return value;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                        return parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addIndirectExpression("inExpression", function(parser, runtime, tokens, root) {
                    if (tokens.matchToken("in")) {
                        if (root.type !== "idRef" && root.type === "queryRef" || root.type === "classRef") {
                            var query = true;
                        }
                        var target = parser.requireElement("expression", tokens);
                        var propertyAccess = {
                            type: "inExpression",
                            root: root,
                            args: [query ? null : root, target],
                            op:function(context, rootVal, target){
                                var returnArr = [];
                                if(query){
                                    runtime.forEach(target, function (targetElt) {
                                        var results = targetElt.querySelectorAll(root.css);
                                        for (var i = 0; i < results.length; i++) {
                                            returnArr.push(results[i]);
                                        }
                                    })
                                } else {
                                    runtime.forEach(rootVal, function(rootElt){
                                        runtime.forEach(target, function(targetElt){
                                            if (rootElt === targetElt) {
                                                returnArr.push(rootElt);
                                            }
                                        })
                                    })
                                }
                                if (returnArr.length > 0) {
                                    return returnArr;
                                } else {
                                    return null;
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                        return parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addIndirectExpression("asExpression", function(parser, runtime, tokens, root) {
                    if (tokens.matchToken("as")) {
                        var conversion = parser.requireElement('dotOrColonPath', tokens).evaluate(); // OK No promise
                        var propertyAccess = {
                            type: "asExpression",
                            root: root,
                            args: [root],
                            op:function(context, rootVal){
                                return runtime.convertValue(rootVal, conversion);
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                        return parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addIndirectExpression("functionCall", function(parser, runtime, tokens, root) {
                    if (tokens.matchOpToken("(")) {
                        var args = [];
                        if (!tokens.matchOpToken(')')) {
                            do {
                                args.push(parser.requireElement("expression", tokens));
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(")");
                        }

                        if (root.root) {
                            var functionCall = {
                                type: "functionCall",
                                root: root,
                                argExressions: args,
                                args: [root.root, args],
                                op: function (context, rootRoot, args) {
                                    runtime.nullCheck(rootRoot, root.root);
                                    var func = rootRoot[root.prop.value];
                                    runtime.nullCheck(func, root);
                                    if (func.hyperfunc) {
                                        args.push(context);
                                    }
                                    return func.apply(rootRoot, args);
                                },
                                evaluate: function (context) {
                                    return runtime.unifiedEval(this, context);
                                }
                            }
                        } else {
                            var functionCall = {
                                type: "functionCall",
                                root: root,
                                argExressions: args,
                                args: [root, args],
                                op: function(context, func, argVals){
                                    runtime.nullCheck(func, root);
                                    if (func.hyperfunc) {
                                        argVals.push(context);
                                    }
                                    var apply = func.apply(null, argVals);
                                    return apply;
                                },
                                evaluate: function (context) {
                                    return runtime.unifiedEval(this, context);
                                }
                            }
                        }
                        return parser.parseElement("indirectExpression", tokens, functionCall);
                    }
                });

                _parser.addIndirectExpression("attributeRefAccess", function (parser, runtime, tokens, root) {
                    var attribute = parser.parseElement('attributeRef', tokens);
                    if (attribute) {
                        var attributeAccess = {
                            type: "attributeRefAccess",
                            root: root,
                            attribute: attribute,
                            args: [root],
                            op: function(_ctx, rootVal) {
                                var value = runtime.resolveProperty(rootVal, attribute.name, true);
                                return value;
                            },
                            evaluate: function(context){
                                return _runtime.unifiedEval(this, context);
                            }
                        };
                        return attributeAccess;
                    }
                });

                _parser.addIndirectExpression("arrayIndex", function (parser, runtime, tokens, root) {
                    if (tokens.matchOpToken("[")) {

                        var andBefore = false
                        var andAfter = false
                        var firstIndex = null
                        var secondIndex = null

                        if (tokens.matchOpToken("..")) {
                            andBefore = true
                            firstIndex = parser.requireElement("expression", tokens);
                        } else {
                            firstIndex = parser.requireElement("expression", tokens);

                            if (tokens.matchOpToken("..")) {
                                andAfter = true
                                var current = tokens.currentToken()
                                if (current.type !== "R_BRACKET") {
                                    secondIndex = parser.parseElement("expression", tokens)
                                }
                            }
                        }
                        tokens.requireOpToken("]")

                        var arrayIndex = {
                            type: "arrayIndex",
                            root: root,
                            firstIndex: firstIndex,
                            secondIndex: secondIndex,
                            args: [root, firstIndex, secondIndex],
                            op: function(_ctx, root, firstIndex, secondIndex) {
                                if (andBefore) {
                                    return root.slice(0, firstIndex + 1) // returns all items from beginning to firstIndex (inclusive)
                                } else if (andAfter) {
                                    if (secondIndex != null) {
                                        return root.slice(firstIndex, secondIndex + 1) // returns all items from firstIndex to secondIndex (inclusive)
                                    } else {
                                        return root.slice(firstIndex); // returns from firstIndex to end of array
                                    }
                                } else {
                                    return root[firstIndex]
                                }
                            },
                            evaluate: function(context){
                                return _runtime.unifiedEval(this, context);
                            }
                        };

                        return _parser.parseElement("indirectExpression", tokens, arrayIndex);
                    }
                });

                _parser.addGrammarElement("postfixExpression", function(parser, runtime, tokens) {
                    var root = parser.parseElement("primaryExpression", tokens);
                    if (tokens.matchOpToken(":")) {
                        var typeName = tokens.requireTokenType("IDENTIFIER");
                        var nullOk = !tokens.matchOpToken("!");
                        return {
                            type: "typeCheck",
                            typeName: typeName,
                            root: root,
                            nullOk: nullOk,
                            args: [root],
                            op: function (context, val) {
                                var passed = runtime.typeCheck(val, this.typeName.value, this.nullOk);
                                if(passed) {
                                    return val;
                                } else {
                                    throw new Error("Typecheck failed!  Expected: " + this.typeName.value);
                                }                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    } else {
                        return root;
                    }
                });

                _parser.addGrammarElement("logicalNot", function(parser, runtime, tokens) {
                    if (tokens.matchToken("not")) {
                        var root = parser.requireElement("unaryExpression", tokens);
                        return {
                            type: "logicalNot",
                            root: root,
                            args: [root],
                            op: function (context, val) {
                                return !val;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("noExpression", function(parser, runtime, tokens) {
                    if (tokens.matchToken("no")) {
                        var root = parser.requireElement("unaryExpression", tokens);
                        return {
                            type: "noExpression",
                            root: root,
                            args: [root],
                            op: function (_context, val) {
                                return runtime.isEmpty(val);
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("negativeNumber", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("-")) {
                        var root = parser.requireElement("unaryExpression", tokens);
                        return {
                            type: "negativeNumber",
                            root: root,
                            args: [root],
                            op:function(context, value){
                                return -1 * value;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("unaryExpression", function(parser, runtime, tokens) {
                    return parser.parseAnyOf(["logicalNot", "positionalExpression", "noExpression", "negativeNumber", "postfixExpression"], tokens);
                });

                _parser.addGrammarElement("positionalExpression", function(parser, runtime, tokens) {
                    var op = tokens.matchAnyToken('first', 'last', 'random')
                    if (op) {
                        tokens.matchAnyToken("in", "from", "of");
                        var rhs = parser.requireElement('unaryExpression', tokens);
                        return {
                            type: "positionalExpression",
                            rhs: rhs,
                            operator: op.value,
                            args: [rhs],
                            op:function (context, rhsVal) {
                                if (!Array.isArray(rhsVal)) {
                                    if (rhsVal.children) {
                                        rhsVal = rhsVal.children
                                    } else {
                                        rhsVal = Array.from(rhsVal);
                                    }
                                }
                                if (this.operator === "first") {
                                    return rhsVal[0];
                                } else if (this.operator === "last") {
                                    return rhsVal[rhsVal.length - 1];
                                } else if (this.operator === "random") {
                                    return rhsVal[Math.floor(Math.random() * rhsVal.length)];
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    }
                });

                _parser.addGrammarElement("mathOperator", function(parser, runtime, tokens) {
                    var expr = parser.parseElement("unaryExpression", tokens);
                    var mathOp, initialMathOp = null;
                    mathOp = tokens.matchAnyOpToken("+", "-", "*", "/", "%")
                    while (mathOp) {
                        initialMathOp = initialMathOp || mathOp;
                        var operator = mathOp.value;
                        if (initialMathOp.value !== operator) {
                            parser.raiseParseError(tokens, "You must parenthesize math operations with different operators")
                        }
                        var rhs = parser.parseElement("unaryExpression", tokens);
                        expr = {
                            type: "mathOperator",
                            lhs: expr,
                            rhs: rhs,
                            operator: operator,
                            args: [expr, rhs],
                            op:function (context, lhsVal, rhsVal) {
                                if (this.operator === "+") {
                                    return lhsVal + rhsVal;
                                } else if (this.operator === "-") {
                                    return lhsVal - rhsVal;
                                } else if (this.operator === "*") {
                                    return lhsVal * rhsVal;
                                } else if (this.operator === "/") {
                                    return lhsVal / rhsVal;
                                } else if (this.operator === "%") {
                                    return lhsVal % rhsVal;
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                        mathOp = tokens.matchAnyOpToken("+", "-", "*", "/", "%")
                    }
                    return expr;
                });

                _parser.addGrammarElement("mathExpression", function(parser, runtime, tokens) {
                    return parser.parseAnyOf(["mathOperator", "unaryExpression"], tokens);
                });

                _parser.addGrammarElement("comparisonOperator", function(parser, runtime, tokens) {
                    var expr = parser.parseElement("mathExpression", tokens);
                    var comparisonToken = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==")
                    var comparisonStr = comparisonToken ? comparisonToken.value : null;
                    var hasRightValue = true; // By default, most comparisons require two values, but there are some exceptions.
                    var typeCheck = false;

                    if (comparisonStr == null) {
                        if (tokens.matchToken("is") || tokens.matchToken("am")) {
                            if (tokens.matchToken("not")) {
                                if (tokens.matchToken("in")) {
                                    comparisonStr = "not in";
                                } else if (tokens.matchToken("a")) {
                                    comparisonStr = "not a";
                                    typeCheck = true;
                                } else if (tokens.matchToken("empty")) {
                                    comparisonStr = "not empty";
                                    hasRightValue = false;
                                } else {
                                    comparisonStr = "!=";
                                }
                            } else if (tokens.matchToken("in")) {
                                comparisonStr = "in";
                            } else if (tokens.matchToken("a")) {
                                comparisonStr = "a";
                                typeCheck = true;
                            } else if (tokens.matchToken("empty")) {
                                comparisonStr = "empty";
                                hasRightValue = false;
                            } else {
                                comparisonStr = "==";
                            }
                        } else if (tokens.matchToken("matches") || tokens.matchToken("match")) {
                            comparisonStr = "match";
                        } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
                            comparisonStr = "contain";
                        } else if (tokens.matchToken("do") || tokens.matchToken("does")) {
                            tokens.requireToken('not');
                            if (tokens.matchToken("matches") || tokens.matchToken("match")) {
                                comparisonStr = "not match";
                            } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
                                comparisonStr = "not contain";
                            } else {
                                parser.raiseParseError(tokens, "Expected matches or contains");
                            }
                        }
                    }

                    if (comparisonStr) { // Do not allow chained comparisons, which is dumb
                        if (typeCheck) {
                            var typeName = tokens.requireTokenType("IDENTIFIER");
                            var nullOk = !tokens.matchOpToken("!");
                        } else if (hasRightValue) {
                            var rhs = parser.requireElement("mathExpression", tokens);
                            if (comparisonStr === "match" || comparisonStr === "not match") {
                                rhs = rhs.css ? rhs.css : rhs;
                            }
                        }
                        expr = {
                            type: "comparisonOperator",
                            operator: comparisonStr,
                            typeName: typeName,
                            nullOk: nullOk,
                            lhs: expr,
                            rhs: rhs,
                            args: [expr, rhs],
                            op:function (context, lhsVal, rhsVal) {
                                if (this.operator === "==") {
                                    return lhsVal == rhsVal;
                                } else if (this.operator === "!=") {
                                    return lhsVal != rhsVal;
                                } if (this.operator === "in") {
                                    return (rhsVal != null) && Array.from(rhsVal).indexOf(lhsVal) >= 0;
                                } if (this.operator === "not in") {
                                    return (rhsVal == null) || Array.from(rhsVal).indexOf(lhsVal) < 0;
                                } if (this.operator === "match") {
                                    return (lhsVal != null) && lhsVal.matches(rhsVal);
                                } if (this.operator === "not match") {
                                    return (lhsVal == null) || !lhsVal.matches(rhsVal);
                                } if (this.operator === "contain") {
                                    return (lhsVal != null) && lhsVal.contains(rhsVal);
                                } if (this.operator === "not contain") {
                                    return (lhsVal == null) || !lhsVal.contains(rhsVal);
                                } if (this.operator === "===") {
                                    return lhsVal === rhsVal;
                                } else if (this.operator === "!==") {
                                    return lhsVal !== rhsVal;
                                } else if (this.operator === "<") {
                                    return lhsVal < rhsVal;
                                } else if (this.operator === ">") {
                                    return lhsVal > rhsVal;
                                } else if (this.operator === "<=") {
                                    return lhsVal <= rhsVal;
                                } else if (this.operator === ">=") {
                                    return lhsVal >= rhsVal;
                                } else if (this.operator === "empty") {
                                    return runtime.isEmpty(lhsVal);
                                } else if (this.operator === "not empty") {
                                    return !runtime.isEmpty(lhsVal);
                                } else if (this.operator === "a") {
                                    return runtime.typeCheck(lhsVal, this.typeName.value, this.nullOk);
                                } else if (this.operator === "not a") {
                                    return !runtime.typeCheck(lhsVal, this.typeName.value, this.nullOk);
                                } else {
                                    throw "Unknown comparison : " + this.operator;
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                    return expr;
                });

                _parser.addGrammarElement("comparisonExpression", function(parser, runtime, tokens) {
                    return parser.parseAnyOf(["comparisonOperator", "mathExpression"], tokens);
                });

                _parser.addGrammarElement("logicalOperator", function(parser, runtime, tokens) {
                    var expr = parser.parseElement("comparisonExpression", tokens);
                    var logicalOp, initialLogicalOp = null;
                    logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
                    while (logicalOp) {
                        initialLogicalOp = initialLogicalOp || logicalOp;
                        if (initialLogicalOp.value !== logicalOp.value) {
                            parser.raiseParseError(tokens, "You must parenthesize logical operations with different operators")
                        }
                        var rhs = parser.requireElement("comparisonExpression", tokens);
                        expr = {
                            type: "logicalOperator",
                            operator: logicalOp.value,
                            lhs: expr,
                            rhs: rhs,
                            args: [expr, rhs],
                            op: function (context, lhsVal, rhsVal) {
                                if (this.operator === "and") {
                                    return lhsVal && rhsVal;
                                } else {
                                    return lhsVal || rhsVal;
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                        logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
                    }
                    return expr;
                });

                _parser.addGrammarElement("logicalExpression", function(parser, runtime, tokens) {
                    return parser.parseAnyOf(["logicalOperator", "mathExpression"], tokens);
                });

                _parser.addGrammarElement("asyncExpression", function(parser, runtime, tokens) {
                    if (tokens.matchToken('async')) {
                        var value = parser.requireElement("logicalExpression", tokens);
                        var expr = {
                            type: "asyncExpression",
                            value: value,
                            evaluate: function (context) {
                                return {
                                    asyncWrapper: true,
                                    value: this.value.evaluate(context) //OK
                                }
                            }
                        }
                        return expr;
                    } else {
                        return parser.parseElement("logicalExpression", tokens);
                    }
                });

                _parser.addGrammarElement("expression", function(parser, runtime, tokens) {
                    tokens.matchToken("the"); // optional the
                    return parser.parseElement("asyncExpression", tokens);
                });

                _parser.addGrammarElement("targetExpression", function(parser, runtime, tokens) {
                    tokens.matchToken("the"); // optional the

                    // TODO obviously we need to generalize this as a left hand side / targetable concept
                    var expr = parser.parseElement("primaryExpression", tokens);
                    if (expr.type === "symbol" || expr.type === "idRef" || expr.type === "inExpression" ||
                        expr.type === "queryRef" || expr.type === "classRef" || expr.type === "ofExpression" ||
                        expr.type === "propertyAccess" || expr.type === "closestExpr" || expr.type === "attributeRefAccess" ||
                        expr.type === "attributeRef" || expr.type === "possessive") {
                        return expr;
                    } else {
                        _parser.raiseParseError(tokens, "A target expression must be writable.  The expression type '" + expr.type + "' is not.");
                    }
                    return expr;
                });

                _parser.addGrammarElement("hyperscript", function(parser, runtime, tokens) {

                    var features = [];

                    if (tokens.hasMore()) {
                        while (parser.featureStart(tokens.currentToken()) || tokens.currentToken().value === "(") {
                            var feature = parser.requireElement("feature", tokens);
                            features.push(feature);
                            tokens.matchToken("end"); // optional end
                        } 
                    }
                    return {
                        type: "hyperscript",
                        features: features,
                        apply: function (target, source, args) {
                            // no op
                            _runtime.forEach(features, function(feature){
                                feature.install(target, source, args);
                            })
                        }
                    };
                })

                var parseEventArgs = function (tokens) {
                    var args = [];
                    // handle argument list (look ahead 3)
                    if (tokens.token(0).value === "(" &&
                        (tokens.token(1).value === ")" ||
                            tokens.token(2).value === "," ||
                            tokens.token(2).value === ")")) {
                        tokens.matchOpToken("(");
                        do {
                            args.push(tokens.requireTokenType('IDENTIFIER'));
                        } while (tokens.matchOpToken(","))
                        tokens.requireOpToken(')')
                    }
                    return args;
                }

                _parser.addFeature("on", function(parser, runtime, tokens) {

                    if (tokens.matchToken('on')) {
                        var every = false;
                        if (tokens.matchToken("every")) {
                            every = true;
                        }
                        var events = [];
                        var displayName = null;
                        do {

                            var on = parser.requireElement("dotOrColonPath", tokens, "Expected event name");

                            var eventName = on.evaluate(); // OK No Promise



                            if (displayName) {
                                displayName = displayName + " or " + eventName;
                            } else {
                                displayName = "on " + eventName;
                            }
                            var args = parseEventArgs(tokens);

                            var filter = null;
                            if (tokens.matchOpToken('[')) {
                                filter = parser.requireElement("expression", tokens);
                                tokens.requireOpToken(']');
                            }

                            if (tokens.currentToken().type === "NUMBER") {
                                var startCountToken = tokens.consumeToken();
                                var startCount = parseInt(startCountToken.value);
                                if (tokens.matchToken("to")) {
                                    var endCountToken = tokens.consumeToken();
                                    var endCount = parseInt(endCountToken.value);
                                } else if (tokens.matchToken("and")) {
                                    var unbounded = true;
                                    tokens.requireToken("on");
                                }
                            }

                            if (eventName === "intersection") {
                                var intersectionSpec = {};
                                if (tokens.matchToken("with")) {
                                    intersectionSpec['with'] = parser.parseElement("targetExpression", tokens).evaluate();
                                }
                                if (tokens.matchToken("having")) {
                                    do {
                                        if (tokens.matchToken('margin')) {
                                            intersectionSpec['rootMargin'] = parser.parseElement("stringLike", tokens).evaluate();
                                        } else if (tokens.matchToken('threshold')) {
                                            intersectionSpec['threshold'] = parser.parseElement("expression", tokens).evaluate();
                                        } else {
                                            parser.raiseParseError(tokens, "Unknown intersection config specification");
                                        }
                                    } while(tokens.matchToken("and"))
                                }
                            } else if (eventName === "mutation") {
                                var mutationSpec = {};
                                if (tokens.matchToken("of")) {
                                    do {
                                        if (tokens.matchToken('anything')) {
                                            mutationSpec['attributes'] = true;
                                            mutationSpec['subtree'] = true;
                                            mutationSpec['characterData'] = true;
                                            mutationSpec['childList'] = true;
                                        } else if (tokens.matchToken('childList')) {
                                            mutationSpec['childList'] = true;
                                        } else if (tokens.matchToken('attributes')) {
                                            mutationSpec['attributes'] = true;
                                            mutationSpec['attributeOldValue'] = true;
                                        } else if(tokens.matchToken('subtree')) {
                                            mutationSpec['subtree'] = true;
                                        } else if(tokens.matchToken('characterData')) {
                                            mutationSpec['characterData'] = true;
                                            mutationSpec['characterDataOldValue'] = true;
                                        } else if (tokens.currentToken().type === "ATTRIBUTE_REF") {
                                            var attribute = tokens.consumeToken();
                                            if (mutationSpec['attributeFilter'] == null) {
                                                mutationSpec['attributeFilter'] = [];
                                            }
                                            if (attribute.value.indexOf('@') == 0) {
                                                mutationSpec['attributeFilter'].push(attribute.value.substring(1));
                                            } else {
                                                parser.raiseParseError(tokens, "Only shorthand attribute references are allowed here");
                                            }
                                        } else {
                                            parser.raiseParseError(tokens, "Unknown mutation config specification");
                                        }
                                    } while(tokens.matchToken("or"))
                                } else {
                                    mutationSpec['attributes'] = true;
                                    mutationSpec['characterData'] = true;
                                    mutationSpec['childList'] = true;
                                }
                            }

                            var from = null;
                            var elsewhere = false;
                            if (tokens.matchToken("from")) {
                                if (tokens.matchToken('elsewhere')) {
                                    elsewhere = true;
                                } else {
                                    from = parser.parseElement("targetExpression", tokens)
                                    if (!from) {
                                        parser.raiseParseError('Expected either target value or "elsewhere".', tokens);
                                    }
                                }
                            }
                            // support both "elsewhere" and "from elsewhere"
                            if (from === null && elsewhere === false && tokens.matchToken("elsewhere")) {
                                elsewhere = true;
                            }

                            if (tokens.matchToken('in')) {
                                var inExpr = parser.parseAnyOf(["idRef", "queryRef", "classRef"], tokens);
                            }

                            if (tokens.matchToken('debounced')) {
                                tokens.requireToken("at");
                                var timeExpr = parser.requireElement("timeExpression", tokens);
                                var debounceTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                            } else if (tokens.matchToken('throttled')) {
                                tokens.requireToken("at");
                                var timeExpr = parser.requireElement("timeExpression", tokens);
                                var throttleTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                            }

                            events.push({
                                execCount: 0,
                                every: every,
                                on: eventName,
                                args: args,
                                filter: filter,
                                from:from,
                                inExpr:inExpr,
                                elsewhere:elsewhere,
                                startCount : startCount,
                                endCount : endCount,
                                unbounded : unbounded,
                                debounceTime : debounceTime,
                                throttleTime : throttleTime,
                                mutationSpec : mutationSpec,
                                intersectionSpec : intersectionSpec,
                            })
                        } while (tokens.matchToken("or"))


                        var queue = [];
                        var queueLast = true;
                        if (!every) {
                            if (tokens.matchToken("queue")) {
                                if (tokens.matchToken("all")) {
                                    var queueAll = true;
                                    var queueLast = false;
                                } else if(tokens.matchToken("first")) {
                                    var queueFirst = true;
                                } else if(tokens.matchToken("none")) {
                                    var queueNone = true;
                                } else {
                                    tokens.requireToken("last");
                                }
                            }
                        }

                        var start = parser.requireElement("commandList", tokens);

                        var implicitReturn = {
                            type: "implicitReturn",
                            op: function (context) {
                                // automatically resolve at the end of an event handler if nothing else does
                                context.meta.resolve();
                                return runtime.HALT;
                            },
                            execute: function (ctx) {
                                // do nothing
                            }
                        };
                        if (start) {
                            var end = start;
                            while (end.next) {
                                end = end.next;
                            }
                            end.next = implicitReturn
                        } else {
                            start = implicitReturn
                        }

                        var onFeature = {
                            displayName: displayName,
                            events:events,
                            start: start,
                            every: every,
                            executing: false,
                            execCount: 0,
                            queue: queue,
                            execute: function (/** @type {Context} */ctx) {
                                if (this.executing && this.every === false) {
                                    if (queueNone || (queueFirst && queue.length > 0)) {
                                        return;
                                    }
                                    if (queueLast) {
                                        onFeature.queue.length = 0;
                                    }
                                    onFeature.queue.push(ctx);
                                    return;
                                }
                                this.execCount++;
                                this.executing = true;
                                ctx.meta.resolve = function () {
                                    onFeature.executing = false;
                                    var queued = onFeature.queue.shift();
                                    if (queued) {
                                        setTimeout(function () {
                                            onFeature.execute(queued);
                                        }, 1);
                                    }
                                }
                                ctx.meta.reject = function (err) {
                                    console.error(err.message ? err.message : err);
                                    var hypertrace = runtime.getHyperTrace(ctx, err);
                                    if (hypertrace) {
                                        hypertrace.print();
                                    }
                                    runtime.triggerEvent(ctx.me, 'exception', {error: err})
                                    onFeature.executing = false;
                                    var queued = onFeature.queue.shift();
                                    if (queued) {
                                    setTimeout(function () {
                                        onFeature.execute(queued);
                                        }, 1);
                                    }
                                }
                                start.execute(ctx);
                            },
                            install: function (elt, source, args) {
                                runtime.forEach(onFeature.events, function(eventSpec) {
                                    var targets;
                                    if (eventSpec.elsewhere) {
                                        targets = [document];
                                    } else if (eventSpec.from) {
                                        targets = eventSpec.from.evaluate({me: elt});
                                    } else {
                                        targets = [elt];
                                    }
                                    runtime.forEach(targets, function (target) { // OK NO PROMISE

                                        var eventName = eventSpec.on;
                                        if (eventSpec.mutationSpec) {
                                            eventName = 'hyperscript:mutation';
                                            var observer = new MutationObserver(function(mutationList, observer){
                                                console.log(target, mutationList);
                                                if (!onFeature.executing) {
                                                    _runtime.triggerEvent(target, eventName, {
                                                        mutationList: mutationList, observer: observer
                                                    });
                                                }
                                            });
                                            observer.observe(target, eventSpec.mutationSpec);
                                        }

                                        if (eventSpec.intersectionSpec) {
                                            eventName = 'hyperscript:insersection';
                                            var observer = new IntersectionObserver(function (entries) {
                                                _runtime.forEach(entries, function (entry) {
                                                    var detail = {
                                                        observer: observer
                                                    };
                                                    detail = mergeObjects(detail, entry);
                                                    detail['intersecting'] = entry.isIntersecting;
                                                    _runtime.triggerEvent(target, eventName, detail);
                                                })
                                            }, eventSpec.intersectionSpec);
                                            observer.observe(target);
                                        }

                                        target.addEventListener(eventName, function listener(evt) { // OK NO PROMISE
                                            if (elt instanceof Node &&
                                                !elt.getRootNode()) {
                                                target.removeEventListener(eventName, listener);
                                                return;
                                            }
                                            
                                            var ctx = runtime.makeContext(elt, onFeature, elt, evt, args);
                                            if (eventSpec.elsewhere && elt.contains(evt.target)) {
                                                return
                                            }
                                            if (eventSpec.from) {
                                                ctx.result = target;
                                            }

                                            // establish context
                                            runtime.forEach(eventSpec.args, function (arg) {
                                                ctx[arg.value] = ctx.event[arg.value] || (ctx.event.detail ? ctx.event.detail[arg.value] : null);
                                            });

                                            // apply filter
                                            if (eventSpec.filter) {
                                                var initialCtx = ctx.meta.context;
                                                ctx.meta.context = ctx.event;
                                                try {
                                                    var value = eventSpec.filter.evaluate(ctx); //OK NO PROMISE
                                                    if (value) {
                                                        // match the javascript semantics for if statements
                                                    } else {
                                                        return;
                                                    }
                                                } finally {
                                                    ctx.meta.context = initialCtx;
                                                }
                                            }

                                            if (eventSpec.inExpr) {
                                                var inElement = evt.target;
                                                while(true) {
                                                    if (inElement.matches && inElement.matches(eventSpec.inExpr.css)) {
                                                        ctx.result = inElement;
                                                        break;
                                                    } else {
                                                        inElement = inElement.parentElement;
                                                        if (inElement == null) {
                                                            return; // no match found
                                                        }
                                                    }
                                                }
                                            }

                                            // verify counts
                                            eventSpec.execCount++;
                                            if (eventSpec.startCount) {
                                                if (eventSpec.endCount) {
                                                    if (eventSpec.execCount < eventSpec.startCount ||
                                                        eventSpec.execCount > eventSpec.endCount) {
                                                        return;
                                                    }
                                                } else if (eventSpec.unbounded) {
                                                    if (eventSpec.execCount < eventSpec.startCount) {
                                                        return;
                                                    }
                                                } else if (eventSpec.execCount !== eventSpec.startCount) {
                                                    return;
                                                }
                                            }

                                            //debounce
                                            if (eventSpec.debounceTime) {
                                                if (eventSpec.debounced) {
                                                    clearTimeout(eventSpec.debounced);
                                                }
                                                eventSpec.debounced = setTimeout(function () {
                                                    onFeature.execute(ctx);
                                                }, eventSpec.debounceTime);
                                                return;
                                            }

                                            // throttle
                                            if (eventSpec.throttleTime) {
                                                if (eventSpec.lastExec && Date.now() < eventSpec.lastExec + eventSpec.throttleTime) {
                                                    return;
                                                } else {
                                                    eventSpec.lastExec = Date.now();
                                                }
                                            }

                                            // apply execute
                                            onFeature.execute(ctx);
                                        });
                                    })
                                });
                            }
                        };
                        parser.setParent(start, onFeature);
                        return onFeature;
                    }
                });

                _parser.addFeature("def", function(parser, runtime, tokens) {
                    if (tokens.matchToken('def')) {
                        var functionName = parser.requireElement("dotOrColonPath", tokens);
                        var nameVal = functionName.evaluate(); // OK
                        var nameSpace = nameVal.split(".");
                        var funcName = nameSpace.pop();

                        var args = [];
                        if (tokens.matchOpToken("(")) {
                            if (tokens.matchOpToken(")")) {
                                // emtpy args list
                            } else {
                                do {
                                    args.push(tokens.requireTokenType('IDENTIFIER'));
                                } while (tokens.matchOpToken(","))
                                tokens.requireOpToken(')')
                            }
                        }

                        var start = parser.parseElement("commandList", tokens);
                        if (tokens.matchToken('catch')) {
                            var errorSymbol = tokens.requireTokenType('IDENTIFIER').value;
                            var errorHandler = parser.parseElement("commandList", tokens);
                        }
                        var functionFeature = {
                            displayName: funcName + "(" + args.map(function(arg){ return arg.value }).join(", ") + ")",
                            name: funcName,
                            args: args,
                            start: start,
                            errorHandler: errorHandler,
                            errorSymbol: errorSymbol,
                            install: function (target, source, installArgs) {
                                var func = function () {
                                    // null, worker
                                    var ctx = runtime.makeContext(source, functionFeature, target, null, installArgs);

                                    // install error handler if any
                                    ctx.meta.errorHandler = errorHandler;
                                    ctx.meta.errorSymmbol = errorSymbol;

                                    for (var i = 0; i < args.length; i++) {
                                        var name = args[i];
                                        var argumentVal = arguments[i];
                                        if (name) {
                                            ctx[name.value] = argumentVal;
                                        }
                                    }
                                    ctx.meta.caller = arguments[args.length];
                                    if (ctx.meta.caller) {
                                        ctx.meta.callingCommand = ctx.meta.caller.meta.command;
                                    }
                                    var resolve, reject = null;
                                    var promise = new Promise(function (theResolve, theReject) {
                                        resolve = theResolve;
                                        reject = theReject;
                                    });
                                    start.execute(ctx);
                                    if (ctx.meta.returned) {
                                        return ctx.meta.returnValue;
                                    } else {
                                        ctx.meta.resolve = resolve;
                                        ctx.meta.reject = reject;
                                        return promise
                                    }
                                };
                                func.hyperfunc = true;
                                func.hypername = nameVal;
                                runtime.assignToNamespace(target, nameSpace, funcName, func);
                            }
                        };

                        var implicitReturn = {
                            type: "implicitReturn",
                            op: function (context) {
                                // automatically return at the end of the function if nothing else does
                                context.meta.returned = true;
                                if (context.meta.resolve) {
                                    context.meta.resolve();
                                }
                                return runtime.HALT;
                            },
                            execute: function (context) {
                                // do nothing
                            }
                        }
                        // terminate body
                        if (start) {
                            var end = start;
                            while (end.next) {
                                end = end.next;
                            }
                            end.next = implicitReturn
                        } else {
                            functionFeature.start = implicitReturn
                        }

                        // terminate error handler
                        if (errorHandler) {
                            var end = errorHandler;
                            while (end.next) {
                                end = end.next;
                            }
                            end.next = implicitReturn
                        }

                        parser.setParent(start, functionFeature);
                        return functionFeature;
                    }
                });

                _parser.addFeature("init", function(parser, runtime, tokens) {
                    if (tokens.matchToken('init')) {
                        var start = parser.parseElement("commandList", tokens);
                        var initFeature = {
                            start: start,
                            install: function (target, source, args) {
                                setTimeout(function () {
                                    start.execute(runtime.makeContext(target, this, target, null, args));
                                }, 0);
                            }
                        };

                        var implicitReturn = {
                            type: "implicitReturn",
                            op: function (context) {
                                return runtime.HALT;
                            },
                            execute: function (context) {
                                // do nothing
                            }
                        }
                        // terminate body
                        if (start) {
                            var end = start;
                            while (end.next) {
                                end = end.next;
                            }
                            end.next = implicitReturn
                        } else {
                            initFeature.start = implicitReturn
                        }
                        parser.setParent(start, initFeature);
                        return initFeature;
                    }
                });

                _parser.addFeature("worker", function (parser, runtime, tokens) {
                    if (tokens.matchToken("worker")) {
                        parser.raiseParseError(tokens,
                            "In order to use the 'worker' feature, include " +
                            "the _hyperscript worker plugin. See " +
                            "https://hyperscript.org/features/worker/ for " +
                            "more info.")
                    }
                })

                _parser.addFeature("behavior", function (parser, runtime, tokens) {
                	if (!tokens.matchToken("behavior")) return;
                	var path = parser.parseElement("dotOrColonPath", tokens).evaluate();
                	var nameSpace = path.split(".");
                	var name = nameSpace.pop();

					var formalParams = [];
                	if (tokens.matchOpToken("(") && !tokens.matchOpToken(")")) {
                        do {
	                    	formalParams.push(tokens.requireTokenType('IDENTIFIER').value);
	                    } while (tokens.matchOpToken(","))
	                    tokens.requireOpToken(')')
  	                }
                	var hs = parser.parseElement("hyperscript", tokens);

                	return {
                		install: function (target, source, outerArgs) {
                			runtime.assignToNamespace(
                				globalScope.document && globalScope.document.body, 
                				nameSpace, name, function (target, source, innerArgs) {
                					var args = mergeObjects({}, outerArgs);
                					for (var i = 0; i < formalParams.length; i++) {
                						args[formalParams[i]] = innerArgs[formalParams[i]]
                					}
                					hs.apply(target, source, args);
                				})
                		}
                	}
                })

                _parser.addFeature("install", function (parser, runtime, tokens) {
                	if (!tokens.matchToken("install")) return;
                	var behaviorPath = parser.requireElement("dotOrColonPath", tokens).evaluate()
                	var behaviorNamespace = behaviorPath.split(".");
                	var args = parser.parseElement("namedArgumentList", tokens);

                	var installFeature;
                	return installFeature = {
                		install: function (target, source) {
                			runtime.unifiedEval({
								args: [args],
                				op: function (ctx, args) {
                					var behavior = globalScope;
		                			for (var i = 0; i < behaviorNamespace.length; i++) {
		                				behavior = behavior[behaviorNamespace[i]];
		                				if (typeof behavior !== "object" && typeof behavior !== "function") throw new Error(
		                					"No such behavior defined as " + behaviorPath
		                				);
		                			}

		                			if (!(behavior instanceof Function)) throw new Error(
		                				behaviorPath + " is not a behavior"
		                			);

		                			behavior(target, source, args);
		                		}
		                	}, runtime.makeContext(target, installFeature, target))
                		}
                	}
                })

                _parser.addGrammarElement("jsBody", function(parser, runtime, tokens) {
                    var jsSourceStart = tokens.currentToken().start;
                    var jsLastToken = tokens.currentToken();

                    var funcNames = [];
                    var funcName = "";
                    var expectFunctionDeclaration = false;
                    while (tokens.hasMore()) {
                        jsLastToken = tokens.consumeToken();
                        var peek = tokens.currentToken(true);
                        if (peek.type === "IDENTIFIER"
                            && peek.value === "end") {
                            break;
                        }
                        if (expectFunctionDeclaration) {
                            if (jsLastToken.type === "IDENTIFIER"
                                || jsLastToken.type === "NUMBER") {
                                funcName += jsLastToken.value;
                            } else {
                                if (funcName !== "") funcNames.push(funcName);
                                funcName = "";
                                expectFunctionDeclaration = false;
                            }
                        } else if (jsLastToken.type === "IDENTIFIER"
                            && jsLastToken.value === "function") {
                            expectFunctionDeclaration = true;
                        }
                    }
                    var jsSourceEnd = jsLastToken.end + 1;

                    return {
                        type: 'jsBody',
                        exposedFunctionNames: funcNames,
                        jsSource: tokens.source.substring(jsSourceStart, jsSourceEnd),
                    }
                })

                _parser.addFeature("js", function(parser, runtime, tokens) {
                    if (tokens.matchToken('js')) {

                        var jsBody = parser.parseElement('jsBody', tokens);

                        var jsSource = jsBody.jsSource +
                            "\nreturn { " +
                            jsBody.exposedFunctionNames.map(function (name) {
                                return name+":"+name;
                            }).join(",") +
                            " } ";
                        var func = new Function(jsSource);

                        return {
                            jsSource: jsSource,
                            function: func,
                            exposedFunctionNames: jsBody.exposedFunctionNames,
                            install: function() {
                                mergeObjects(globalScope, func())
                            }
                        }
                    }
                })

                _parser.addCommand("js", function (parser, runtime, tokens) {
                    if (tokens.matchToken("js")) {
                        // Parse inputs
                        var inputs = [];
                        if (tokens.matchOpToken("(")) {
                            if (tokens.matchOpToken(")")) {
                                // empty input list
                            } else {
                                do {
                                    var inp = tokens.requireTokenType('IDENTIFIER');
                                    inputs.push(inp.value);
                                } while (tokens.matchOpToken(","));
                                tokens.requireOpToken(')');
                            }
                        }

                        var jsBody = parser.parseElement('jsBody', tokens);
                        tokens.matchToken('end');

                        var func = varargConstructor(Function, inputs.concat([jsBody.jsSource]));

                        return {
                            jsSource: jsBody.jsSource,
                            function: func,
                            inputs: inputs,
                            op: function (context) {
                                var args = [];
                                inputs.forEach(function (input) {
                                    args.push(runtime.resolveSymbol(input, context))
                                });
                                var result = func.apply(globalScope, args)
                                if (result && typeof result.then === 'function') {
                                    return Promise(function (resolve) {
                                        result.then(function (actualResult) {
                                            context.result = actualResult
                                            resolve(runtime.findNext(this, context));
                                        })
                                    })
                                } else {
                                    context.result = result
                                    return runtime.findNext(this, context);
                                }
                            }
                        };
                    }
                })

                _parser.addCommand("async", function (parser, runtime, tokens) {
                    if (tokens.matchToken("async")) {
                        if (tokens.matchToken("do")) {
                            var body = parser.requireElement('commandList', tokens)
                            tokens.requireToken("end")
                        } else {
                            var body = parser.requireElement('command', tokens)
                        }
                        return {
                            body: body,
                            op: function (context) {
                                setTimeout(function(){
                                    body.execute(context);
                                })
                                return runtime.findNext(this, context);
                            }
                        };
                    }
                })

                _parser.addCommand("tell", function (parser, runtime, tokens) {
                    var startToken = tokens.currentToken();
                    if (tokens.matchToken("tell")) {
                        var value = parser.requireElement("expression", tokens);
                        var body = parser.requireElement('commandList', tokens)
                        if (tokens.hasMore()) {
                            tokens.requireToken("end");
                        }
                        var slot = "tell_" + startToken.start;
                        var tellCmd = {
                            value: value,
                            body: body,
                            args: [value],
                            resolveNext: function (context) {
                                var iterator = context.meta.iterators[slot];
                                if (iterator.index < iterator.value.length) {
                                    context.beingTold = iterator.value[iterator.index++];
                                    return body;
                                } else {
                                    // restore original me
                                    context.beingTold = iterator.originalBeingTold;
                                    if (this.next) {
                                        return this.next;
                                    } else {
                                        return runtime.findNext(this.parent, context);
                                    }
                                }
                            },
                            op: function (context, value) {
                                if (value == null) {
                                    value = [];
                                } else if (!(Array.isArray(value) || value instanceof NodeList)) {
                                    value = [value];
                                }
                                context.meta.iterators[slot] = {
                                    originalBeingTold: context.beingTold,
                                    index: 0,
                                    value: value
                                };
                                return this.resolveNext(context);
                            }
                        };
                        parser.setParent(body, tellCmd);
                        return tellCmd;
                    }
                })

                _parser.addCommand("wait", function(parser, runtime, tokens) {
                    if (tokens.matchToken("wait")) {
                        // wait on event
                        if (tokens.matchToken("for")) {
                            tokens.matchToken("a"); // optional "a"
                            var events = [];
                            do {
                                events.push({
                                    name: _parser.requireElement("dotOrColonPath", tokens, "Expected event name").evaluate(),
                                    args: parseEventArgs(tokens),
                                });
                            } while (tokens.matchToken("or"))

                            if (tokens.matchToken("from")) {
                                var on = parser.requireElement("expression", tokens);
                            }

                            // wait on event
                            var waitCmd = {
                                event: events,
                                on: on,
                                args: [on],
                                op: function (context, on) {
                                    var target = on ? on : context.me;
                                    return new Promise(function (resolve) {
                                        var resolved = false;
                                        runtime.forEach(events, function (eventInfo) {
                                            var listener = function (event) {
                                                context.result = event
                                                runtime.forEach(eventInfo.args, function (arg) {
                                                    context[arg.value] = event[arg.value] || (event.detail ? event.detail[arg.value] : null);
                                                });
                                                if (!resolved) {
                                                    resolved = true;
                                                    resolve(runtime.findNext(waitCmd, context));
                                                }
                                            };
                                            target.addEventListener(eventInfo.name, listener, {once: true});
                                        });
                                    });
                                }
                            };
                        } else {
                            if(tokens.matchToken("a")){
                                tokens.requireToken('tick');
                                time = 0;
                            } else {
                                var time = _parser.requireElement("timeExpression", tokens);
                            }

                            var waitCmd = {
                                type: "waitCmd",
                                time: time,
                                args: [time],
                                op: function (context, timeValue) {
                                    return new Promise(function (resolve) {
                                        setTimeout(function () {
                                            resolve(runtime.findNext(waitCmd, context));
                                        }, timeValue);
                                    });
                                },
                                execute: function (context) {
                                    return runtime.unifiedExec(this, context);
                                }
                            };
                        }
                        return waitCmd
                    }
                })

                // TODO  - colon path needs to eventually become part of ruby-style symbols
                _parser.addGrammarElement("dotOrColonPath", function(parser, runtime, tokens) {
                    var root = tokens.matchTokenType("IDENTIFIER");
                    if (root) {
                        var path = [root.value];

                        var separator = tokens.matchOpToken(".") || tokens.matchOpToken(":");
                        if (separator) {
                            do {
                                path.push(tokens.requireTokenType("IDENTIFIER").value);
                            } while (tokens.matchOpToken(separator.value))
                        }

                        return {
                            type: "dotOrColonPath",
                            path: path,
                            evaluate: function () {
                                return path.join(separator ? separator.value : "");
                            }
                        }
                    }
                });

                _parser.addCommand("send", function(parser, runtime, tokens) {
                    if (tokens.matchToken('send')) {
                        var eventName = parser.requireElement("dotOrColonPath", tokens);

                        var details = parser.parseElement("namedArgumentList", tokens);
                        if (tokens.matchToken("to")) {
                            var to = parser.requireElement("targetExpression", tokens);
                        } else {
                            var to = parser.requireElement("implicitMeTarget", tokens);
                        }


                        var sendCmd = {
                            eventName: eventName,
                            details: details,
                            to: to,
                            args: [to, eventName, details],
                            op: function (context, to, eventName, details) {
                                runtime.forEach(to, function (target) {
                                    runtime.triggerEvent(target, eventName, details ? details : {});
                                });
                                return runtime.findNext(sendCmd, context);
                            }
                        };
                        return sendCmd
                    }
                })

                var parseReturnFunction = function(parser, runtime, tokens, returnAValue) {
                    if (returnAValue) {
                        var value = parser.requireElement("expression", tokens);
                    }

                    var returnCmd = {
                        value: value,
                        args: [value],
                        op: function (context, value) {
                            var resolve = context.meta.resolve;
                            context.meta.returned = true;
                            if (resolve) {
                                if (value) {
                                    resolve(value);
                                } else {
                                    resolve()
                                }
                            } else {
                                context.meta.returned = true;
                                context.meta.returnValue = value;
                            }
                            return runtime.HALT;
                        }
                    };
                    return returnCmd
                }

                _parser.addCommand("return", function(parser, runtime, tokens) {
                    if (tokens.matchToken('return')) {
                        return parseReturnFunction(parser, runtime, tokens, true);
                    }
                })

                _parser.addCommand("exit", function(parser, runtime, tokens) {
                    if (tokens.matchToken('exit')) {
                        return parseReturnFunction(parser, runtime, tokens, false);
                    }
                })

                _parser.addCommand("halt", function(parser, runtime, tokens) {
                    if (tokens.matchToken('halt')) {
                        if (tokens.matchToken("the")) {
                            tokens.requireToken('event');
                            // optional possessive
                            if (tokens.matchOpToken("'")) {
                                tokens.requireToken("s");
                            }
                            var keepExecuting = true;
                        }
                        if (tokens.matchToken("bubbling")) {
                            var bubbling = true;
                        } else if (tokens.matchToken("default")) {
                            var haltDefault = true;
                        }
                        var exit = parseReturnFunction(parser, runtime, tokens, false);

                        var haltCmd = {
                            keepExecuting:true,
                            bubbling:bubbling,
                            haltDefault:haltDefault,
                            exit:exit,
                            op: function (ctx) {
                                if (ctx.event) {
                                    if (bubbling) {
                                        ctx.event.stopPropagation();
                                    } else if (haltDefault) {
                                        ctx.event.preventDefault();
                                    } else {
                                        ctx.event.stopPropagation();
                                        ctx.event.preventDefault();
                                    }
                                    if(keepExecuting) {
                                        return runtime.findNext(this, ctx);
                                    } else {
                                        return exit;
                                    }
                                }
                            }
                        };
                        return haltCmd;
                    }
                })

                _parser.addCommand("log", function(parser, runtime, tokens) {
                    if (tokens.matchToken('log')) {
                        var exprs = [parser.parseElement("expression", tokens)];
                        while (tokens.matchOpToken(",")) {
                            exprs.push(parser.requireElement("expression", tokens));
                        }
                        if (tokens.matchToken("with")) {
                            var withExpr = parser.requireElement("expression", tokens);
                        }
                        var logCmd = {
                            exprs: exprs,
                            withExpr: withExpr,
                            args: [withExpr, exprs],
                            op: function (ctx, withExpr, values) {
                                if (withExpr) {
                                    withExpr.apply(null, values);
                                } else {
                                    console.log.apply(null, values);
                                }
                                return runtime.findNext(this, ctx);
                            }
                        };
                        return logCmd;
                    }
                })

                _parser.addCommand("throw", function(parser, runtime, tokens) {
                    if (tokens.matchToken('throw')) {
                        var expr = parser.requireElement("expression", tokens);
                        var throwCmd = {
                            expr: expr,
                            args: [expr],
                            op: function (ctx, expr) {
                                runtime.registerHyperTrace(ctx, expr);
                                var reject = ctx.meta && ctx.meta.reject;
                                if (reject) {
                                    reject(expr);
                                    return runtime.HALT;
                                } else {
                                    throw expr;
                                }
                            }
                        };
                        return throwCmd;
                    }
                })

                var parseCallOrGet = function(parser, runtime, tokens) {
                    var expr = parser.requireElement("expression", tokens);
                    var callCmd = {
                        expr: expr,
                        args: [expr],
                        op: function (context, result) {
                            context.result = result;
                            return runtime.findNext(callCmd, context);
                        }
                    };
                    return callCmd
                }
                _parser.addCommand("call", function(parser, runtime, tokens) {
                    if (tokens.matchToken('call')) {
                        var call = parseCallOrGet(parser, runtime, tokens);
                        if (call.expr && call.expr.type !== "functionCall") {
                            parser.raiseParseError(tokens, "Must be a function invocation");
                        }
                        return call;
                    }
                })
                _parser.addCommand("get", function(parser, runtime, tokens) {
                    if (tokens.matchToken('get')) {
                        return parseCallOrGet(parser, runtime, tokens);
                    }
                })

                _parser.addGrammarElement("pseudoCommand", function(parser, runtime, tokens) {
                    var expr = parser.requireElement("primaryExpression", tokens);
                    if (expr.type !== 'functionCall' && expr.root.type !== "symbol") {
                        parser.raiseParseError("Implicit function calls must start with a simple function", tokens);
                    }
                    // optional "on", "with", or "to"
                    if (!tokens.matchAnyToken("to","on","with") && parser.commandBoundary(tokens.currentToken())) {
                        var target = parser.requireElement("implicitMeTarget", tokens);
                    } else {
                        var target = parser.requireElement("expression", tokens);
                    }
                    var functionName = expr.root.name;
                    var functionArgs = expr.argExressions;

                    /** @type {GrammarElement} */
                    var pseudoCommand = {
                        type: "pseudoCommand",
                        expr: expr,
                        args: [target, functionArgs],
                        op: function (context, target, args) {
                            var func = target[functionName];
                            if (func.hyperfunc) {
                                args.push(context);
                            }
                            var result = func.apply(target, args);
                            context.result = result;
                            return runtime.findNext(pseudoCommand, context);
                        },
                        execute : function (context) {
                            return runtime.unifiedExec(this, context);
                        }
                    };

                    return pseudoCommand;
                })

                /**
                 * @param {ParserObject} parser 
                 * @param {RuntimeObject} runtime 
                 * @param {TokensObject} tokens 
                 * @param {*} target 
                 * @param {*} value 
                 * @returns 
                 */
                var makeSetter = function(parser, runtime, tokens, target, value) {
                    var symbolWrite = target.type === "symbol";
                    var attributeWrite = target.type === "attributeRef";
                    if (!attributeWrite && !symbolWrite && target.root == null) {
                        parser.raiseParseError(tokens, "Can only put directly into symbols, not references")
                    }

                    var root = null;
                    var prop = null;
                    if (symbolWrite) {
                        // root is null
                    } else if (attributeWrite) {
                        root = parser.requireElement('implicitMeTarget', tokens);
                        var attribute = target;
                    } else {
                        prop = target.prop ? target.prop.value : null;
                        var attribute = target.attribute;
                        root = target.root;
                    }

                    /** @type {GrammarElement} */
                    var setCmd = {
                        target: target,
                        symbolWrite: symbolWrite,
                        value: value,
                        args: [root, value],
                        op: function (context, root, valueToSet) {
                            if (symbolWrite) {
                                context[target.name] = valueToSet;
                            } else {
                                runtime.forEach(root, function (elt) {
                                    if (attribute) {
                                        elt.setAttribute(attribute.name, valueToSet);
                                    } else {
                                        elt[prop] = valueToSet;
                                    }
                                })
                            }
                            return runtime.findNext(this, context);
                        }
                    };
                    return setCmd
                }

                _parser.addCommand("default", function(parser, runtime, tokens) {

                    if (tokens.matchToken('default')) {

                        var target = parser.requireElement("targetExpression", tokens);
                        tokens.requireToken("to");

                        var value = parser.requireElement("expression", tokens);

                        /** @type {GrammarElement} */
                        var setter = makeSetter(parser, runtime, tokens, target, value);
                        var defaultCmd = {
                            target: target,
                            value: value,
                            setter: setter,
                            args: [target],
                            op: function (context, target) {
                                if (target) {
                                    return runtime.findNext(this, context);
                                } else {
                                    return setter;
                                }
                            }
                        };
                        setter.parent = defaultCmd;
                        return defaultCmd;
                    }
                })

                _parser.addCommand("set", function(parser, runtime, tokens) {

                    if (tokens.matchToken('set')) {
						if (tokens.currentToken().type === "L_BRACE") {
							var obj = parser.requireElement("objectLiteral", tokens);
							tokens.requireToken("on");
							var target = parser.requireElement("expression", tokens);

							return {
								objectLiteral: obj,
								target: target,
								args: [obj, target],
								op: function (ctx, obj, target) {
									mergeObjects(target, obj);
									return runtime.findNext(this, ctx);
								}
							}
						}

                        try {
                            tokens.pushFollow("to");
                            var target = parser.requireElement("targetExpression", tokens);
                        } finally {
                            tokens.popFollow();
                        }
                        tokens.requireToken("to");
                        var value = parser.requireElement("expression", tokens);
                        return makeSetter(parser, runtime, tokens, target, value);
                    }
                })

                _parser.addCommand("if", function(parser, runtime, tokens) {
                    if (tokens.matchToken('if')) {
                        var expr = parser.requireElement("expression", tokens);
                        tokens.matchToken("then"); // optional 'then'
                        var trueBranch = parser.parseElement("commandList", tokens);
                        if (tokens.matchToken("else")) {
                            var falseBranch = parser.parseElement("commandList", tokens);
                        }
                        if (tokens.hasMore()) {
                            tokens.requireToken("end");
                        }

                        /** @type {GrammarElement} */
                        var ifCmd = {
                            expr: expr,
                            trueBranch: trueBranch,
                            falseBranch: falseBranch,
                            args: [expr],
                            op: function (context, exprValue) {
                                if (exprValue) {
                                    return trueBranch;
                                } else if (falseBranch) {
                                    return falseBranch;
                                } else {
                                    return runtime.findNext(this, context);
                                }
                            }
                        };
                        parser.setParent(trueBranch, ifCmd);
                        parser.setParent(falseBranch, ifCmd);
                        return ifCmd
                    }
                })

                var parseRepeatExpression = function(parser, tokens, runtime, startedWithForToken) {
                    var innerStartToken = tokens.currentToken();
                    if (tokens.matchToken("for") || startedWithForToken) {
                        var identifierToken = tokens.requireTokenType('IDENTIFIER');
                        var identifier = identifierToken.value;
                        tokens.requireToken("in");
                        var expression = parser.requireElement("expression", tokens);
                    } else if (tokens.matchToken("in")) {
                        var identifier = "it";
                        var expression = parser.requireElement("expression", tokens);
                    } else if (tokens.matchToken("while")) {
                        var whileExpr = parser.requireElement("expression", tokens);
                    } else if (tokens.matchToken("until")) {
                        var isUntil = true;
                        if (tokens.matchToken("event")) {
                            var evt = _parser.requireElement("dotOrColonPath", tokens, "Expected event name");
                            if (tokens.matchToken("from")) {
                                var on = parser.requireElement("expression", tokens);
                            }
                        } else {
                            var whileExpr = parser.requireElement("expression", tokens);
                        }
                    } else if (tokens.matchTokenType('NUMBER')) {
                        var times = parseFloat(innerStartToken.value);
                        tokens.requireToken('times');
                    } else {
                        tokens.matchToken("forever"); // consume optional forever
                        var forever = true;
                    }

                    if (tokens.matchToken("index")) {
                        var identifierToken = tokens.requireTokenType('IDENTIFIER');
                        var indexIdentifier = identifierToken.value
                    }

                    var loop = parser.parseElement("commandList", tokens);
                    if (loop && evt) {
                        // if this is an event based loop, wait a tick at the end of the loop so that
                        // events have a chance to trigger in the loop condition o_O)))
                        var last = loop;
                        while (last.next) {
                            last = last.next;
                        }
                        var waitATick = {
                            type: 'waitATick',
                            op : function() {
                                return new Promise(function (resolve) {
                                    setTimeout(function () {
                                        resolve(runtime.findNext(waitATick));
                                    }, 0);
                                });
                            }
                        };
                        last.next = waitATick
                    }
                    if (tokens.hasMore()) {
                        tokens.requireToken("end");
                    }

                    if (identifier == null) {
                        identifier = "_implicit_repeat_" + innerStartToken.start;
                        var slot = identifier;
                    } else {
                        var slot = identifier + "_" + innerStartToken.start;
                    }

                    var repeatCmd = {
                        identifier: identifier,
                        indexIdentifier: indexIdentifier,
                        slot: slot,
                        expression: expression,
                        forever: forever,
                        times: times,
                        until: isUntil,
                        event: evt,
                        on: on,
                        whileExpr: whileExpr,
                        resolveNext: function () {
                            return this;
                        },
                        loop: loop,
                        args: [whileExpr],
                        op: function (context, whileValue) {
                            var iterator = context.meta.iterators[slot];
                            var keepLooping = false;
                            if (this.forever) {
                                keepLooping = true;
                            } else if (this.until) {
                                if (evt) {
                                    keepLooping = context.meta.iterators[slot].eventFired === false;
                                } else {
                                    keepLooping = whileValue !== true;
                                }
                            } else if (whileValue) {
                                keepLooping = true;
                            } else if (times) {
                                keepLooping = iterator.index < this.times;
                            } else {
                                keepLooping = iterator.value !== null && iterator.index < iterator.value.length
                            }

                            if (keepLooping) {
                                if (iterator.value) {
                                    context[identifier] = iterator.value[iterator.index];
                                    context.result = iterator.value[iterator.index];
                                } else {
                                    context.result = iterator.index;
                                }
                                if (indexIdentifier) {
                                    context[indexIdentifier] = iterator.index;
                                }
                                iterator.index++;
                                return loop;
                            } else {
                                context.meta.iterators[slot] = null;
                                return runtime.findNext(this.parent, context);
                            }
                        }
                    };
                    parser.setParent(loop, repeatCmd);
                    var repeatInit = {
                        name: "repeatInit",
                        args: [expression, evt, on],
                        op: function (context, value, event, on) {
                            context.meta.iterators[slot] = {
                                index: 0,
                                value: value,
                                eventFired: false
                            };
                            if (evt) {
                                var target = on || context.me;
                                target.addEventListener(event, function (e) {
                                    context.meta.iterators[slot].eventFired = true;
                                }, {once: true});
                            }
                            return repeatCmd; // continue to loop
                        },
                        execute: function (context) {
                            return runtime.unifiedExec(this, context);
                        }
                    }
                    parser.setParent(repeatCmd, repeatInit);
                    return repeatInit
                }

                _parser.addCommand("repeat", function(parser, runtime, tokens) {
                    if (tokens.matchToken('repeat')) {
                        return parseRepeatExpression(parser, tokens, runtime,false);
                    }
                })

                _parser.addCommand("for", function(parser, runtime, tokens) {
                    if (tokens.matchToken('for')) {
                        return parseRepeatExpression(parser, tokens, runtime, true);
                    }
                })


                _parser.addGrammarElement("stringLike", function(parser, runtime, tokens) {
                    return _parser.parseAnyOf(["string", "nakedString"], tokens);
                });

                _parser.addCommand("append", function(parser, runtime, tokens) {
                    if (tokens.matchToken("append")) {

                        var target = null
                        var prop = null;

                        var value = parser.requireElement("expression", tokens);

                        if (tokens.matchToken("to")) {
                            target = parser.requireElement("targetExpression", tokens);
                        }
                        
                        if (target == null) {
                            prop = "result";
                        } else if (target.type === "symbol") {
                            prop = target.name;
                        } else if (target.type === "propertyAccess") {
                            prop = target.prop.value;
                        } else {
                            throw("Unable to append to " + target.type)
                        }

                        return {
                            value: value,
                            target: target,
                            args: [value],
                            op: function (context, value) {

                                if (Array.isArray(context[prop])) {
                                    context[prop].push(value);
                                } else if (context[prop] instanceof Element) {

                                    if (typeof value == "string") {
                                        context[prop].innerHTML += value;
                                    } else {
                                        throw("Don't know how to append non-strings to an HTML Element yet.");
                                    }
                                } else {
                                    context[prop] += value;
                                }

                                return runtime.findNext(this, context);
                            },
                            execute: function (context) {
                                return runtime.unifiedExec(this, context, value, target);
                            }
                        };
                    }
                })

                _parser.addCommand("increment", function(parser, runtime, tokens) {

                    if (tokens.matchToken("increment")) {
                        var amount;

                        // This is optional.  Defaults to "result"
                        var target = parser.parseElement("targetExpression", tokens);

                        // This is optional. Defaults to 1.
                        if (tokens.matchToken("by")) {
                            amount = parser.requireElement("expression", tokens);
                        }

                        return {
                            target: target,
                            args: [target, amount],
                            op: function (context, targetValue, amount) {
                                targetValue = targetValue ? parseFloat(targetValue) : 0;
                                amount = amount ? parseFloat(amount) : 1;
                                var newValue = targetValue + amount;
                                var setter = makeSetter(parser, runtime, tokens, target, newValue);
                                context.result = newValue;
                                setter.parent = this;
                                return setter;
                            },
                            execute: function (context) {
                                return runtime.unifiedExec(this, context, target, amount);
                            }
                        };
                    }
                })

                _parser.addCommand("decrement", function(parser, runtime, tokens) {

                    if (tokens.matchToken("decrement")) {
                        var amount;

                        // This is optional.  Defaults to "result"
                        var target = parser.parseElement("targetExpression", tokens);

                        // This is optional. Defaults to 1.
                        if (tokens.matchToken("by")) {
                            amount = parser.requireElement("expression", tokens);
                        }

                        return {
                            target: target,
                            args: [target, amount],
                            op: function (context, targetValue, amount) {
                                targetValue = targetValue ? parseFloat(targetValue) : 0;
                                amount = amount ? parseFloat(amount) : 1;
                                var newValue = targetValue - amount;
                                var setter = makeSetter(parser, runtime, tokens, target, newValue);
                                context.result = newValue;
                                setter.parent = this;
                                return setter;
                            },
                            execute: function (context) {
                                return runtime.unifiedExec(this, context, target, amount);
                            }
                        };
                    }
                })

                _parser.addCommand("fetch", function(parser, runtime, tokens) {
                    if (tokens.matchToken('fetch')) {

                        var url = parser.requireElement("stringLike", tokens);
                        var args = parser.parseElement("objectLiteral", tokens);

                        var type = "text";
                        if (tokens.matchToken("as")) {
                            if (tokens.matchToken("json")) {
                                type = "json";
                            } else if (tokens.matchToken("response")) {
                                type = "response";
                            } else if (tokens.matchToken("text")) {
                            } else {
                                parser.raiseParseError(tokens, "Unknown response type: " + tokens.currentToken());
                            }
                        }

                        /** @type {GrammarElement} */
                        var fetchCmd = {
                            url:url,
                            argExrepssions:args,
                            args: [url, args],
                            op: function (context, url, args) {
                                return new Promise(function (resolve, reject) {
                                    fetch(url, args)
                                        .then(function (value) {
                                            if (type === "response") {
                                                context.result = value;
                                                resolve(runtime.findNext(fetchCmd, context));
                                            } else if (type === "json") {
                                                value.json().then(function (result) {
                                                    context.result = result;
                                                    resolve(runtime.findNext(fetchCmd, context));
                                                })
                                            } else {
                                                value.text().then(function (result) {
                                                    context.result = result;
                                                    resolve(runtime.findNext(fetchCmd, context));
                                                })
                                            }
                                        })
                                        .catch(function (reason) {
                                            runtime.triggerEvent(context.me, "fetch:error", {
                                                reason: reason
                                            })
                                            reject(reason);
                                        })
                                })
                            }
                        };
                        return fetchCmd;
                    }
                })
            }

            //====================================================================
            // Initialization
            //====================================================================
            function ready(fn) {
                if (document.readyState !== 'loading') {
                    fn();
                } else {
                    document.addEventListener('DOMContentLoaded', fn);
                }
            }

            function getMetaConfig() {
                var element = document.querySelector('meta[name="htmx-config"]');
                if (element) {
                    return parseJSON(element.content);
                } else {
                    return null;
                }
            }

            function mergeMetaConfig() {
                var metaConfig = getMetaConfig();
                if (metaConfig) {
                    _hyperscript.config = mergeObjects(_hyperscript.config , metaConfig)
                }
            }

            if ('document' in globalScope) {
                ready(function () {
                    mergeMetaConfig();
                    _runtime.processNode(document.documentElement);
                    document.addEventListener("htmx:load", function(evt){
                        _runtime.processNode(evt.detail.elt);
                    })
                })
            }

            //====================================================================
            // API
            //====================================================================
            return mergeObjects(function (str, ctx) {
                    return _runtime.evaluate(str, ctx); //OK
                }, {
                    internals: {
                        lexer: _lexer,
                        parser: _parser,
                        runtime: _runtime,
                    },
                    addFeature: function (keyword, definition) {
                        _parser.addFeature(keyword, definition);
                    },
                    addCommand: function (keyword, definition) {
                        _parser.addCommand(keyword, definition);
                    },
                    addLeafExpression: function (name, definition) {
                        _parser.addLeafExpression(name, definition);
                    },
                    addIndirectExpression: function (name, definition) {
                        _parser.addIndirectExpression(name, definition);
                    },
                    evaluate: function (str, ctx) { //OK
                        return _runtime.evaluate(str, ctx); //OK
                    },
                    parse: function (str) { //OK
                        return _runtime.parse(str); //OK
                    },
                    processNode: function (elt) {
                        _runtime.processNode(elt);
                    },
                    config: {
                        attributes: "_, script, data-script",
                        defaultTransition: "all 500ms ease-in",
                        disableSelector: "[disable-scripting], [data-disable-scripting]",
                        conversions: CONVERSIONS
                    }
                }
            )
    }
    )()
}));
