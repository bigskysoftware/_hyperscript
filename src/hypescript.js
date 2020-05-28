//AMD insanity
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root.hypescript = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    return (function () {
            'use strict';

            //-----------------------------------------------
            // Helpers
            //-----------------------------------------------
            function parseInterval(tokens) {
                var number = requireTokenType(tokens, "NUMBER");
                var factor = 1;
                if (matchToken(tokens, "s")) {
                    var factor = 1000;
                } else if (matchToken(tokens, "ms")) {
                    // do nothing
                }
                return parseFloat(number.value) * factor;
            }

            function matchesSelector(elt, selector) {
                // noinspection JSUnresolvedVariable
                var matchesFunction = elt.matches ||
                    elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                    || elt.webkitMatchesSelector || elt.oMatchesSelector;
                return matchesFunction && matchesFunction.call(elt, selector);
            }

            function defaultEvent(elt) {
                if (matchesSelector(elt, 'form'))
                    return 'submit';
                if (matchesSelector(elt, 'input, textarea, select'))
                    return 'change';
                return 'click';
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

            //-----------------------------------------------
            // Lexer
            //-----------------------------------------------

            function matchOpToken(tokens, value) {
                if (tokens.list[0] && tokens.list[0].value === value && tokens.list[0].type !== "STRING") {
                    return shiftTokens(tokens);
                }
            }

            function requireTokenType(tokens, type1, type2, type3) {
                var token = matchTokenType(tokens, type1, type2, type3);
                if (token) {
                    return token;
                } else {
                    raiseError(tokens, "Expected one of " + JSON.stringify([type1, type2, type3]));
                }
            }

            function matchTokenType(tokens, type1, type2, type3) {
                if (tokens.list[0] && tokens.list[0].type && [type1, type2, type3].indexOf(tokens.list[0].type) >= 0) {
                    return shiftTokens(tokens);
                }
            }

            function shiftTokens(tokens) {
                var match = tokens.list.shift();
                tokens.consumed.push(match);
                return match;
            }

            function matchToken(tokens, value, type) {
                var type = type || "IDENTIFIER";
                if (tokens.list[0] && tokens.list[0].value === value && tokens.list[0].type === type) {
                    return shiftTokens(tokens);
                }
            }

            function tokenizeString(string) {
                var source = string;
                var tokens = [];

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

                var position = 0;
                var column = 0;
                var line = 1;
                var lastToken = "START";

                function makeToken(type, value) {
                    return {type: type, value: value, start: position, end: position + 1, column: column, line: line};
                }

                function consumeComment() {
                    while (!newline(currentChar())) {
                        consumeChar();
                    }
                    consumeChar();
                }

                function isValidCSSClassChar(c) {
                    return alpha(c) || numeric(c) || c === "-" || c === "_";
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

                function isValidCSSIDChar(c) {
                    return alpha(currentChar(c) || numeric(c) || c === "-" || c === "_" || c === ":" || c === ".");
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
                    while (alpha(currentChar())) {
                        value += consumeChar();
                    }
                    identifier.value = value;
                    identifier.end = position;
                    return identifier;
                }

                function consumeNumber() {
                    var number = makeToken("NUMBER");
                    var value = consumeChar();
                    while (numeric(currentChar())) {
                        value += consumeChar();
                    }
                    if (currentChar() === ".") {
                        value += consumeChar();
                    }
                    while (numeric(currentChar())) {
                        value += consumeChar();
                    }
                    number.value = value;
                    number.end = position;
                    return number;
                }

                function positionString(token) {
                    return "[Line: " + token.line + ", Column: " + token.col + "]"
                }

                function consumeString() {
                    var string = makeToken("STRING");
                    var value = consumeChar();
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
                    string.end = position;
                    return string;
                }

                function tokenize() {
                    while (position < source.length) {
                        consumeWhitespace();
                        if (currentChar() === "-" && nextChar() === "-") {
                            consumeComment();
                        } else {
                            if (precedingWhitespace() && currentChar() === "." && alpha(nextChar())) {
                                tokens.push(consumeClassReference());
                            } else if (precedingWhitespace() && currentChar() === "#" && alpha(nextChar())) {
                                tokens.push(consumeIdReference());
                            } else if (alpha(currentChar())) {
                                tokens.push(consumeIdentifier());
                            } else if (numeric(currentChar())) {
                                tokens.push(consumeNumber());
                            } else if (currentChar() === '"') {
                                tokens.push(consumeString());
                            } else if (optable[currentChar()]) {
                                tokens.push(makeToken(optable[currentChar()], consumeChar()));
                            }
                        }
                    }
                    return {
                        list:tokens,
                        consumed:[],
                        source:source
                    };
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

                function precedingWhitespace() {
                    return lastToken === "START" || whitespace(lastToken);
                }

                function whitespace(c) {
                    return c === " " || c === "\t" || newline(c);
                }

                function consumeWhitespace() {
                    while (currentChar() && whitespace(currentChar())) {
                        if (newline(currentChar())) {
                            column = 0;
                            line++;
                        }
                        consumeChar();
                    }
                }

                function newline(c) {
                    return c === '\r' || c === '\n';
                }

                function numeric(c) {
                    return c >= '0' && c <= '9';
                }

                function alpha(c) {
                    return (c >= 'a' && c <= 'z') ||
                        (c >= 'A' && c <= 'Z');
                }

                return tokenize();
            }


            //-----------------------------------------------
            // Runtime
            //-----------------------------------------------
            function triggerEvent(elt, eventName) {
                var detail = {sent_by: elt};
                var event = makeEvent(eventName, detail);
                var eventResult = elt.dispatchEvent(event);
                return eventResult;
            }

            function evalTargetExpr(expr, elt) {
                if (expr) {
                    return document.querySelectorAll(expr.value);
                } else {
                    return [elt];
                }
            }

            function forEach(arr, func) {
                for (var i = 0; i < arr.length; i++) {
                    func(arr[i]);
                }
            }

            function execNext(that, elt, context) {
                if(that.next){
                    that.next.exec(that.next, elt, context);
                }
            }

            //-----------------------------------------------
            // Parser
            //-----------------------------------------------

            function parseTargetExpression(tokens, identifier) {
                if (matchToken(tokens, identifier)) {
                    return {
                        type: "target",
                        value: requireTokenType(tokens, "IDENTIFIER", "CLASS_REF", "ID_REF").value
                    }
                }
            }

            function parseOnExpression(tokens) {
                return parseTargetExpression(tokens, "on");
            }

            function parseToExpression(tokens) {
                return parseTargetExpression(tokens, "to");
            }

            function parseFromExpression(tokens) {
                return parseTargetExpression(tokens, "from");
            }

            function parseAttributeExpression(tokens) {
                var classRef = matchTokenType(tokens,"CLASS_REF");
                if (classRef) {
                    return {
                        name: "class",
                        value: classRef.value.substr(1)
                    }
                } else {
                    var name = matchTokenType(tokens, "IDENTIFIER");
                    matchOpToken(tokens, "=");
                    var value = matchTokenType(tokens, "IDENTIFIER","STRING");
                    return {
                        name: name.value,
                        value: value.value
                    }
                }
            }

            function parseAddCommand(tokens) {
                if (matchToken(tokens, "add")) {
                    return {
                        type: "add",
                        attribute: parseAttributeExpression(tokens),
                        to: parseToExpression(tokens),
                        exec: function (self, elt, context) {
                            forEach(evalTargetExpr(self.to, elt), function (target) {
                                if (self.attribute.name === "class") {
                                    target.classList.add(self.attribute.value);
                                } else {
                                    target.setAttribute(self.attribute.name, self.attribute.value)
                                }
                            });
                            execNext(self, elt, context);
                        }
                    }
                }
            }

            function parseRemoveCommand(tokens) {
                if (matchToken(tokens, "remove")) {
                    return {
                        type: "remove",
                        attribute: parseAttributeExpression(tokens),
                        from: parseFromExpression(tokens),
                        exec: function (self, elt, context) {
                            forEach(evalTargetExpr(self.from, elt), function (target) {
                                if (self.attribute.name === "class") {
                                    target.classList.remove(self.attribute.value);
                                } else {
                                    target.removeAttribute(self.attribute.name)
                                }
                            });
                            execNext(self, elt, context);
                        }
                    }
                }
            }

            function parseToggleCommand(tokens) {
                if (matchToken(tokens, "toggle")) {
                    return {
                        type: "toggle",
                        attribute: parseAttributeExpression(tokens),
                        on: parseOnExpression(tokens),
                        exec: function (self, elt, context) {
                            forEach(evalTargetExpr(self.on, elt), function (target) {
                                if (self.attribute.name === "class") {
                                    target.classList.toggle(self.attribute.value);
                                } else {
                                    if (target.getAttribute(self.attribute.name)) {
                                        target.removeAttribute(self.attribute.name);
                                    } else {
                                        target.setAttribute(self.attribute.name, self.attribute.value);
                                    }
                                }
                            });
                            execNext(self, elt, context);
                        }
                    }
                }
            }


            function consumeEval(tokens) {
                var evalStr = "";
                var firstToken = null;
                var lastToken = null;
                while (tokens.list.length > 0) {
                    if (tokens.list[0] !== 'then') {
                        lastToken = shiftTokens(tokens);
                    }
                    if (firstToken == null) {
                        firstToken = lastToken;
                    }
                }
                return tokens.source.substr(firstToken.start, lastToken.end);
            }

            function parseEvalCommand(tokens) {
                if (matchToken(tokens, "eval")) {
                    var evalExpr = {
                        type: "eval",
                        eval: consumeEval(tokens),
                        exec: function (self, elt, context) {
                            eval(self.eval);
                            execNext(self, elt, context);
                        }
                    }
                    return evalExpr;
                }
            }

            function parseWaitCommand(tokens) {
                if (matchToken(tokens, "wait")) {
                    return {
                        type: "wait",
                        time: parseInterval(tokens),
                        exec: function (self, elt, context) {
                            setTimeout(function () {
                                execNext(self, elt, context);
                            }, self.time);
                        }
                    }
                }
            }

            function parseSendCommand(tokens) {
                if (matchToken(tokens, "send")) {
                    return {
                        type: "send",
                        eventName: matchTokenType(tokens, "IDENTIFIER"),
                        to: parseToExpression(tokens),
                        exec: function (self, elt, context) {
                            forEach(evalTargetExpr(self.to, elt), function (target) {
                                triggerEvent(target, self.eventName.value);
                            })
                            execNext(self, elt, context);
                        }
                    }
                }
            }

            function raiseError(tokens, message) {
                message = message || "Unexpected Token : " + tokens.tokens[0].value;
                var error = new Error();
                error.tokens = tokens;
                throw error
            }

            function parseCommand(tokens) {
                var expr = parseAddCommand(tokens);
                if (expr) return expr;

                expr = parseRemoveCommand(tokens);
                if(expr) return expr;

                expr = parseToggleCommand(tokens);
                if(expr) return expr;

                expr = parseEvalCommand(tokens);
                if(expr) return expr;

                expr = parseWaitCommand(tokens);
                if(expr) return expr;

                expr = parseSendCommand(tokens);
                if(expr) return expr;

                raiseError(tokens);
            }

            function parseCommandList(tokens) {
                var commandList = {
                    type: "command_list",
                    on: parseOnExpression(tokens),
                    start: parseCommand(tokens)
                }
                var last = commandList.start;
                while (matchToken(tokens, "then")) {
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
                } while (matchToken(tokens, "end"))
                return hypeScript;
            }

            //-----------------------------------------------
            // API
            //-----------------------------------------------
            function parse(string) {
                var tokens = tokenizeString(string);
                return parseHypeScript(tokens);
            }

            function makeEventListener(actionList, elt, ctx) {
                return function (event) {
                    ctx = {
                        me : elt,
                        detail : event.detail,
                        event : event
                    }
                    actionList.start.exec(actionList.start, elt, ctx);
                };
            }

            function applyHypeScript(hypeScript, elt) {
                for (var i = 0; i < hypeScript.commandLists.length; i++) {
                    var actionList = hypeScript.commandLists[i];
                    if (actionList.on) {
                        var event = actionList.on.value;
                    } else {
                        var event = defaultEvent(elt);
                    }
                    elt.addEventListener(event, makeEventListener(actionList, elt, {}));
                }
            }

            function getHyped(elt) {
                if (elt) {
                    var hypeScript = elt.getAttribute("_")
                        || elt.getAttribute("hs")
                        || elt.getAttribute("data-hs");
                    if (hypeScript) {
                        var parseTree = parse(hypeScript);
                        applyHypeScript(parseTree, elt);
                    }
                } else {
                    var fn = function () {
                        var all = document.querySelectorAll("[_], [hs], [data-hs]");
                        for (var i = 0; i < all.length; i++) {
                            var elt = all[i];
                            getHyped(elt);
                        }
                    }
                    if (document.readyState !== 'loading') {
                        fn();
                    } else {
                        document.addEventListener('DOMContentLoaded', fn);
                    }
                }
            }

            return {
                tokenize: tokenizeString,
                getHyped: getHyped
            }
        }
    )()
}));