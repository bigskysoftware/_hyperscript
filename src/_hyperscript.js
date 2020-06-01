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
                    if (expressionDef) return expressionDef(_parser, _runtime, tokens, root);
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
                    if (commandDef) return commandDef(_parser, _runtime, tokens);
                    raiseParseError(tokens);
                }

                function parseCommandList(tokens) {
                    if (tokens.hasMore() && isCommandStart(tokens.currentToken())) {
                        var start = parseCommand(tokens);
                        var last = start;
                        while (tokens.matchToken("then")) {
                            last.next = parseCommand(tokens);
                            last = last.next;
                        }
                        return start;
                    } else {
                        return {
                            type:"emptyCommandList",
                            exec:function(){}
                        }
                    }
                }

                function parseEventListener(tokens) {
                    tokens.requireToken("on");
                    var symbol = parseExpression("symbol", tokens);
                    if (symbol == null) {
                        raiseParseError(tokens, "Expected event name")
                    }
                    if (tokens.matchToken("from")) {
                        var from = parseExpression("target", tokens);
                        if (from == null) {
                            raiseParseError(tokens, "Expected target value")
                        }
                    }
                    var eventListener = {
                        type: "eventListener",
                        on: symbol,
                        from: from
                    };
                    eventListener.start = parseCommandList(tokens);
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

                return {
                    // parser API
                    parseExpression: parseExpression,
                    parseAnyExpressionOf: parseAnyExpressionOf,
                    parseCommandList: parseCommandList,
                    parseHyperScript: parseHyperScript,
                    raiseParseError: raiseParseError,
                    addCommand: addCommand,
                    addExpression: addExpression,
                    isCommandStart: isCommandStart,
                }
            }();

            //-----------------------------------------------
            // Runtime
            //-----------------------------------------------
            var _runtime = function () {

                var GLOBALS = {};
                var SCRIPT_ATTRIBUTES = ["_", "script", "data-script"];

                function matchesSelector(elt, selector) {
                    // noinspection JSUnresolvedVariable
                    var matchesFunction = elt.matches ||
                        elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                        || elt.webkitMatchesSelector || elt.oMatchesSelector;
                    return matchesFunction && matchesFunction.call(elt, selector);
                }

                function triggerEvent(elt, eventName, detail) {
                    var detail = detail || {};
                    detail["sentBy"] = elt;
                    var event = makeEvent(eventName, detail);
                    var eventResult = elt.dispatchEvent(event);
                    return eventResult;
                }

                function getMe(context) {
                    return context["me"];
                }

                function forEach(that, arr, func) {
                    for (var i = 0; i < arr.length; i++) {
                        func.call(that, arr[i]);
                    }
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

                function makeContext(commandList, elt, event) {
                    var ctx = {
                        meta: {
                            parser: _parser,
                            lexer: _lexer,
                            runtime: _runtime,
                            command_list: commandList
                        },
                        me: elt,
                        event: event,
                        detail: event.detail,
                        body: document.body,
                        globals: GLOBALS
                    }
                    ctx.meta.ctx = ctx;
                    return ctx;
                }

                function enter(commandList, event, elt) {
                    var ctx = makeContext(commandList, elt, event);
                    // lets get this party started
                    commandList.exec(ctx);
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

                function makeEventListener(eventListener, elt) {
                    return function (event) {
                        enter(eventListener.start, event, elt)
                    };
                }

                function apply(hypeScript, elt) {
                    _runtime.forEach(hypeScript, hypeScript.eventListeners, function (eventListener) {
                        var event = eventListener.on.name;
                        if (eventListener.from) {
                            _runtime.forEach(eventListener, eventListener.from.evaluate({}), function (from) {
                                from.addEventListener(event, makeEventListener(eventListener, elt));
                            });
                        } else {
                            elt.addEventListener(event, makeEventListener(eventListener, elt));
                        }
                    });
                }

                function next(current, context) {
                    if (current.next) {
                        current.next.exec(context);
                    }
                }

                function setGlobal(name, value) {
                    GLOBALS[name] = value;
                }

                function getGlobal(name) {
                    return GLOBALS[name];
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
                    var customEvent = makeEvent("eval", {string: str});
                    var tokens = _lexer.tokenize(str);
                    if (_parser.isCommandStart(tokens.currentToken())) {
                        var start = _parser.parseCommandList(tokens);
                        var ctx = makeContext(start, document.body, customEvent);
                        start.exec(ctx);
                        return ctx["it"];
                    } else {
                        var expression = _parser.parseExpression("expression", tokens);
                        var ctx = makeContext(expression, document.body, customEvent);
                        return expression.evaluate(ctx);
                    }
                }

                function initElement(elt) {
                    var src = getScript(elt);
                    if (src) {
                        var tokens = _lexer.tokenize(src);
                        var hyperScript = _parser.parseHyperScript(tokens);
                        apply(hyperScript, elt);
                    }
                }

                function resolveSymbol(str, context) {
                    if (str === "me" || str === "my") {
                        return _runtime.getMe(context);
                    } else {
                        var fromContext = context[str];
                        if (fromContext) {
                            return fromContext;
                        } else {
                            return window[str];
                        }
                    }
                }

                function evaluatePropPath(root, path) {
                    var finalValue = root;
                    var pathClone = path.slice();
                    while (pathClone.length > 0) {
                        finalValue = finalValue[pathClone.shift()];
                    }
                    return finalValue;
                }

                return {
                    forEach: forEach,
                    triggerEvent: triggerEvent,
                    next: next,
                    matchesSelector: matchesSelector,
                    getScript: getScript,
                    getMe: getMe,
                    apply: apply,
                    setGlobal: setGlobal,
                    getGlobal: getGlobal,
                    setScriptAttrs: setScriptAttrs,
                    initElement: initElement,
                    evaluate: evaluate,
                    getScriptSelector: getScriptSelector,
                    resolveSymbol: resolveSymbol,
                    evaluatePropPath: evaluatePropPath
                }
            }();

            //-----------------------------------------------
            // Expressions
            //-----------------------------------------------

            _parser.addExpression("string", function (parser, runtime, tokens) {
                var stringToken = tokens.matchTokenType('STRING');
                if (stringToken) {
                    return {
                        type: "string",
                        value: stringToken.value,
                        evaluate: function (context) {
                            return this.value;
                        }
                    }
                }
            })

            _parser.addExpression("number", function (parser, runtime, tokens) {
                var number = tokens.matchTokenType('NUMBER');
                if (number) {
                    var value = parseFloat(number.value)
                    return {
                        type: "number",
                        value: value,
                        evaluate: function (context) {
                            return this.value;
                        }
                    }
                }
            })

            _parser.addExpression("idRef", function (parser, runtime, tokens) {
                var elementId = tokens.matchTokenType('ID_REF');
                if (elementId) {
                    return {
                        type: "idRef",
                        value: elementId.value.substr(1),
                        evaluate: function (context) {
                            return document.getElementById(this.value);
                        }
                    };
                }
            })

            _parser.addExpression("classRef", function (parser, runtime, tokens) {
                var classRef = tokens.matchTokenType('CLASS_REF');
                if (classRef) {
                    return {
                        type: "classRef",
                        value: classRef.value,
                        className: function() {
                            return this.value.substr(1);
                        },
                        evaluate: function (context) {
                            return document.querySelectorAll(this.value);
                        }
                    };
                }
            })

            _parser.addExpression("attributeRef", function (parser, runtime, tokens) {
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
                        evaluate: function (context) {
                            return {name: this.name, value: this.value ? this.value.evaluate(context) : null};
                        }
                    }
                }
            })

            _parser.addExpression("symbol", function (parser, runtime, tokens) {
                var identifier = tokens.matchTokenType('IDENTIFIER');
                if (identifier) {
                    return {
                        type: "symbol",
                        name: identifier.value,
                        evaluate: function (context) {
                            return _runtime.resolveSymbol(this.name, context);
                        }
                    };
                }
            });

            _parser.addExpression("implicitMeTarget", function (parser, runtime, tokens) {
                return {
                    type: "implicitMeTarget",
                    evaluate: function (context) {
                        return [_runtime.getMe(context)];
                    }
                };
            });

            _parser.addExpression("implicitAllTarget", function (parser, runtime, tokens) {
                return {
                    type: "implicitMeTarget",
                    evaluate: function (context) {
                        return document.querySelectorAll("*");
                    }
                };
            });

            _parser.addExpression("millisecondLiteral", function (parser, runtime, tokens) {
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
                    factor:factor,
                    evaluate: function (context) {
                            return parseFloat(this.number.value) * this.factor;
                    }
                };
            });

            _parser.addExpression("boolean", function(parser, runtime, tokens){
                if (tokens.matchToken("true")) {
                    return {
                        type: "trueLiteral",
                        evaluate:function(){
                            return true;
                        }
                    }
                } else if (tokens.matchToken("false")) {
                    return {
                        type: "falseLiteral",
                        evaluate:function(){
                            return false;
                        }
                    }
                }
            });

            _parser.addExpression("leaf", function (parser, runtime, tokens) {
                return parser.parseAnyExpressionOf(["boolean", "string", "number", "idRef", "classRef", "symbol", "propertyRef"], tokens)
            });

            _parser.addExpression("propertyAccess", function (parser, runtime, tokens, root) {
                if (tokens.matchOpToken(".")) {
                    var prop = tokens.requireTokenType("IDENTIFIER");
                    var propertyAccess = {
                        type: "propertyAccess",
                        root: root,
                        prop: prop,
                        evaluate: function (context) {
                            var rootValue = this.root.evaluate(context);
                            return rootValue[this.prop.value];
                        }
                    };
                    return _parser.parseExpression("indirectExpression", tokens, propertyAccess);
                }
            });

            _parser.addExpression("functionCall", function (parser, runtime, tokens, root) {
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
                        evaluate: function (context) {
                            var argValues = args.map(function (arg) {
                                return arg.evaluate(context);
                            })
                            if (this.root.root) {
                                var that = this.root.root.evaluate(context);
                                return that[this.root.prop.value].apply(that, argValues);
                            } else {
                                return this.root.evaluate(context).apply(null, argValues)
                            }
                        }
                    };
                    return _parser.parseExpression("indirectExpression", tokens, functionCall);
                }
            });

            _parser.addExpression("indirectExpression", function (parser, runtime, tokens, root) {
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

            _parser.addExpression("expression", function (parser, runtime, tokens) {
                var leaf = _parser.parseExpression("leaf", tokens);
                if (leaf) {
                    return _parser.parseExpression("indirectExpression", tokens, leaf);
                }
                _parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
            });

            _parser.addExpression("target", function (parser, runtime, tokens) {
                var value = parser.parseAnyExpressionOf(["symbol", "classRef", "idRef"], tokens);
                if (value == null) {
                    parser.raiseParseError(tokens, "Expected a valid target expression");
                }
                return {
                    type: "target",
                    value: value,
                    evaluate: function (context) {
                        if (value.type === "classRef") {
                            return value.evaluate(context);
                        } else if (value.type === "idRef") {
                            return [value.evaluate(context)];
                        } else {
                            var symbolValue = value.evaluate(context);
                            if (symbolValue) {
                                return [symbolValue]; //TODO, check if array?
                            }
                        }
                    }
                };
            });

            //-----------------------------------------------
            // Commands
            //-----------------------------------------------

            _parser.addCommand("add", function (parser, runtime, tokens) {

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
                    exec: function (context) {
                        runtime.forEach(this, this.to.evaluate(context), function (target) {
                            if (this.classRef) {
                                target.classList.add(this.classRef.className());
                            } else {
                                var attributeValue = this.attributeRef.evaluate(context)
                                target.setAttribute(attributeValue.name, attributeValue.value)
                            }
                        });
                        runtime.next(this, context);
                    }
                };
            });

            _parser.addCommand("remove", function (parser, runtime, tokens) {
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
                    exec: function (context) {
                        if (this.elementExpr) {
                            var elementToRemove = this.elementExpr.evaluate(context);
                            elementToRemove.parentElement.removeChild(elementToRemove);
                        } else {
                            runtime.forEach(this, this.from.evaluate(context), function (target) {
                                if (this.classRef) {
                                    target.classList.remove(this.classRef.className());
                                } else {
                                    var attributeValue = this.attributeRef.evaluate(context);
                                    target.removeAttribute(attributeValue.name)
                                }
                            });
                        }
                        runtime.next(this, context);
                    }
                }
            });

            _parser.addCommand("toggle", function (parser, runtime, tokens) {
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
                    exec: function (context) {
                        runtime.forEach(this, this.on.evaluate(context), function (target) {
                            if (this.classRef) {
                                target.classList.toggle(this.classRef.className());
                            } else {
                                var attributeResult = this.attributeRef.evaluate(context);
                                if (target.getAttribute(attributeResult.name)) {
                                    target.removeAttribute(attributeResult.value);
                                } else {
                                    target.setAttribute(attributeResult.name, attributeResult.value);
                                }
                            }
                        });
                        runtime.next(this, context);
                    }
                }
            })

            _parser.addCommand("wait", function (parser, runtime, tokens) {
                return {
                    type: "wait",
                    time: parser.parseExpression('millisecondLiteral', tokens),
                    exec: function (context) {
                        var copyOfThis = this;
                        setTimeout(function () {
                            runtime.next(copyOfThis, context);
                        }, this.time.evaluate(context));
                    }
                }
            })

            _parser.addCommand("send", function (parser, runtime, tokens) {

                var eventName = tokens.requireTokenType(tokens, "IDENTIFIER");
                var details = [];
                if (tokens.matchOpToken("{")) {
                    do {
                        var name = tokens.requireTokenType(tokens, "IDENTIFIER");
                        tokens.requireOpToken(":");
                        var value = parser.parseExpression("expression", tokens);
                        details.push([name, value]);
                    } while (tokens.matchOpToken(","))
                    tokens.requireOpToken("}");
                }
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
                    exec: function (context) {
                        runtime.forEach(this, this.to.evaluate(context), function (target) {
                            var detailsValue = {}
                            runtime.forEach(this, this.details, function (detail) {
                                detailsValue[detail[0].value] = detail[1].evaluate(context);
                            });
                            runtime.triggerEvent(target, this.eventName.value, detailsValue);
                        })
                        runtime.next(this, context);
                    }
                }
            })

            _parser.addCommand("take", function (parser, runtime, tokens) {
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
                    exec: function (context) {
                        var clazz = this.classRef.value.substr(1);
                        runtime.forEach(this, this.from.evaluate(context), function (target) {
                            target.classList.remove(clazz)
                        });
                        runtime.getMe(context).classList.add(clazz);
                        runtime.next(this, context);
                    }
                }
            })

            _parser.addCommand("log", function (parser, runtime, tokens) {
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
                    exec: function (context) {
                        var values = this.exprs.map(function (e) {
                            return e.evaluate(context)
                        });
                        var logger = console.log;
                        if (this.withExpr) {
                            logger = this.withExpr.evaluate(context);
                        }
                        logger.apply(console, values);
                        runtime.next(this, context);
                    }
                };
            })

            _parser.addCommand("call", function (parser, runtime, tokens) {
                return {
                    type: "call",
                    expr: parser.parseExpression("expression", tokens),
                    exec: function (context) {
                        var value = this.expr.evaluate(context);
                        context["it"] = value;
                        runtime.next(this, context);
                    }
                }
            })

            _parser.addCommand("put", function (parser, runtime, tokens) {

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
                    exec: function (context) {
                        var val = this.value.evaluate(context);
                        if (this.symbolWrite) {
                            context[this.target.value.name] = val; // TODO locked symbol check
                        } else {
                            var that = this;
                            runtime.forEach(this, this.target.evaluate(context), function (target) {
                                if (that.op === "into") {
                                    var propPathClone = that.propPath.slice();
                                    var finalProp = propPathClone.pop();
                                    var finalTarget = _runtime.evaluatePropPath(target, propPathClone);
                                    finalTarget[finalProp] = val;
                                } else if (that.op === "before") {
                                    var finalTarget = _runtime.evaluatePropPath(target, that.propPath);
                                    finalTarget.insertAdjacentHTML('beforebegin', val);
                                } else if (that.op === "afterbegin") {
                                    var finalTarget = _runtime.evaluatePropPath(target, that.propPath);
                                    finalTarget.insertAdjacentHTML('afterbegin', val);
                                } else if (that.op === "beforeend") {
                                    var finalTarget = _runtime.evaluatePropPath(target, that.propPath);
                                    finalTarget.insertAdjacentHTML('beforeend', val);
                                } else if (that.op === "after") {
                                    var finalTarget = _runtime.evaluatePropPath(target, that.propPath);
                                    finalTarget.insertAdjacentHTML('afterend', val);
                                }
                            })
                        }
                        runtime.next(this, context);
                    }
                };
            })

            _parser.addCommand("if", function (parser, runtime, tokens) {
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
                    exec: function (context) {
                        var value = this.expr.evaluate(context);
                        if (value) {
                            trueBranch.exec(context);
                        } else {
                            if (falseBranch) {
                                falseBranch.exec(context);
                            }
                        }
                        runtime.next(this, context);
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