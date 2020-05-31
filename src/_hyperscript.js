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
                            raiseError(this, "Expected '" + value +"' but found '" + currentToken().value + "'");
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
                        if(token) {
                            return token;
                        } else {
                            raiseError(this, "Expected '" + value +"' but found '" + currentToken().value + "'");
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
                        requireOpToken:requireOpToken,
                        matchTokenType: matchTokenType,
                        requireTokenType: requireTokenType,
                        consumeToken: consumeToken,
                        matchToken: matchToken,
                        requireToken: requireToken,
                        list: tokens,
                        source: source,
                        hasMore:hasMore,
                        currentToken:currentToken
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
                    tokenize:tokenize
                }
            }();

            //-----------------------------------------------
            // Parser
            //-----------------------------------------------
            var _parser = function () {

                var COMMANDS = {}

                function addCommand(name, definition) {
                    COMMANDS[name] = definition;
                }

                function parseInterval(tokens) {
                    var number = tokens.requireTokenType(tokens, "NUMBER");
                    var factor = 1;
                    if (tokens.matchToken( "s")) {
                        factor = 1000;
                    } else if (tokens.matchToken( "ms")) {
                        // do nothing
                    }
                    return parseFloat(number.value) * factor;
                }

                function parseTargetExpression(tokens, proposition, required) {
                    if (tokens.matchToken(proposition) || proposition == null) {
                        var value = tokens.requireTokenType("IDENTIFIER", "CLASS_REF", "ID_REF", "STRING").value;
                        return {
                            type: "target",
                            value: value,
                            evaluate: function (context) {
                                if (this.value === "me" || this.value === "my") {
                                    return [_runtime.getMe(context)];
                                } else {
                                    return document.querySelectorAll(this.value);
                                }
                            }
                        }
                    } else if (required) {
                        raiseParseError(tokens, "Required token '" + proposition + "' not found");
                    } else {
                        return {
                            type: "implicit_me",
                            evaluate: function (context) {
                                return [_runtime.getMe(context)];
                            }
                        }
                    }
                }

                function parseFunctionCall(tokens, root) {
                    var args = [];
                    do {
                        args.push(parseValueExpression(tokens));
                    } while (tokens.matchOpToken(","))
                    tokens.requireOpToken(")");

                    return {
                        type: "method_call",
                        root: root,
                        args: args,
                        evaluate: function (context) {
                            var rootValue = this.root.evaluate(context);
                            var argValues = args.map(function (arg) {
                                return arg.evaluate(context);
                            })
                            return rootValue.apply(null, argValues); //TODO get the *this* right
                        }
                    };
                }

                function maybeParseDots(tokens, root) {
                    if (tokens.matchOpToken(".")) {
                        var prop = tokens.requireTokenType("IDENTIFIER");
                        var deref = {
                            type: "dereference",
                            root: root,
                            prop: prop,
                            evaluate: function(context) {
                                var rootValue = this.root.evaluate(context);
                                return rootValue[this.prop.value];
                            }
                        };
                        return maybeParseDots(tokens, deref);
                    } else if (tokens.matchOpToken("(")) {
                        return  parseFunctionCall(tokens, root);
                    } else {
                        return root;
                    }
                }

                function parseValueExpression(tokens) {
                    var stringToken = tokens.matchTokenType('STRING');
                    if (stringToken) {
                        return {
                            type: "string",
                            value: stringToken.value,
                            evaluate: function(self) {
                                return this.value;
                            }
                        }
                    }

                    var number = tokens.matchTokenType('NUMBER');
                    if (number) {
                        return {
                            type: "number",
                            value: number.value,
                            evaluate: function(self) {
                                return this.value;
                            }
                        }
                    }

                    var identifier = tokens.matchTokenType('IDENTIFIER');
                    if (identifier) {
                        var id = {
                            type: "symbol",
                            value: identifier.value,
                            evaluate: function(context) {
                                if (this.value === "me" || this.value === "my") {
                                    return _runtime.getMe(context);
                                } else {
                                    var fromContext = context[this.value];
                                    if (fromContext) {
                                        return fromContext;
                                    } else {
                                        return window[this.value];
                                    }
                                }
                            }
                        };
                        return maybeParseDots(tokens, id);
                    }

                    var elementId = tokens.matchTokenType('ID_REF');
                    if (elementId) {
                        var id = {
                            type: "id_ref",
                            value: elementId.value.substr(1),
                            evaluate: function(context) {
                                return document.getElementById(this.value);
                            }
                        };
                        return maybeParseDots(tokens, id);
                    }


                    raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
                }

                function parseClassRefExpression(tokens) {
                    var classRef = tokens.matchTokenType("CLASS_REF");
                    if (classRef) {
                        return {
                            type: "class_ref",
                            value: classRef.value.substr(1),
                            evaluate: function(context) {
                                return document.body.querySelectorAll(this.value);
                            }
                        }
                    }
                }

                function parseAttributeExpression(tokens) {
                    if (tokens.matchOpToken("[")) {
                        var name = tokens.matchTokenType( "IDENTIFIER");
                        var value = null;
                        if(tokens.matchOpToken("=")) {
                            value = parseValueExpression(tokens);
                        }
                        tokens.requireOpToken("]");
                        return {
                            type: "attribute_expression",
                            name: name.value,
                            value: value,
                            evaluate: function(){
                                return this.value;
                            }
                        }
                    }
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

                function parseCommand(tokens) {
                    var commandName = tokens.matchTokenType("IDENTIFIER");
                    var commandDef = COMMANDS[commandName.value];
                    if (commandDef) return commandDef(_parser, _runtime, tokens);
                    raiseParseError(tokens);
                }

                function parseCommandList(tokens) {
                    var start = parseCommand(tokens);
                    var last = start;
                    while (tokens.matchToken( "then")) {
                        last.next = parseCommand(tokens);
                        last = last.next;
                    }
                    return start;
                }

                function parseEventListener(tokens) {
                    var eventListener = {
                        type: "event_listener",
                        on: parseTargetExpression(tokens, "on", true),
                        from: parseTargetExpression(tokens, "from"),
                    }
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
                    } while (tokens.matchToken( "end") && tokens.hasMore())
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
                    parseClassRefExpression: parseClassRefExpression,
                    parseAttributeExpression: parseAttributeExpression,
                    parseTargetExpression: parseTargetExpression,
                    parseValueExpression: parseValueExpression,
                    parseCommandList: parseCommandList,
                    parseInterval: parseInterval,
                    parseHyperScript: parseHyperScript,
                    raiseParseError: raiseParseError,
                    addCommand: addCommand,
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

                function forTargets(that, targetsProp, context, callback) {
                    var targets = that[targetsProp].evaluate(context);
                    forEach(that, targets, function (target) {
                        callback.call(this, target);
                    });
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
                        window: window,
                        document: document,
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
                        var event = eventListener.on.value;
                        _runtime.forTargets(eventListener, "from", {me:elt}, function (from) {
                            from.addEventListener(event, makeEventListener(eventListener, elt));
                        });
                    });
                }

                function next(current, context) {
                    if (current.next) {
                        current.next.exec(context);
                    }
                }

                function addGlobal(name, value) {
                    GLOBALS[name] = value;
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
                        var start =  _parser.parseCommandList(tokens);
                        var ctx = makeContext(start, document.body, customEvent);
                        start.exec(ctx);
                        return ctx["it"];
                    } else {
                        var expression = _parser.parseValueExpression(tokens);
                        var ctx = makeContext(expression, document.body, customEvent);
                        return expression.evaluate(ctx);
                    }
                }

                function initElement(elt) {
                    var src = getScript(elt);
                    if (src) {
                        var tokens = _lexer.tokenize(src);
                        var hyperScript =  _parser.parseHyperScript(tokens);
                        apply(hyperScript, elt);
                    }
                }

                return {
                    forEach: forEach,
                    triggerEvent: triggerEvent,
                    forTargets: forTargets,
                    next: next,
                    matchesSelector: matchesSelector,
                    getScript: getScript,
                    getMe: getMe,
                    apply:apply,
                    addGlobal:addGlobal,
                    setScriptAttrs: setScriptAttrs,
                    initElement: initElement,
                    evaluate: evaluate,
                    getScriptSelector: getScriptSelector
                }
            }();

            //-----------------------------------------------
            // Commands
            //-----------------------------------------------

            _parser.addCommand("add", function (parser, runtime, tokens) {
                var classRef = parser.parseClassRefExpression(tokens);
                var attributeRef = null;
                if(classRef == null) {
                    attributeRef = parser.parseAttributeExpression(tokens);
                    if (attributeRef == null) {
                        parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                    }
                }
                var to = parser.parseTargetExpression(tokens, "to");
                return {
                    type: "add",
                    classRef: classRef,
                    attributeRef: attributeRef,
                    to: to,
                    exec: function(context) {
                        runtime.forTargets(this, "to", context, function (target) {
                            if (this.classRef) {
                                target.classList.add(this.classRef.value);
                            } else {
                                target.setAttribute(this.attributeRef.name, this.attributeRef.value.evaluate(context))
                            }
                        });
                        runtime.next(this, context);
                    }
                };
            });

            _parser.addCommand("remove", function (parser, runtime,tokens) {
                var classRef = parser.parseClassRefExpression(tokens);
                var attributeRef = null;
                var elementExpr = null;
                if(classRef == null) {
                    attributeRef = parser.parseAttributeExpression(tokens);
                    if (attributeRef == null) {
                        elementExpr = _parser.parseValueExpression(tokens)
                        if (elementExpr == null) {
                            parser.raiseParseError(tokens, "Expected either a class reference, attribute expression or value expression");
                        }
                    }
                }
                if (elementExpr == null) {
                    var from = parser.parseTargetExpression(tokens, "from");
                }

                return {
                    type: "remove",
                    classRef: classRef,
                    attributeRef: attributeRef,
                    elementExpr: elementExpr,
                    from: from,
                    exec: function(context) {
                        if(this.elementExpr) {
                            var elementToRemove = this.elementExpr.evaluate(context);
                            elementToRemove.parentElement.removeChild(elementToRemove);
                        } else {
                            runtime.forTargets(this, "from", context, function (target) {
                                if (this.classRef) {
                                    target.classList.remove(this.classRef.value);
                                } else {
                                    target.removeAttribute(this.attributeRef.name)
                                }
                            });
                        }
                        runtime.next(this, context);
                    }
                }
            });

            _parser.addCommand("toggle", function (parser, runtime, tokens) {
                var classRef = parser.parseClassRefExpression(tokens);
                var attributeRef = null;
                if(classRef == null) {
                    attributeRef = parser.parseAttributeExpression(tokens);
                    if (attributeRef == null) {
                        parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                    }
                }
                var on = parser.parseTargetExpression(tokens, "on");
                return {
                    type: "toggle",
                    classRef: classRef,
                    attributeRef: attributeRef,
                    on: on,
                    exec: function(context) {
                        runtime.forTargets(this, "on", context, function (target) {
                            if (this.classRef) {
                                target.classList.toggle(this.classRef.value);
                            } else {
                                if (target.getAttribute(this.attributeRef.name)) {
                                    target.removeAttribute(this.attributeRef.name);
                                } else {
                                    target.setAttribute(this.attributeRef.name, this.attributeRef.value.evaluate(context));
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
                    time: parser.parseInterval(tokens),
                    exec: function(context) {
                        var copyOfThis = this;
                        setTimeout(function () {
                            runtime.next(copyOfThis, context);
                        }, this.time);
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
                        var value = parser.parseValueExpression(tokens);
                        details.push([name, value]);
                    } while (tokens.matchOpToken(","))
                    tokens.requireOpToken("}");
                }
                var to = parser.parseTargetExpression(tokens, "to");

                return {
                    type: "send",
                    eventName: eventName,
                    details: details,
                    to: to,
                    exec: function(context) {
                        runtime.forTargets(this, "to", context, function (target) {
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
                return {
                    type: "take",
                    classRef: tokens.requireTokenType(tokens, "CLASS_REF"),
                    from: parser.parseTargetExpression(tokens, "from"),
                    exec: function(context) {
                        var clazz = this.classRef.value.substr(1);
                        runtime.forTargets(this, "from", context, function (target) {
                            target.classList.remove(clazz)
                        });
                        runtime.getMe(context).classList.add(clazz);
                        runtime.next(this, context);
                    }
                }
            })

            _parser.addCommand("log", function (parser, runtime, tokens) {
                return {
                    type: "log",
                    expr: parser.parseValueExpression(tokens),
                    exec: function(context) {
                        console.log(this.expr.evaluate(context));
                        runtime.next(this, context);
                    }
                }
            })

            _parser.addCommand("call", function (parser, runtime, tokens) {
                return {
                    type: "call",
                    expr: parser.parseValueExpression(tokens),
                    exec: function(context) {
                        this.expr.evaluate(context);
                        runtime.next(this, context);
                    }
                }
            })

            _parser.addCommand("put", function (parser, runtime, tokens) {

                var value = parser.parseValueExpression(tokens);
                tokens.requireToken("into");
                var target = parser.parseTargetExpression(tokens);
                var propPath = []
                while (tokens.matchOpToken(".")) {
                    propPath.push(tokens.requireTokenType("IDENTIFIER").value)
                }

                return {
                    type: "put",
                    target: target,
                    propPath: propPath,
                    value: value,
                    exec: function(context) {
                        var value = this.value.evaluate(context);
                        runtime.forTargets(this, "target", context, function (target) {
                            var finalTarget = target;
                            var propPathClone = this.propPath.slice();
                            while (propPathClone.length > 1) {
                                finalTarget = finalTarget[propPathClone.shift()];
                            }
                            finalTarget[propPathClone[0]] = value;
                        })
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
                _runtime.evaluate(str);
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