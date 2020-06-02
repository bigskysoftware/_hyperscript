//AMD insanity
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

            //-----------------------------------------------
            // Lexer
            //-----------------------------------------------
            var _lexer = function() {
                var OP_TABLE = {'+': 'PLUS', '-': 'MINUS', '*': 'MULTIPLY', '.': 'PERIOD', '\\': 'BACKSLASH', ':': 'COLON',
                    '%': 'PERCENT', '|': 'PIPE', '!': 'EXCLAMATION', '?': 'QUESTION', '#': 'POUND', '&': 'AMPERSAND',
                    ';': 'SEMI', ',': 'COMMA', '(': 'L_PAREN', ')': 'R_PAREN', '<': 'L_ANG', '>': 'R_ANG', '{': 'L_BRACE',
                    '}': 'R_BRACE', '[': 'L_BRACKET', ']': 'R_BRACKET', '=': 'EQUALS'
                };

                function isValidCSSClassChar(c) {
                    return isAlpha(c) || isNumeric(c) || c === "-" || c === "_";
                }

                function isValidCSSIDChar(c) {
                    return isAlpha(c) || isNumeric(c) || c === "-" || c === "_" || c === ":";
                }

                function isWhitespace(c) {
                    return c === " " || c === "\t" || isNewline(c);
                }

                function positionString(token) {
                    return "[Line: " + token.line + ", Column: " + token.col + "]"
                }

                function isNewline(c) {
                    return c === '\r' || c === '\n';
                }

                function isNumeric(c) {
                    return c >= '0' && c <= '9';
                }

                function isAlpha(c) {
                    return (c >= 'a' && c <= 'z') ||
                        (c >= 'A' && c <= 'Z');
                }


                function makeTokensObject(tokens, consumed, source) {

                    function raiseError(tokens, error) {
                        _parser.raiseParseError(tokens, error);
                    }

                    function requireOpToken(value) {
                        var token = matchOpToken(value);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected '" + value + "' but found '" + currentToken().value + "'");
                        }
                    }

                    function matchOpToken(value) {
                        if (currentToken() && currentToken().op && currentToken().value === value) {
                            return consumeToken();
                        }
                    }

                    function requireTokenType(type1, type2, type3, type4) {
                        var token = matchTokenType(type1, type2, type3, type4);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected one of " + JSON.stringify([type1, type2, type3]));
                        }
                    }

                    function matchTokenType(type1, type2, type3, type4) {
                        if (currentToken() && currentToken().type && [type1, type2, type3, type4].indexOf(currentToken().type) >= 0) {
                            return consumeToken();
                        }
                    }

                    function requireToken(value, type) {
                        var token = matchToken(value, type);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected '" + value + "' but found '" + currentToken().value + "'");
                        }
                    }

                    function matchToken(value, type) {
                        var type = type || "IDENTIFIER";
                        if (currentToken() && currentToken().value === value && currentToken().type === type) {
                            return consumeToken();
                        }
                    }

                    function consumeToken() {
                        var match = tokens.shift();
                        consumed.push(match);
                        return match;
                    }

                    function hasMore() {
                        return tokens.length > 0;
                    }

                    function currentToken() {
                        return tokens[0];
                    }

                    return {
                        matchOpToken: matchOpToken,
                        requireOpToken: requireOpToken,
                        matchTokenType: matchTokenType,
                        requireTokenType: requireTokenType,
                        consumeToken: consumeToken,
                        matchToken: matchToken,
                        requireToken: requireToken,
                        list: tokens,
                        source: source,
                        hasMore: hasMore,
                        currentToken: currentToken
                    }
                }

                function tokenize(string) {
                    var source = string;
                    var tokens = [];
                    var position = 0;
                    var column = 0;
                    var line = 1;
                    var lastToken = "<START>";

                    while (position < source.length) {
                        consumeWhitespace();
                        if (currentChar() === "-" && nextChar() === "-") {
                            consumeComment();
                        } else {
                            if (!possiblePrecedingSymbol() && currentChar() === "." && isAlpha(nextChar())) {
                                tokens.push(consumeClassReference());
                            } else if (!possiblePrecedingSymbol() && currentChar() === "#" && isAlpha(nextChar())) {
                                tokens.push(consumeIdReference());
                            } else if (isAlpha(currentChar())) {
                                tokens.push(consumeIdentifier());
                            } else if (isNumeric(currentChar())) {
                                tokens.push(consumeNumber());
                            } else if (currentChar() === '"' || currentChar() === "'") {
                                tokens.push(consumeString());
                            } else if (OP_TABLE[currentChar()]) {
                                tokens.push(makeOpToken(OP_TABLE[currentChar()], consumeChar()));
                            }
                        }
                    }

                    return makeTokensObject(tokens, [], source);

                    function makeOpToken(type, value) {
                        var token = makeToken(type, value);
                        token.op = true;
                        return token;
                    }

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

                    function consumeIdentifier() {
                        var identifier = makeToken("IDENTIFIER");
                        var value = consumeChar();
                        while (isAlpha(currentChar())) {
                            value += consumeChar();
                        }
                        identifier.value = value;
                        identifier.end = position;
                        return identifier;
                    }

                    function consumeNumber() {
                        var number = makeToken("NUMBER");
                        var value = consumeChar();
                        while (isNumeric(currentChar())) {
                            value += consumeChar();
                        }
                        if (currentChar() === ".") {
                            value += consumeChar();
                        }
                        while (isNumeric(currentChar())) {
                            value += consumeChar();
                        }
                        number.value = value;
                        number.end = position;
                        return number;
                    }

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
                        return string;
                    }

                    function currentChar() {
                        return source.charAt(position);
                    }

                    function nextChar() {
                        return source.charAt(position + 1);
                    }

                    function consumeChar() {
                        lastToken = currentChar();
                        position++;
                        column++;
                        return lastToken;
                    }

                    function possiblePrecedingSymbol() {
                        return isAlpha(lastToken) || isNumeric(lastToken) || lastToken === ")" || lastToken === "}" || lastToken === "]"
                    }

                    function consumeWhitespace() {
                        while (currentChar() && isWhitespace(currentChar())) {
                            if (isNewline(currentChar())) {
                                column = 0;
                                line++;
                            }
                            consumeChar();
                        }
                    }
                }

                return {
                    tokenize: tokenize
                }
            }();

            //-----------------------------------------------
            // Parser
            //-----------------------------------------------
            var _parser = function () {

                var COMMANDS = {}
                var EXPRESSIONS = {}

                function addCommand(name, definition) {
                    COMMANDS[name] = definition;
                }

                function addExpression(name, definition) {
                    EXPRESSIONS[name] = definition;
                }

                function createParserContext(tokens) {
                    var currentToken = tokens.currentToken();
                    var source = tokens.source;
                    var lines = source.split("\n");
                    var line = currentToken ? currentToken.line - 1 : lines.length - 1;
                    var contextLine = lines[line];
                    var offset = currentToken ? currentToken.column : contextLine.length - 1;
                    return contextLine + "\n" + " ".repeat(offset) + "^^\n\n";
                }

                function raiseParseError(tokens, message) {
                    message = (message || "Unexpected Token : " + tokens.currentToken().value) + "\n\n" +
                        createParserContext(tokens);
                    var error = new Error(message);
                    error.tokens = tokens;
                    throw error
                }

                function parseExpression(type, tokens, root) {
                    var expressionDef = EXPRESSIONS[type];
                    if (expressionDef) return expressionDef(_parser, tokens, root);
                }

                function parseAnyExpressionOf(types, tokens) {
                    for (var i = 0; i < types.length; i++) {
                        var type = types[i];
                        var expression = parseExpression(type, tokens);
                        if (expression) {
                            return expression;
                        }
                    }
                }

                function parseCommand(tokens) {
                    var commandName = tokens.matchTokenType("IDENTIFIER");
                    var commandDef = COMMANDS[commandName.value];
                    if (commandDef) return commandDef(_parser, tokens);
                    raiseParseError(tokens);
                }

                function parseCommandList(tokens) {
                    if (tokens.hasMore() && isCommandStart(tokens.currentToken())) {
                        var start = parseCommand(tokens);
                        var current = start;
                        while (tokens.matchToken("then")) {
                            var next = parseCommand(tokens);
                            current.next = next;
                            current = next;
                        }
                        return start;
                    } else {
                        return {
                            type:"emptyCommandList",
                            transpile:function(){
                                return "";
                            }
                        }
                    }
                }

                function parseEventListener(tokens) {
                    tokens.requireToken("on");
                    var on = parseExpression("symbol", tokens);
                    if (on == null) {
                        raiseParseError(tokens, "Expected event name")
                    }
                    if (tokens.matchToken("from")) {
                        var from = parseExpression("target", tokens);
                        if (from == null) {
                            raiseParseError(tokens, "Expected target value")
                        }
                    } else {
                        var from = parseExpression("implicitMeTarget", tokens);
                    }
                    var start = parseCommandList(tokens);
                    var eventListener = {
                        type: "eventListener",
                        on: on,
                        from: from,
                        start: start,
                        transpile : function() {
                            return "(function(me){" +
                                "var my = me;\n" +
                                "_hyperscript.runtime.forEach(null, " + from.transpile() + ", function(target){\n" +
                                "  target.addEventListener('" + on.name + "', function(event){\n" +
                                start.transpile() +
                                "  })\n" +
                                "})\n" +
                                "})"
                        }
                    };
                    return eventListener;
                }

                function parseHyperScript(tokens) {
                    var hypeScript = {
                        type: "_hyperscript",
                        eventListeners: []
                    }
                    do {
                        hypeScript.eventListeners.push(parseEventListener(tokens));
                    } while (tokens.matchToken("end") && tokens.hasMore())
                    if (tokens.hasMore()) {
                        raiseParseError(tokens);
                    }
                    return hypeScript;
                }

                function isCommandStart(token) {
                    return token.type === "IDENTIFIER" && COMMANDS[token.value];
                }

                function transpileNext(cmd) {
                    if(cmd.next) {
                        return "\n" + cmd.next.transpile();
                    } else {
                        return "";
                    }
                }

                return {
                    // parser API
                    parseExpression: parseExpression,
                    parseAnyExpressionOf: parseAnyExpressionOf,
                    parseCommand: parseCommand,
                    parseCommandList: parseCommandList,
                    parseHyperScript: parseHyperScript,
                    raiseParseError: raiseParseError,
                    addCommand: addCommand,
                    addExpression: addExpression,
                    isCommandStart: isCommandStart,
                    transpileNext: transpileNext,
                }
            }();

            //-----------------------------------------------
            // Runtime
            //-----------------------------------------------
            var _runtime = function () {
                var SCRIPT_ATTRIBUTES = ["_", "script", "data-script"];

                function matchesSelector(elt, selector) {
                    // noinspection JSUnresolvedVariable
                    var matchesFunction = elt.matches ||
                        elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                        || elt.webkitMatchesSelector || elt.oMatchesSelector;
                    return matchesFunction && matchesFunction.call(elt, selector);
                }

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

                function triggerEvent(elt, eventName, detail) {
                    var detail = detail || {};
                    detail["sentBy"] = elt;
                    var event = makeEvent(eventName, detail);
                    var eventResult = elt.dispatchEvent(event);
                    return eventResult;
                }

                function forEach(that, arr, func) {
                    if (arr.length) {
                        for (var i = 0; i < arr.length; i++) {
                            func.call(that, arr[i]);
                        }
                    } else {
                        func(arr);
                    }
                }

                function getScript(elt) {
                    for (var i = 0; i < SCRIPT_ATTRIBUTES.length; i++) {
                        var scriptAttribute = SCRIPT_ATTRIBUTES[i];
                        if (elt.hasAttribute(scriptAttribute)) {
                            return elt.getAttribute(scriptAttribute)
                        }
                    }
                    return null;
                }

                function apply(hypeScript, elt) {
                    _runtime.forEach(hypeScript, hypeScript.eventListeners, function (eventListener) {
                        var source = eventListener.transpile();
                        var listener = eval(source);
                        listener.call(null, elt);
                    });
                }

                function setScriptAttrs(values) {
                    SCRIPT_ATTRIBUTES = values;
                }

                function getScriptSelector() {
                    return SCRIPT_ATTRIBUTES.map(function (attribute) {
                        return "[" + attribute + "]";
                    }).join(", ");
                }

                function evaluate(str) {
                    throw "TODO - implement"
                }

                function initElement(elt) {
                    var src = getScript(elt);
                    if (src) {
                        var tokens = _lexer.tokenize(src);
                        var hyperScript = _parser.parseHyperScript(tokens);
                        apply(hyperScript, elt);
                    }
                }

                return {
                    forEach: forEach,
                    triggerEvent: triggerEvent,
                    matchesSelector: matchesSelector,
                    getScript: getScript,
                    apply: apply,
                    setScriptAttrs: setScriptAttrs,
                    initElement: initElement,
                    evaluate: evaluate,
                    getScriptSelector: getScriptSelector,
                }
            }();

            //-----------------------------------------------
            // Expressions
            //-----------------------------------------------

            _parser.addExpression("string", function (parser, tokens) {
                var stringToken = tokens.matchTokenType('STRING');
                if (stringToken) {
                    return {
                        type: "string",
                        token: stringToken,
                        transpile: function() {
                            if (stringToken.value.indexOf("'") === 0) {
                                return "'" + stringToken.value + "'";
                            } else {
                                return '"' + stringToken.value + '"';
                            }
                        }
                    }
                }
            })

            _parser.addExpression("number", function (parser, tokens) {
                var number = tokens.matchTokenType('NUMBER');
                if (number) {
                    var numberToken = number;
                    var value = parseFloat(number.value)
                    return {
                        type: "number",
                        value: value,
                        numberToken: numberToken,
                        transpile: function() {
                            return numberToken.value;
                        }
                    }
                }
            })

            _parser.addExpression("idRef", function (parser, tokens) {
                var elementId = tokens.matchTokenType('ID_REF');
                if (elementId) {
                    return {
                        type: "idRef",
                        value: elementId.value.substr(1),
                        transpile: function(){
                            return "document.getElementById('" + this.value + "')"
                        }
                    };
                }
            })

            _parser.addExpression("classRef", function (parser, tokens) {
                var classRef = tokens.matchTokenType('CLASS_REF');
                if (classRef) {
                    return {
                        type: "classRef",
                        value: classRef.value,
                        className: function() {
                            return this.value.substr(1);
                        },
                        transpile: function(){
                            return "document.querySelectorAll('" + this.value + "')"
                        }
                    };
                }
            })

            _parser.addExpression("attributeRef", function (parser, tokens) {
                if (tokens.matchOpToken("[")) {
                    var name = tokens.matchTokenType("IDENTIFIER");
                    var value = null;
                    if (tokens.matchOpToken("=")) {
                        value = parser.parseExpression("expression", tokens);
                    }
                    tokens.requireOpToken("]");
                    return {
                        type: "attribute_expression",
                        name: name.value,
                        value: value,
                        transpile: function() {
                            if (this.value) {
                                return "({name: '" + this.name + "', value: " + this.value.transpile() + "})";
                            } else {
                                return "({name: '" + this.name + "'})";
                            }
                        }
                    }
                }
            })

            _parser.addExpression("objectLiteral", function (parser, tokens) {
                if (tokens.matchOpToken("{")) {
                    var fields = []
                    if (!tokens.matchOpToken("}")) {
                        do {
                            var name = tokens.requireTokenType("IDENTIFIER");
                            tokens.requireOpToken(":");
                            var value = parser.parseExpression("expression", tokens);
                            fields.push({name: name, value: value});
                        } while (tokens.matchOpToken(","))
                        tokens.requireOpToken("}");
                    }
                    return {
                        type:"objectLiteral",
                        fields: fields,
                        transpile: function() {
                            return "({" + fields.map(function(field){return field.name.value + ":" + field.value.transpile()}).join(", ") + "})";
                        }
                    }
                }


            })

            _parser.addExpression("symbol", function (parser, tokens) {
                var identifier = tokens.matchTokenType('IDENTIFIER');
                if (identifier) {
                    return {
                        type: "symbol",
                        name: identifier.value,
                        transpile: function () {
                            return identifier.value;
                        }
                    };
                }
            });

            _parser.addExpression("implicitMeTarget", function (parser, tokens) {
                return {
                    type: "implicitMeTarget",
                    transpile : function() {
                        return "[me]"
                    }
                };
            });

            _parser.addExpression("implicitAllTarget", function (parser, tokens) {
                return {
                    type: "implicitAllTarget",
                    transpile: function() {
                        return 'document.querySelectorAll("*")';
                    }
                };
            });

            _parser.addExpression("millisecondLiteral", function (parser, tokens) {
                var number = tokens.requireTokenType(tokens, "NUMBER");
                var factor = 1;
                if (tokens.matchToken("s")) {
                    factor = 1000;
                } else if (tokens.matchToken("ms")) {
                    // do nothing
                }
                return {
                    type: "millisecondLiteral",
                    number: number,
                    factor: factor,
                    transpile: function(){
                        return parseFloat(this.number.value);
                    }
                };
            });

            _parser.addExpression("boolean", function(parser, tokens){
                if (tokens.matchToken("true")) {
                    return {
                        type: "boolean",
                        transpile : function() {
                            return "true";
                        }
                    }
                } else if (tokens.matchToken("false")) {
                    return {
                        type: "boolean",
                        transpile : function() {
                            return "false";
                        }
                    }
                }
            });

            _parser.addExpression("leaf", function (parser, tokens) {
                return parser.parseAnyExpressionOf(["boolean", "string", "number", "idRef", "classRef", "symbol", "propertyRef"], tokens)
            });

            _parser.addExpression("propertyAccess", function (parser, tokens, root) {
                if (tokens.matchOpToken(".")) {
                    var prop = tokens.requireTokenType("IDENTIFIER");
                    var propertyAccess = {
                        type: "propertyAccess",
                        root: root,
                        prop: prop,
                        transpile : function() {
                            return root.transpile() + "." + prop.value;
                        }
                    };
                    return _parser.parseExpression("indirectExpression", tokens, propertyAccess);
                }
            });

            _parser.addExpression("functionCall", function (parser, tokens, root) {
                if (tokens.matchOpToken("(")) {
                    var args = [];
                    do {
                        args.push(parser.parseExpression("expression", tokens));
                    } while (tokens.matchOpToken(","))
                    tokens.requireOpToken(")");
                    var functionCall = {
                        type: "functionCall",
                        root: root,
                        args: args,
                        transpile: function(){
                            return this.root.transpile() + "(" + args.map(function(arg) { return arg.transpile() }).join(",") + ")"
                        }
                    };
                    return _parser.parseExpression("indirectExpression", tokens, functionCall);
                }
            });

            _parser.addExpression("indirectExpression", function (parser, tokens, root) {
                var propAccess = parser.parseExpression("propertyAccess", tokens, root);
                if (propAccess) {
                    return propAccess;
                }

                var functionCall = parser.parseExpression("functionCall", tokens, root);
                if (functionCall) {
                    return functionCall;
                }

                return root;
            });

            _parser.addExpression("expression", function (parser, tokens) {
                var leaf = _parser.parseExpression("leaf", tokens);
                if (leaf) {
                    return _parser.parseExpression("indirectExpression", tokens, leaf);
                }
                _parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
            });

            _parser.addExpression("target", function (parser, tokens) {
                var value = parser.parseAnyExpressionOf(["symbol", "classRef", "idRef"], tokens);
                if (value == null) {
                    parser.raiseParseError(tokens, "Expected a valid target expression");
                }
                return {
                    type: "target",
                    value: value,
                    transpile: function (context) {
                        if (value.type === "classRef") {
                            return value.transpile();
                        } else if (value.type === "idRef") {
                            return "[" + value.transpile() + "]";
                        } else {
                            return "[" + value.transpile() + "]"; //TODO, check if array?
                        }
                    }
                };
            });

            //-----------------------------------------------
            // Commands
            //-----------------------------------------------

            _parser.addCommand("add", function (parser, tokens) {

                var classRef = parser.parseExpression("classRef", tokens);
                var attributeRef = null;
                if (classRef == null) {
                    attributeRef = parser.parseExpression("attributeRef", tokens);
                    if (attributeRef == null) {
                        parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                    }
                }

                if (tokens.matchToken("to")) {
                    var to = parser.parseExpression("target", tokens);
                } else {
                    var to = parser.parseExpression("implicitMeTarget");
                }

                return {
                    type: "add",
                    classRef: classRef,
                    attributeRef: attributeRef,
                    to: to,
                    transpile : function() {
                            if (this.classRef) {
                                return "_hyperscript.runtime.forEach(null, " + to.transpile()  + ", function (target) {" +
                                "  target.classList.add('" + classRef.className() + "')" +
                                "})" + parser.transpileNext(this);
                            } else {
                                return "_hyperscript.runtime.forEach(null, " + to.transpile()  + ", function (target) {" +
                                    "  target.setAttribute('" + attributeRef.name + "', " + attributeRef.transpile() +".value)" +
                                    "})" + parser.transpileNext(this);
                            }
                        }
                    }
            });

            _parser.addCommand("remove", function (parser, tokens) {
                var classRef = parser.parseExpression("classRef", tokens);
                var attributeRef = null;
                var elementExpr = null;
                if (classRef == null) {
                    attributeRef = parser.parseExpression("attributeRef", tokens);
                    if (attributeRef == null) {
                        elementExpr = parser.parseExpression("expression", tokens)
                        if (elementExpr == null) {
                            parser.raiseParseError(tokens, "Expected either a class reference, attribute expression or value expression");
                        }
                    }
                }
                if (tokens.matchToken("from")) {
                    var from = parser.parseExpression("target", tokens);
                } else {
                    var from = parser.parseExpression("implicitMeTarget");
                }

                return {
                    type: "remove",
                    classRef: classRef,
                    attributeRef: attributeRef,
                    elementExpr: elementExpr,
                    from: from,
                    transpile : function() {
                        if (this.elementExpr) {
                            return "_hyperscript.runtime.forEach(null, " + elementExpr.transpile()  + ", function (target) {" +
                                "  target.parentElement.removeChild(target)" +
                                "})" + parser.transpileNext(this);
                        } else {
                            if (this.classRef) {
                                return "_hyperscript.runtime.forEach(null, " + from.transpile()  + ", function (target) {" +
                                    "  target.classList.remove('" + classRef.className() + "')" +
                                    "})" + parser.transpileNext(this);
                            } else {
                                return "_hyperscript.runtime.forEach(null, " + from.transpile()  + ", function (target) {" +
                                    "  target.removeAttribute('" + attributeRef.name + "')" +
                                    "})" + parser.transpileNext(this);
                            }
                        }
                    }
                }
            });

            _parser.addCommand("toggle", function (parser, tokens) {
                var classRef = parser.parseExpression("classRef", tokens);
                var attributeRef = null;
                if (classRef == null) {
                    attributeRef = parser.parseExpression("attributeRef", tokens);
                    if (attributeRef == null) {
                        parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                    }
                }
                if (tokens.matchToken("on")) {
                    var on = parser.parseExpression("target", tokens);
                }  else {
                    var on = parser.parseExpression("implicitMeTarget");
                }
                return {
                    type: "toggle",
                    classRef: classRef,
                    attributeRef: attributeRef,
                    on: on,
                    transpile : function() {
                        if (this.classRef) {
                            return "_hyperscript.runtime.forEach(null, " + on.transpile()  + ", function (target) {" +
                                "  target.classList.toggle('" + classRef.className() + "')" +
                                "})" + parser.transpileNext(this);
                        } else {
                            return "_hyperscript.runtime.forEach(null, " + on.transpile()  + ", function (target) {" +
                                "  if(target.hasAttribute('" + attributeRef.name + "')) {\n" +
                                "    target.removeAttribute('" + attributeRef.name + "');\n" +
                                "  } else { \n" +
                                "    target.setAttribute('" + attributeRef.name + "', " + attributeRef.transpile() +".value)" +
                                "  }" +
                                "})" + parser.transpileNext(this);
                        }
                    }
                }
            })

            _parser.addCommand("wait", function (parser, tokens) {
                return {
                    type: "wait",
                    time: parser.parseExpression('millisecondLiteral', tokens),
                    transpile: function () {
                        return "setTimeout(function () { " + parser.transpileNext(this) + " }, " + this.time.transpile() + ")";
                    }
                }
            })

            _parser.addCommand("send", function (parser, tokens) {

                var eventName = tokens.requireTokenType(tokens, "IDENTIFIER");
                var details = parser.parseExpression("objectLiteral", tokens);
                if (tokens.matchToken("to")) {
                    var to = parser.parseExpression("target", tokens);
                }  else {
                    var to = parser.parseExpression("implicitMeTarget");
                }

                return {
                    type: "send",
                    eventName: eventName,
                    details: details,
                    to: to,
                    transpile:function() {
                        return "_hyperscript.runtime.forEach(null, " + to.transpile()  + ", function (target) {" +
                            "  _hyperscript.runtime.triggerEvent(target, '" + eventName.value + "'," + (details ? details.transpile() : "{}") + ")" +
                            "})" + parser.transpileNext(this);
                    }
                }
            })

            _parser.addCommand("take", function (parser, tokens) {
                var classRef = tokens.requireTokenType(tokens, "CLASS_REF");

                if (tokens.matchToken("from")) {
                    var from = parser.parseExpression("target", tokens);
                } else {
                    var from = parser.parseExpression("implicitAllTarget")
                }
                return {
                    type: "take",
                    classRef: classRef,
                    from: from,
                    transpile: function () {
                        var clazz = this.classRef.value.substr(1);
                        return "  _hyperscript.runtime.forEach(this, " + from.transpile() + ", function (target) { target.classList.remove('" + clazz + "') }); " +
                            "me.classList.add('"+ clazz + "');" + parser.transpileNext(this);
                    }
                }
            })

            _parser.addCommand("log", function (parser, tokens) {
                var exprs = [parser.parseExpression("expression", tokens)];
                while (tokens.matchOpToken(",")) {
                    exprs.push(parser.parseExpression("expression", tokens));
                }
                if (tokens.matchToken("with")) {
                    var withExpr = parser.parseExpression("expression", tokens);
                }
                return {
                    type: "log",
                    exprs: exprs,
                    withExpr: withExpr,
                    transpile: function () {
                        if (withExpr) {
                          return withExpr.transpile() + "(" + exprs.map(function(expr){return expr.transpile()}).join(", ") + ")" + parser.transpileNext(this);
                        } else {
                            return "console.log(" + exprs.map(function(expr){return expr.transpile()}).join(", ") + ")" + parser.transpileNext(this);
                        }
                    }
                };
            })

            _parser.addCommand("call", function (parser, tokens) {
                return {
                    type: "call",
                    expr: parser.parseExpression("expression", tokens),
                    transpile : function() {
                        return "var it = " + this.expr.transpile() + parser.transpileNext(this);                    }
                }
            })

            _parser.addCommand("put", function (parser, tokens) {

                var value = parser.parseExpression("expression", tokens);

                var operation = tokens.matchToken("into") ||
                    tokens.matchToken("before") ||
                    tokens.matchToken("afterbegin") ||
                    tokens.matchToken("beforeend") ||
                    tokens.matchToken("after");

                if (operation == null) {
                    parser.raiseParseError(tokens, "Expected one of 'into', 'before', 'afterbegin', 'beforeend', 'after'")
                }
                var target = parser.parseExpression("target", tokens);
                var propPath = []
                while (tokens.matchOpToken(".")) {
                    propPath.push(tokens.requireTokenType("IDENTIFIER").value)
                }

                var directWrite = propPath.length === 0 && operation.value === "into";
                var symbolWrite = directWrite && target.value.type === "symbol";
                if (directWrite && !symbolWrite) {
                    parser.raiseParseError(tokens, "Can only put directly into symbols, not references")
                }

                return {
                    type: "put",
                    target: target,
                    propPath: propPath,
                    op: operation.value,
                    symbolWrite: symbolWrite,
                    value: value,
                    transpile: function (context) {
                        if (this.symbolWrite) {
                            return "var " + target.value.name + " = " + value.transpile() + parser.transpileNext(this);
                        } else {
                            var dotPath = propPath.length === 0 ? "" : "." + propPath.join(".");
                            if (this.op === "into") {
                                return "_hyperscript.runtime.forEach(null, " + target.transpile()  + ", function (target) {" +
                                "  target" + dotPath + "=" + value.transpile() +
                                "})" + parser.transpileNext(this);
                            } else if (this.op === "before") {
                                return "_hyperscript.runtime.forEach(null, " + target.transpile()  + ", function (target) {" +
                                    "  target" + dotPath + ".insertAdjacentHTML('beforebegin', " + value.transpile() + ")" +
                                    "})" + parser.transpileNext(this);
                            } else if (this.op === "afterbegin") {
                                return "_hyperscript.runtime.forEach(null, " + target.transpile()  + ", function (target) {" +
                                    "  target" + dotPath + ".insertAdjacentHTML('afterbegin', " + value.transpile() + ")" +
                                    "})" + parser.transpileNext(this);
                            } else if (this.op === "beforeend") {
                                return "_hyperscript.runtime.forEach(null, " + target.transpile()  + ", function (target) {" +
                                    "  target" + dotPath + ".insertAdjacentHTML('beforeend', " + value.transpile() + ")" +
                                    "})" + parser.transpileNext(this);
                            } else if (this.op === "after") {
                                return "_hyperscript.runtime.forEach(null, " + target.transpile()  + ", function (target) {" +
                                    "  target" + dotPath + ".insertAdjacentHTML('afterend', " + value.transpile() + ")" +
                                    "})" + parser.transpileNext(this);
                            }
                        }
                    }
                };
            })

            _parser.addCommand("if", function (parser, tokens) {
                var expr = parser.parseExpression("expression", tokens);
                var trueBranch = parser.parseCommandList(tokens);
                if (tokens.matchToken("else")) {
                    var falseBranch = parser.parseCommandList(tokens);
                }
                if (tokens.hasMore()) {
                    tokens.requireToken("end");
                }
                return {
                    type: "if",
                    expr: expr,
                    trueBranch: trueBranch,
                    falseBranch: falseBranch,
                    transpile: function () {
                        return "if(" + expr.transpile() + "){" + "" + trueBranch.transpile() + "}" +
                            "   else {" + (falseBranch ? falseBranch.transpile() : "") + "}"

                    }
                }
            })

            //-----------------------------------------------
            // API
            //-----------------------------------------------

            function start(scriptAttrs) {
                if (scriptAttrs) {
                    _runtime.setScriptAttrs(scriptAttrs);
                }
                var fn = function () {
                    var elements = document.querySelectorAll(_runtime.getScriptSelector());
                    _runtime.forEach(document, elements, function (elt) {
                        init(elt);
                    })
                };
                if (document.readyState !== 'loading') {
                    fn();
                } else {
                    document.addEventListener('DOMContentLoaded', fn);
                }
                return true;
            }

            function init(elt) {
                _runtime.initElement(elt);
            }

            function evaluate(str) {
                return _runtime.evaluate(str);
            }

            return {
                lexer: _lexer,
                parser: _parser,
                runtime: _runtime,
                evaluate: evaluate,
                init: init,
                start: start
            }
        }
    )()
}));