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
                var optable = {
                    '+': 'PLUS',
                    '-': 'MINUS',
                    '*': 'MULTIPLY',
                    '.': 'PERIOD',
                    '\\': 'BACKSLASH',
                    ':': 'COLON',
                    '%': 'PERCENT',
                    '|': 'PIPE',
                    '!': 'EXCLAMATION',
                    '?': 'QUESTION',
                    '#': 'POUND',
                    '&': 'AMPERSAND',
                    ';': 'SEMI',
                    ',': 'COMMA',
                    '(': 'L_PAREN',
                    ')': 'R_PAREN',
                    '<': 'L_ANG',
                    '>': 'R_ANG',
                    '{': 'L_BRACE',
                    '}': 'R_BRACE',
                    '[': 'L_BRACKET',
                    ']': 'R_BRACKET',
                    '=': 'EQUALS'
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
                    function requireOpToken(value) {
                        var token = matchOpToken(value);
                        if (token) {
                            return token;
                        } else {
                            raiseError(tokens, "Expected  " + value);
                        }
                    }

                    function matchOpToken(value) {
                        if (currentToken() && currentToken().value === value && currentToken().type !== "STRING") {
                            return consumeToken();
                        }
                    }

                    function requireTokenType(type1, type2, type3) {
                        var token = matchTokenType(type1, type2, type3);
                        if (token) {
                            return token;
                        } else {
                            raiseError(tokens, "Expected one of " + JSON.stringify([type1, type2, type3]));
                        }
                    }

                    function matchTokenType(type1, type2, type3) {
                        if (currentToken() && currentToken().type && [type1, type2, type3].indexOf(currentToken().type) >= 0) {
                            return consumeToken();
                        }
                    }

                    function requireToken(value, type) {
                        var token = matchToken(value, type);
                        if(token) {
                            return token;
                        } else {
                            raiseError(tokens, "Expected token " + value);
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
                    var lastToken = "START";

                    while (position < source.length) {
                        consumeWhitespace();
                        if (currentChar() === "-" && nextChar() === "-") {
                            consumeComment();
                        } else {
                            if (isPrecendingWhitespace() && currentChar() === "." && isAlpha(nextChar())) {
                                tokens.push(consumeClassReference());
                            } else if (isPrecendingWhitespace() && currentChar() === "#" && isAlpha(nextChar())) {
                                tokens.push(consumeIdReference());
                            } else if (isAlpha(currentChar())) {
                                tokens.push(consumeIdentifier());
                            } else if (isNumeric(currentChar())) {
                                tokens.push(consumeNumber());
                            } else if (currentChar() === '"') {
                                tokens.push(consumeString());
                            } else if (optable[currentChar()]) {
                                tokens.push(makeToken(optable[currentChar()], consumeChar()));
                            }
                        }
                    }

                    return makeTokensObject(tokens, [], source);

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
                        while (!isNewline(currentChar())) {
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
                        consumeChar(); // consume leading quote
                        var value = "";
                        while (currentChar() && currentChar() !== '"') {
                            if (currentChar() === "\")") {
                                consumeChar();
                            }
                            value += consumeChar();
                        }
                        if (currentChar() !== '"') {
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

                    function isPrecendingWhitespace() {
                        return lastToken === "START" || isWhitespace(lastToken);
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

                function parseTargetExpression(tokens, identifier, required) {
                    if (tokens.matchToken(identifier) || identifier == null) {
                        return {
                            type: "target",
                            value: tokens.requireTokenType("IDENTIFIER", "CLASS_REF", "ID_REF").value
                        }
                    } else if (required) {
                        raiseError(tokens, "Required token '" + identifier + "' not found");
                    }
                }

                function parseFunctionCall(tokens, root) {
                    var args = [];
                    do {
                        args.push(parseValueExpression(tokens));
                    } while (tokens.matchOpToken(","))

                    return {
                        type: "method_call",
                        root: root,
                        args: args,
                        evaluate: function (elt, context) {
                            var rootValue = this.root.evaluate(elt, context);
                            var argValues = args.map(function (arg) {
                                return arg.evaluate(elt, context);
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
                            evaluate: function(elt, context) {
                                var rootValue = this.root.evaluate(elt, context);
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
                            evaluate: function(elt, context) {
                                if (this.value === "me" || this.value === "my") {
                                    return elt;
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

                    raiseError(tokens, "Unexpected value: " + tokens.currentToken().value);
                }

                function parseAttributeExpression(tokens) {
                    var classRef = tokens.matchTokenType("CLASS_REF");
                    if (classRef) {
                        return {
                            name: "class",
                            value: classRef.value.substr(1)
                        }
                    } else {
                        var name = tokens.matchTokenType( "IDENTIFIER");
                        tokens.matchOpToken("=");
                        var value = tokens.matchTokenType( "IDENTIFIER", "STRING");
                        return {
                            name: name.value,
                            value: value.value
                        }
                    }
                }

                function consumeRestOfCommand(tokens) {
                    var firstToken = null;
                    var lastToken = null;
                    while (tokens.hasMore()) {
                        if (tokens.currentToken() !== 'then') {
                            lastToken = tokens.consumeToken();
                        }
                        if (firstToken == null) {
                            firstToken = lastToken;
                        }
                    }
                    return tokens.source.substr(firstToken.start, lastToken.end);
                }

                function raiseError(tokens, message) {
                    message = message || "Unexpected Token : " + tokens.currentToken().value;
                    var error = new Error(message);
                    error.tokens = tokens;
                    throw error
                }

                function parseCommand(tokens) {
                    var commandName = tokens.matchTokenType("IDENTIFIER");
                    var commandDef = COMMANDS[commandName.value];
                    if (commandDef) return commandDef(_parser, _runtime, tokens);
                    raiseError(tokens);
                }

                function parseCommandList(tokens) {
                    var commandList = {
                        type: "command_list",
                        on: parseTargetExpression(tokens, "on", true),
                        from: parseTargetExpression(tokens, "from"),
                        start: parseCommand(tokens)
                    }
                    var last = commandList.start;
                    while (tokens.matchToken( "then")) {
                        last.next = parseCommand(tokens);
                        last = last.next;
                    }
                    return commandList;
                }

                function parseHypeScript(tokens) {
                    var hypeScript = {
                        type: "hype_script",
                        commandLists: []
                    }
                    do {
                        hypeScript.commandLists.push(parseCommandList(tokens));
                    } while (tokens.matchToken( "end"))
                    return hypeScript;
                }

                return {
                    // parser API
                    parseAttributeExpression: parseAttributeExpression,
                    parseTargetExpression: parseTargetExpression,
                    parseValueExpression: parseValueExpression,
                    consumeRestOfCommand: consumeRestOfCommand,
                    parseInterval: parseInterval,
                    parseCommandList: parseCommandList,
                    parseHyperscript: parseHypeScript,
                    addCommand: addCommand,
                }
            }();

            //-----------------------------------------------
            // Runtime
            //-----------------------------------------------
            var _runtime = function () {

                var GLOBALS = {};

                function matchesSelector(elt, selector) {
                    // noinspection JSUnresolvedVariable
                    var matchesFunction = elt.matches ||
                        elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                        || elt.webkitMatchesSelector || elt.oMatchesSelector;
                    return matchesFunction && matchesFunction.call(elt, selector);
                }

                function forTargets(that, targetsProp, elt, callback) {
                    var targets = evalTargetExpr(that[targetsProp], elt);
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

                // TODO this should probably live on the expression
                function evalTargetExpr(expr, elt) {
                    if (expr) {
                        if (expr.value === "me" || expr.value === "my") {
                            return [elt];
                        } else {
                            return document.querySelectorAll(expr.value);
                        }
                    } else {
                        return [elt];
                    }
                }

                function forEach(that, arr, func) {
                    for (var i = 0; i < arr.length; i++) {
                        func.call(that, arr[i]);
                    }
                }

                function exec(cmd, elt, context) {
                    if (cmd) {
                        cmd.exec(elt, context);
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

                function enter(commandList, event, elt) {
                    var ctx = {
                        meta: {
                            parser:_parser,
                            lexer:_lexer,
                            runtime:_runtime,
                            current:commandList
                        },
                        me: elt,
                        event: event,
                        window: window,
                        document: document,
                        body: document.body,
                        globals: GLOBALS,
                    }
                    // lets get this party started
                    exec(commandList.start, elt, ctx);
                }

                function getScript(elt) {
                    return elt.getAttribute("_")
                        || elt.getAttribute("hs")
                        || elt.getAttribute("data-hs");
                }

                function makeEventListener(actionList, elt) {
                    return function (event) {
                        _runtime.enter(actionList, event, elt)
                    };
                }

                function apply(hypeScript, elt) {
                    _runtime.forEach(hypeScript, hypeScript.commandLists, function (commandList) {
                        var event = commandList.on.value;
                        _runtime.forTargets(commandList, "from", elt, function (from) {
                            from.addEventListener(event, makeEventListener(commandList, elt));
                        });
                    });
                }

                return {
                    forEach: forEach,
                    triggerEvent: triggerEvent,
                    evalTargetExpr: evalTargetExpr,
                    forTargets: forTargets,
                    evaluate: function (that, elt, context) {
                        return that.evaluate(elt, context);
                    },
                    exec: exec,
                    matchesSelector: matchesSelector,
                    makeEvent: makeEvent,
                    enter:enter,
                    getScript: getScript,
                    apply:apply
                }
            }();

            //-----------------------------------------------
            // Commands
            //-----------------------------------------------

            _parser.addCommand("add", function (parser, runtime, tokens) {
                return {
                    type: "add",
                    attribute: parser.parseAttributeExpression(tokens),
                    to: parser.parseTargetExpression(tokens, "to"),
                    exec: function(elt, context) {
                        runtime.forTargets(this, "to", elt, function (target) {
                            if (this.attribute.name === "class") {
                                target.classList.add(this.attribute.value);
                            } else {
                                target.setAttribute(this.attribute.name, this.attribute.value)
                            }
                        });
                        runtime.exec(this.next, elt, context);
                    }
                };
            });

            _parser.addCommand("remove", function (parser, runtime,tokens) {
                return {
                    type: "remove",
                    attribute: parser.parseAttributeExpression(tokens),
                    from: parser.parseTargetExpression(tokens, "from"),
                    exec: function(elt, context) {
                        runtime.forTargets(this, "from", elt, function (target) {
                            if (this.attribute.name === "class") {
                                target.classList.remove(this.attribute.value);
                            } else {
                                target.removeAttribute(this.attribute.name)
                            }
                        });
                        runtime.exec(this.next, elt, context);
                    }
                }
            });

            _parser.addCommand("toggle", function (parser, runtime, tokens) {
                return {
                    type: "toggle",
                    attribute: parser.parseAttributeExpression(tokens),
                    on: parser.parseTargetExpression(tokens, "on"),
                    exec: function(elt, context) {
                        runtime.forTargets(this, "on", elt, function (target) {
                            if (this.attribute.name === "class") {
                                target.classList.toggle(this.attribute.value);
                            } else {
                                if (target.getAttribute(this.attribute.name)) {
                                    target.removeAttribute(this.attribute.name);
                                } else {
                                    target.setAttribute(this.attribute.name, this.attribute.value);
                                }
                            }
                        });
                        runtime.exec(this.next, elt, context);
                    }
                }
            })

            _parser.addCommand("eval", function (parser, runtime, tokens) {
                var evalExpr = {
                    type: "eval",
                    eval: parser.consumeRestOfCommand(tokens),
                    exec: function(elt, context) {
                        eval(this.eval);
                        runtime.exec(this.next, elt, context);
                    }
                }
                return evalExpr;
            })

            _parser.addCommand("wait", function (parser, runtime, tokens) {
                return {
                    type: "wait",
                    time: parser.parseInterval(tokens),
                    exec: function(elt, context) {
                        var next = this.next;
                        setTimeout(function () {
                            runtime.exec(next, elt, context);
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
                    exec: function(elt, context) {
                        runtime.forTargets(this, "to", elt, function (target) {
                            var detailsValue = {}
                            runtime.forEach(this, this.details, function (detail) {
                                detailsValue[detail[0].value] = runtime.evaluate(detail[1]);
                            });
                            runtime.triggerEvent(target, this.eventName.value, detailsValue);
                        })
                        runtime.exec(this.next, elt, context);
                    }
                }
            })

            _parser.addCommand("take", function (parser, runtime, tokens) {
                return {
                    type: "take",
                    classRef: tokens.requireTokenType(tokens, "CLASS_REF"),
                    from: parser.parseTargetExpression(tokens, "from"),
                    exec: function(elt, context) {
                        var clazz = this.classRef.value.substr(1);
                        runtime.forTargets(this, "from", elt, function (target) {
                            target.classList.remove(clazz)
                        });
                        elt.classList.add(clazz);
                        runtime.exec(this.next, elt, context);
                    }
                }
            })

            _parser.addCommand("log", function (parser, runtime, tokens) {
                return {
                    type: "log",
                    expr: parser.parseValueExpression(tokens),
                    exec: function(elt, context) {
                        console.log(this.expr.evaluate(elt, context));
                        runtime.exec(this.next, elt, context);
                    }
                }
            })

            _parser.addCommand("call", function (parser, runtime, tokens) {
                return {
                    type: "call",
                    expr: parser.parseValueExpression(tokens),
                    exec: function(elt, context) {
                        this.expr.evaluate(elt, context);
                        runtime.exec(this.next, elt, context);
                    }
                }
            })

            _parser.addCommand("set", function (parser, runtime, tokens) {

                var target = parser.parseTargetExpression(tokens);
                var propPath = []
                while (tokens.matchOpToken(".")) {
                    propPath.push(tokens.requireTokenType("IDENTIFIER").value)
                }
                tokens.requireToken("to");
                var value = parser.parseValueExpression(tokens);

                return {
                    type: "set",
                    target: target,
                    propPath: propPath,
                    value: value,
                    exec: function(elt, context) {
                        var value = runtime.evaluate(this.value, elt, context);
                        runtime.forTargets(this, "target", elt, function (target) {
                            var finalTarget = target;
                            var propPathClone = this.propPath.slice();
                            while (propPathClone.length > 1) {
                                finalTarget = finalTarget[propPathClone.shift()];
                            }
                            finalTarget[propPathClone[0]] = value;
                        })
                        runtime.exec(this.next, elt, context);
                    }
                }
            })

            //-----------------------------------------------
            // API
            //-----------------------------------------------

            function start() {
                var fn = function () {
                    var elts = document.querySelectorAll("[_], [hs], [data-hs]");
                    _runtime.forEach(document, elts, function (elt) {
                        init(elt);
                    })
                }
                if (document.readyState !== 'loading') {
                    fn();
                } else {
                    document.addEventListener('DOMContentLoaded', fn);
                }
            }

            function init(elt) {
                var src = _runtime.getScript(elt);
                if (src) {
                    var tokens = _lexer.tokenize(src);
                    var hyperScript =  _parser.parseHyperscript(tokens);
                    _runtime.apply(hyperScript, elt);
                }
            }

            return {
                lexer: _lexer,
                parser: _parser,
                runtime: _runtime,
                init: init,
                start: start
            }
        }
    )()
}));