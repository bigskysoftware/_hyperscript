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
        function parseInterval(str) {
            if (str === "null" || str === "false" || str === "") {
                return null;
            } else if (str.lastIndexOf("ms") === str.length - 2) {
                return parseFloat(str.substr(0, str.length - 2));
            } else if (str.lastIndexOf("s") === str.length - 1) {
                return parseFloat(str.substr(0, str.length - 1)) * 1000;
            } else {
                return parseFloat(str);
            }
        }

        function splitOnWhitespace(trigger) {
            return trigger.split(/\s+/);
        }

        function matches(elt, selector) {
            // noinspection JSUnresolvedVariable
            var matchesFunction = elt.matches ||
                elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                || elt.webkitMatchesSelector || elt.oMatchesSelector;
            return matchesFunction && matchesFunction.call(elt, selector);
        }

        function defaultEvent(elt) {
            if (matches(elt, 'form'))
                return 'submit';
            if (matches(elt, 'input, textarea, select'))
                return 'change';
            return 'click';
        }

        function match(tokens, token) {
            if (tokens[0] === token) {
                tokens.shift();
                return true;
            } else {
                return false;
            }
        }

        function makeEvent(eventName, detail) {
            var evt;
            if (window.CustomEvent && typeof window.CustomEvent === 'function') {
                evt = new CustomEvent(eventName, {bubbles: true, cancelable: true, detail: detail});
            } else {
                evt = getDocument().createEvent('CustomEvent');
                evt.initCustomEvent(eventName, true, true, detail);
            }
            return evt;
        }

        //-----------------------------------------------
        // Lexer
        //-----------------------------------------------

        function makeTokenizer(string) {
            var source = string;

            var tokens = [];

            var optable = {
                '+':  'PLUS',
                '-':  'MINUS',
                '*':  'MULTIPLY',
                '.':  'PERIOD',
                '\\': 'BACKSLASH',
                ':':  'COLON',
                '%':  'PERCENT',
                '|':  'PIPE',
                '!':  'EXCLAMATION',
                '?':  'QUESTION',
                '#':  'POUND',
                '&':  'AMPERSAND',
                ';':  'SEMI',
                ',':  'COMMA',
                '(':  'L_PAREN',
                ')':  'R_PAREN',
                '<':  'L_ANG',
                '>':  'R_ANG',
                '{':  'L_BRACE',
                '}':  'R_BRACE',
                '[':  'L_BRACKET',
                ']':  'R_BRACKET',
                '=':  'EQUALS'
            };

            var position = 0;
            var column = 0;
            var line = 1;
            var lastToken = "START";

            function makeToken(type, value) {
                return {type: type, value: value, position: position, column: column, line: line};
            }

            function consumeComment() {
                while (!newline(currentChar())) {
                    consumeChar();
                }
                consumeChar();
            }

            function consumeClassReference() {
                var classRef = makeToken("CLASS_REF");
                var value = consumeChar();
                while (alpha(currentChar())) {
                    value += consumeChar();
                }
                classRef.value = value;
                return classRef;
            }

            function consumeIdReference() {
                var idRef = makeToken("ID_REF");
                var value = consumeChar();
                while (alpha(currentChar())) {
                    value += consumeChar();
                }
                idRef.value = value;
                return idRef;
            }

            function consumeIdentifier() {
                var identifier = makeToken("IDENTIFIER");
                var value = consumeChar();
                while (alpha(currentChar())) {
                    value += consumeChar();
                }
                identifier.value = value;
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
                return string;
            }

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

            return {
                tokens : tokens,
            }
        }


        //-----------------------------------------------
        // Runtime
        //-----------------------------------------------

        function makeEvalCommandList(elt, actionList) {
            return function () {
                evalCommandList(elt, actionList.slice(0));
            };
        }

        function evalCommandList(elt, actionList) {
            if (actionList.length > 0) {
                var action = actionList.shift();
                if (action.type === "wait") {
                    setTimeout(function(){
                        evalCommandList(elt, actionList);
                    }, action.time);
                } else {
                    evalCommand(elt, action);
                    evalCommandList(elt, actionList);
                }
            }
        }

        function evalJavascriptInContext(js, context) {
            return function() { return eval(js); }.call(context);
        }

        function triggerEvent(elt, eventName) {
            var detail = {sent_by:elt};
            var event = makeEvent(eventName, detail);
            var eventResult = elt.dispatchEvent(event);
            return eventResult;
        }

        function evalCommand(elt, command) {
            if (command.on) {
                var targets = document.querySelectorAll(command.on.value);
            } else {
                var targets = [elt];
            }
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                if (command.type === "add") {
                    if (command.attribute.name === "class") {
                        target.classList.add(command.attribute.value);
                    } else {
                        // TODO handle styles
                        target.setAttribute(command.attribute.name, command.attribute.value)
                    }
                } else if (command.type === "remove") {
                    if (command.attribute.name === "class") {
                        target.classList.remove(command.attribute.value);
                    } else {
                        // TODO handle styles
                        target.removeAttribute(command.attribute.name)
                    }
                } else if (command.type === "toggle") {
                    if (command.attribute.name === "class") {
                        // TODO handle styles
                        target.classList.toggle(command.attribute.value);
                    } else {
                    }
                } else if (command.type === "call") {
                    evalJavascriptInContext(command.expr, elt);
                } else if (command.type === "send") {
                    triggerEvent(target, command.name);
                }
            }
        }

        //-----------------------------------------------
        // Parser
        //-----------------------------------------------

        function parseTargetExpression(tokens, token) {
            if (match(tokens, token)) {
                return {
                    type: token,
                    value: tokens.shift()
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

        function parseAttributeExpression(token) {
            if (token.indexOf(".") === 0) {
                return {
                    name:"class",
                    value: token.substr(1)
                }
            } else {
                var nameValue = token.split("=");
                return {
                    name: nameValue[0],
                    value:nameValue[1]
                }
            }
        }

        function parseAddCommand(tokens) {
            if (match(tokens, "add")) {
                return {
                    type: "add",
                    attribute: parseAttributeExpression(tokens.shift()),
                    on: parseToExpression(tokens)
                }
            }
        }

        function parseRemoveCommand(tokens) {
            if (match(tokens, "remove")) {
                return {
                    type: "remove",
                    attribute: parseAttributeExpression(tokens.shift()),
                    on: parseFromExpression(tokens)
                }
            }
        }

        function parseToggleCommand(tokens) {
            if (match(tokens, "toggle")) {
                return {
                    type: "toggle",
                    attribute: parseAttributeExpression(tokens.shift()),
                    on: parseOnExpression(tokens)
                }
            }
        }

        function parseCallCommand(tokens) {
            if (match(tokens, "call")) {
                var callExpr = {
                    type: "call",
                    expr: ""
                }
                while (tokens.length > 0) {
                    if (tokens[0] !== 'then') {
                        callExpr.expr += " " + tokens.shift();
                    }
                }
                return callExpr;
            }
        }

        function parseWaitCommand(tokens) {
            if (match(tokens, "wait")) {
                return {
                    type: "wait",
                    time: parseInterval(tokens.shift())
                }
            }
        }

        function parseSendCommand(tokens) {
            if (match(tokens, "send")) {
                return {
                    type: "send",
                    name: tokens.shift(),
                    on: parseToExpression(tokens)
                }
            }
        }

        function parseCommand(tokens) {
            var expr = parseAddCommand(tokens);
            if(expr) return expr;

            expr = parseRemoveCommand(tokens);
            if(expr) return expr;

            expr = parseToggleCommand(tokens);
            if(expr) return expr;

            expr = parseCallCommand(tokens);
            if(expr) return expr;

            expr = parseWaitCommand(tokens);
            if(expr) return expr;

            expr = parseSendCommand(tokens);
            if(expr) return expr;

            
        }

        function paresCommandList(tokens) {
            var actionList = {
                type: "command_list",
                on: parseOnExpression(tokens),
                actions: []
            }
            do {
                actionList.actions.push(parseCommand(tokens));
            } while (match(tokens, "then"))
            return actionList;
        }

        function parseHypeScript(tokens) {
            var hypeScript = {
                type: "hype_script",
                actionLists: []
            }
            do {
                hypeScript.actionLists.push(paresCommandList(tokens));
            } while (match(tokens, "end"))
        }

        //-----------------------------------------------
        // API
        //-----------------------------------------------
        function parse(string) {
            var tokens = splitOnWhitespace(string);
            return parseHypeScript(tokens);
        }

        function applyHypeScript(hypeScript, elt) {
            for (var i = 0; i < hypeScript.actionLists.length; i++) {
                var actionList = hypeScript.actionLists[i];
                if (actionList.on) {
                    var event = actionList.on.value;
                } else {
                    var event = defaultEvent(elt);
                }
                elt.addEventListener(event, makeEvalCommandList(elt, actionList.actions))
            }
        }

        function getHyped(elt) {
            if (elt) {
                var hypeScript = elt.getAttribute("_")
                    || elt.getAttribute("hypescript")
                    || elt.getAttribute("data-hypescript");
                if (hypeScript) {
                    var parseTree = parse(hypeScript);
                    applyHypeScript(parseTree, elt);
                }
            } else {
                var fn = function(){
                    var all = document.querySelectorAll("[_], [hypescript], [data-hypescript]");
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
            tokenize:makeTokenizer,
            getHyped:getHyped
        }
    }
)()}));