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


            //====================================================================
            // Utilities
            //====================================================================

            function mergeObjects(obj1, obj2) {
                for (var key in obj2) {
                    if (obj2.hasOwnProperty(key)) {
                        obj1[key] = obj2[key];
                    }
                }
                return obj1;
            }

            function parseJSON(jString) {
                try {
                    return JSON.parse(jString);
                } catch(error) {
                    logError(error);
                    return null;
                }
            }

            function logError(msg) {
                if(console.error) {
                    console.error(msg);
                } else if (console.log) {
                    console.log("ERROR: ", msg);
                }
            }

            function assignToNamespace(nameSpace, name, value) {
                // we use window instead of globalScope here so that we can
                // intercept this in workers
                var root = window;
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

            var globalScope = typeof self !== 'undefined' ? self : this;

            //====================================================================
            // Lexer
            //====================================================================
            var _lexer = function () {
                var OP_TABLE = {
                    '+': 'PLUS',
                    '-': 'MINUS',
                    '*': 'MULTIPLY',
                    '/': 'DIVIDE',
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

                function isIdentifierChar(c) {
                    return (c === "_" || c === "$");
                }


                function makeTokensObject(tokens, consumed, source) {

                    var ignoreWhiteSpace = true;
                    matchTokenType("WHITESPACE"); // consume any initial whitespace

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

                    function matchAnyOpToken(op1, op2, op3) {
                        for (var i = 0; i < arguments.length; i++) {
                            var opToken = arguments[i];
                            var match = matchOpToken(opToken);
                            if (match) {
                                return match;
                            }
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
                        if(ignoreWhiteSpace) {
                            matchTokenType("WHITESPACE"); // consume any whitespace until the next token
                        }
                        return match;
                    }

                    function consumeUntilWhitespace() {
                        var tokenList = [];
                        ignoreWhiteSpace = false;
                        while (currentToken() && currentToken().type !== "WHITESPACE") {
                            tokenList.push(consumeToken());
                        }
                        ignoreWhiteSpace = true;
                        return tokenList;
                    }

                    function hasMore() {
                        return tokens.length > 0;
                    }

                    function currentToken() {
                        return tokens[0];
                    }

                    return {
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
                        consumeUntilWhitespace: consumeUntilWhitespace
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
                        if (currentChar() === "-" && nextChar() === "-") {
                            consumeComment();
                        } else {
                            if (isWhitespace(currentChar())) {
                                tokens.push(consumeWhitespace());
                            } else if (!possiblePrecedingSymbol() && currentChar() === "." && isAlpha(nextChar())) {
                                tokens.push(consumeClassReference());
                            } else if (!possiblePrecedingSymbol() && currentChar() === "#" && isAlpha(nextChar())) {
                                tokens.push(consumeIdReference());
                            } else if (isAlpha(currentChar()) || isIdentifierChar(currentChar())) {
                                tokens.push(consumeIdentifier());
                            } else if (isNumeric(currentChar())) {
                                tokens.push(consumeNumber());
                            } else if (currentChar() === '"' || currentChar() === "'") {
                                tokens.push(consumeString());
                            } else if (OP_TABLE[currentChar()]) {
                                tokens.push(consumeOp());
                            } else {
                                if (position < source.length) {
                                    throw Error("Unknown token: " + currentChar() + " ");
                                }
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
                        while (isAlpha(currentChar()) || isIdentifierChar(currentChar())) {
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

                    function consumeOp() {
                        var value = consumeChar(); // consume leading char
                        while (currentChar() && OP_TABLE[value + currentChar()]) {
                            value += consumeChar();
                        }
                        var op = makeOpToken(OP_TABLE[value], value);
                        op.value = value;
                        op.end = position;
                        return op;
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
            var _parser = function () {

                var GRAMMAR = {}

                function addGrammarElement(name, definition) {
                    GRAMMAR[name] = definition;
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

                function parseElement(type, tokens, root) {
                    var expressionDef = GRAMMAR[type];
                    if (expressionDef) return expressionDef(_parser, tokens, root);
                }

                function parseAnyOf(types, tokens) {
                    for (var i = 0; i < types.length; i++) {
                        var type = types[i];
                        var expression = parseElement(type, tokens);
                        if (expression) {
                            return expression;
                        }
                    }
                }

                function parseHyperScript(tokens) {
                    return parseElement("hyperscript", tokens)
                }

                function setParent(elt, parent) {
                    if (elt) {
                        elt.parent = parent;
                        setParent(elt.next, parent);
                    }
                }

                return {
                    // parser API
                    setParent: setParent,
                    parseElement: parseElement,
                    parseAnyOf: parseAnyOf,
                    parseHyperScript: parseHyperScript,
                    raiseParseError: raiseParseError,
                    addGrammarElement: addGrammarElement,
                }
            }();

            //====================================================================
            // Runtime
            //====================================================================
            var _runtime = function () {

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

                function forEach(arr, func) {
                    if (arr == null) {
                        // do nothing
                    } else if (arr.length != null) {
                        for (var i = 0; i < arr.length; i++) {
                            func(arr[i]);
                        }
                    } else {
                        func(arr);
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

                function mixedEval(ctx, op) {
                    var args = []
                    var async = false;
                    for (var i = 2; i < arguments.length; i++) {
                        var argument = arguments[i];
                        if (Array.isArray(argument)) {
                            var arr = [];
                            for (var j = 0; j < argument.length; j++) {
                                var element = argument[j];
                                var value = element.evaluate(ctx);
                                if (value.then) {
                                    async = true;
                                }
                                arr.push(value);
                            }
                            args.push(arr);
                        } else {
                            var value = argument.evaluate(ctx);
                            if (value.then) {
                                async = true;
                            }
                            args.push(value);
                        }
                    }
                    if (async) {
                        return new Promise(function(resolve){
                            var linearized = linearize(args);
                            Promise.all(linearized).then(function(values){
                                values = delinearize(values);
                                resolve(op.apply(null, values));
                            })
                        })
                    } else {
                        return op.apply(null, args);
                    }
                }

                function evalTarget(root, path) {
                    if (root == null) {
                        return null;
                    }
                    if (root.length) {
                        var last = root;
                    } else {
                        var last = [root];
                    }

                    while (path.length > 0) {
                        var prop = path.shift();
                        var next = []
                        // flat map
                        for (var i = 0; i < last.length; i++) {
                            var element = last[i];
                            var nextVal = element[prop];
                            if (nextVal && nextVal.length) {
                                next = next.concat(nextVal);
                            } else {
                                next.push(nextVal);
                            }
                        }
                        last = next;
                    }

                    return last;
                }

                var _scriptAttrs = null;
                function getScriptAttributes() {
                    if (_scriptAttrs == null) {
                        _scriptAttrs = _hyperscript.config.attributes.replace(/ /g,'').split(",")
                    }
                    return _scriptAttrs;
                }

                function getScript(elt) {
                    for (var i = 0; i < getScriptAttributes().length; i++) {
                        var scriptAttribute = getScriptAttributes()[i];
                        if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
                            return elt.getAttribute(scriptAttribute)
                        }
                    }
                    if (elt.type === "text/hyperscript") {
                        return elt.innerText;
                    }
                    return null;
                }

                function makeContext(root, elt, event) {
                    var ctx = {
                        meta: {
                            parser: _parser,
                            lexer: _lexer,
                            runtime: _runtime,
                            root: root,
                            iterators: root
                        },
                        me: elt,
                        event: event,
                        detail: event ? event.detail : null,
                        body: 'document' in globalScope ? document.body : null
                    }
                    ctx.meta.ctx = ctx;
                    return ctx;
                }

                function applyEventListeners(hypeScript, elt) {
                    forEach(hypeScript.onFeatures, function (onFeature) {
                        forEach(onFeature.from ? onFeature.from.evaluate({}) : [elt], function(target){
                            target.addEventListener(onFeature.on.evaluate(), function(evt){
                                var ctx = makeContext(onFeature, elt, evt);
                                onFeature.execute(ctx)
                            });
                        })
                    });
                }

                function getScriptSelector() {
                    return getScriptAttributes().map(function (attribute) {
                        return "[" + attribute + "]";
                    }).join(", ");
                }

                function isType(o, type) {
                    return Object.prototype.toString.call(o) === "[object " + type + "]";
                }

                function evaluate(typeOrSrc, srcOrCtx, ctxArg) {
                    if (isType(srcOrCtx, "Object")) {
                        var src = typeOrSrc;
                        var ctx = srcOrCtx;
                        var type = "expression"
                    } else if (isType(srcOrCtx, "String")) {
                        var src = srcOrCtx;
                        var type = typeOrSrc
                        var ctx = ctxArg;
                    } else {
                        var src = typeOrSrc;
                        var ctx = {};
                        var type = "expression";
                    }
                    ctx = ctx || {};
                    var compiled = _parser.parseElement(type, _lexer.tokenize(src) );
                    return compiled.evaluate ? compiled.evaluate(ctx) : compiled.execute(ctx);
                }

                function processNode(elt) {
                    var selector = _runtime.getScriptSelector();
                    if (matchesSelector(elt, selector)) {
                        initElement(elt);
                    }
                    if (elt.querySelectorAll) {
                        forEach(elt.querySelectorAll(selector), function (elt) {
                            initElement(elt, document.body);
                        });
                    }
                    if (elt.type === "text/hyperscript") {
                        initElement(elt, document.body);
                    }
                    if (elt.querySelectorAll) {
                        forEach(elt.querySelectorAll("[type=\'text/hyperscript\']"), function (elt) {
                            initElement(elt, document.body);
                        });
                    }
                }

                function initElement(elt, target) {
                    var internalData = getInternalData(elt);
                    if (!internalData.initialized) {
                        var src = getScript(elt);
                        if (src) {
                            internalData.initialized = true;
                            internalData.script = src;
                            var tokens = _lexer.tokenize(src);
                            var hyperScript = _parser.parseHyperScript(tokens);
                            _runtime.applyEventListeners(hyperScript, target || elt);
                            triggerEvent(target || elt, 'load');
                        }
                    }
                }

                function getInternalData(elt) {
                    var dataProp = 'hyperscript-internal-data';
                    var data = elt[dataProp];
                    if (!data) {
                        data = elt[dataProp] = {};
                    }
                    return data;
                }

                function typeCheck(value, typeString, nullOk) {
                    if (value == null && nullOk) {
                        return value;
                    }
                    var typeName = Object.prototype.toString.call(value).slice(8, -1);
                    var typeCheckValue = value && typeName === typeString;
                    if (typeCheckValue) {
                        return value;
                    } else {
                        throw new Error("Typecheck failed!  Expected: " + typeString + ", Found: " + typeName);
                    }
                }

                function resolveSymbol(str, context) {
                    if (str === "me" || str === "my") {
                        return context["me"];
                    } if (str === "it" || str === "its") {
                        return context["it"];
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

                function next(command, ctx) {
                    if (command) {
                        if (command.handleNext) {
                            command.handleNext(ctx);
                        } else if (command.next) {
                            command.next.execute(ctx);
                        } else {
                            next(command.parent, ctx)
                        }
                    }
                }

                return {
                    typeCheck: typeCheck,
                    forEach: forEach,
                    evalTarget: evalTarget,
                    triggerEvent: triggerEvent,
                    matchesSelector: matchesSelector,
                    getScript: getScript,
                    applyEventListeners: applyEventListeners,
                    processNode: processNode,
                    evaluate: evaluate,
                    getScriptSelector: getScriptSelector,
                    resolveSymbol: resolveSymbol,
                    makeContext: makeContext,
                    next: next,
                    mixedEval: mixedEval
                }
            }();

            //====================================================================
            // Grammar
            //====================================================================
            {
                _parser.addGrammarElement("parenthesized", function (parser, tokens) {
                    if (tokens.matchOpToken('(')) {
                        var expr = parser.parseElement("expression", tokens);
                        tokens.requireOpToken(")");
                        return {
                            type: "parenthesized",
                            expr: expr,
                            evaluate: function (context) {
                                return expr.evaluate(context);
                            }
                        }
                    }
                })

                _parser.addGrammarElement("string", function (parser, tokens) {
                    var stringToken = tokens.matchTokenType('STRING');
                    if (stringToken) {
                        return {
                            type: "string",
                            token: stringToken,
                            evaluate: function (context) {
                                return stringToken.value;
                            }
                        }
                    }
                })

                _parser.addGrammarElement("nakedString", function (parser, tokens) {
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

                _parser.addGrammarElement("number", function (parser, tokens) {
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

                _parser.addGrammarElement("idRef", function (parser, tokens) {
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

                _parser.addGrammarElement("classRef", function (parser, tokens) {
                    var classRef = tokens.matchTokenType('CLASS_REF');
                    if (classRef) {
                        return {
                            type: "classRef",
                            value: classRef.value,
                            className: function () {
                                return this.value.substr(1);
                            },
                            evaluate: function () {
                                return document.querySelectorAll(this.value);
                            }
                        };
                    }
                })

                _parser.addGrammarElement("attributeRef", function (parser, tokens) {
                    if (tokens.matchOpToken("[")) {
                        var name = tokens.matchTokenType("IDENTIFIER");
                        var value = null;
                        if (tokens.matchOpToken("=")) {
                            value = parser.parseElement("expression", tokens);
                        }
                        tokens.requireOpToken("]");
                        return {
                            type: "attribute_expression",
                            name: name.value,
                            value: value,
                            evaluate: function (context) {
                                if (this.value) {
                                    return {name:this.name, value:this.value.evaluate(context)};
                                } else {
                                    return {name:this.name};
                                }
                            }
                        }
                    }
                })

                _parser.addGrammarElement("objectLiteral", function (parser, tokens) {
                    if (tokens.matchOpToken("{")) {
                        var fields = []
                        var valueExpressions = []
                        if (!tokens.matchOpToken("}")) {
                            do {
                                var name = tokens.requireTokenType("IDENTIFIER");
                                tokens.requireOpToken(":");
                                var value = parser.parseElement("expression", tokens);
                                valueExpressions.push(value);
                                fields.push({name: name, value: value});
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken("}");
                        }
                        return {
                            type: "objectLiteral",
                            fields: fields,
                            evaluate: function (context) {
                                var op = function(values){
                                    var returnVal = {};
                                    for (var i = 0; i < values.length; i++) {
                                        var field = fields[i];
                                        returnVal[field.name.value] = values[i];
                                    }
                                    return returnVal;
                                }
                                return _runtime.mixedEval(context, op, valueExpressions)
                            }
                        }
                    }
                })

                _parser.addGrammarElement("namedArgumentList", function (parser, tokens) {
                    if (tokens.matchOpToken("(")) {
                        var fields = []
                        var valueExpressions = []
                        if (!tokens.matchOpToken(")")) {
                            do {
                                var name = tokens.requireTokenType("IDENTIFIER");
                                tokens.requireOpToken(":");
                                var value = parser.parseElement("expression", tokens);
                                valueExpressions.push(value);
                                fields.push({name: name, value: value});
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(")");
                        }
                        return {
                            type: "namedArgumentList",
                            fields: fields,
                            evaluate: function (context) {
                                var op = function(values){
                                    var returnVal = {_namedArgList_:true};
                                    for (var i = 0; i < values.length; i++) {
                                        var field = fields[i];
                                        returnVal[field.name.value] = values[i];
                                    }
                                    return returnVal;
                                }
                                return _runtime.mixedEval(context, op, valueExpressions)
                            }
                        }
                    }


                })

                _parser.addGrammarElement("symbol", function (parser, tokens) {
                    var identifier = tokens.matchTokenType('IDENTIFIER');
                    if (identifier) {
                        return {
                            type: "symbol",
                            name: identifier.value,
                            evaluate: function (context) {
                                return _runtime.resolveSymbol(identifier.value, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("implicitMeTarget", function (parser, tokens) {
                    return {
                        type: "implicitMeTarget",
                        evaluate: function (context) {
                            return context.me
                        }
                    };
                });

                _parser.addGrammarElement("implicitAllTarget", function (parser, tokens) {
                    return {
                        type: "implicitAllTarget",
                        evaluate: function (context) {
                            return document.querySelectorAll("*");
                        }
                    };
                });

                _parser.addGrammarElement("boolean", function (parser, tokens) {
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

                _parser.addGrammarElement("null", function (parser, tokens) {
                    if (tokens.matchToken('null')) {
                        return {
                            type: "null",
                            evaluate: function (context) {
                                return null;
                            }
                        }
                    }
                });

                _parser.addGrammarElement("arrayLiteral", function (parser, tokens) {
                    if (tokens.matchOpToken('[')) {
                        var values = [];
                        if (!tokens.matchOpToken(']')) {
                            do {
                                var expr = parser.parseElement("expression", tokens);
                                if (expr == null) {
                                    parser.raiseParseError(tokens, "Expected an expression");
                                }
                                values.push(expr);
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken("]");
                        }
                        return {
                            type: "arrayLiteral",
                            values: values,
                            evaluate: function (context) {
                                var op = function(values){
                                    return values;
                                }
                                return _runtime.mixedEval(context, op, values);
                            }
                        }
                    }
                });

                _parser.addGrammarElement("blockLiteral", function (parser, tokens) {
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
                        var expr = parser.parseElement("expression", tokens);
                        if (expr == null) {
                            parser.raiseParseError(tokens, "Expected an expression");
                        }
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
                                    return expr.evaluate(ctx)
                                }
                                return returnFunc;
                            }
                        }
                    }
                });

                _parser.addGrammarElement("leaf", function (parser, tokens) {
                    return parser.parseAnyOf(["parenthesized", "boolean", "null", "string", "number", "idRef", "classRef", "symbol", "propertyRef", "objectLiteral", "arrayLiteral", "blockLiteral"], tokens)
                });

                _parser.addGrammarElement("propertyAccess", function (parser, tokens, root) {
                    if (tokens.matchOpToken(".")) {
                        var prop = tokens.requireTokenType("IDENTIFIER");
                        var propertyAccess = {
                            type: "propertyAccess",
                            root: root,
                            prop: prop,
                            evaluate: function (context) {
                                var op = function(rootVal){
                                    return rootVal == null ? null : rootVal[prop.value];
                                }
                                return _runtime.mixedEval(context, op, root)
                            }
                        };
                        return _parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addGrammarElement("functionCall", function (parser, tokens, root) {
                    if (tokens.matchOpToken("(")) {
                        var args = [];
                        if (!tokens.matchOpToken(')')) {
                            do {
                                args.push(parser.parseElement("expression", tokens));
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(")");
                        }
                        var functionCall = {
                            type: "functionCall",
                            root: root,
                            args: args,
                            evaluate: function (ctx) {
                                if (root.root) {
                                    var op = function(thisArg, argVals){
                                        var func = thisArg[root.prop.value];
                                        return func.apply(thisArg, argVals);
                                    }
                                    return _runtime.mixedEval(ctx, op, root.root, args);
                                } else {
                                    var op = function(func, argVals){
                                        var apply = func.apply(null, argVals);
                                        return apply;
                                    }
                                    return _runtime.mixedEval(ctx, op, root, args);
                                }
                            }
                        };
                        return _parser.parseElement("indirectExpression", tokens, functionCall);
                    }
                });

                _parser.addGrammarElement("indirectExpression", function (parser, tokens, root) {
                    var propAccess = parser.parseElement("propertyAccess", tokens, root);
                    if (propAccess) {
                        return propAccess;
                    }

                    var functionCall = parser.parseElement("functionCall", tokens, root);
                    if (functionCall) {
                        return functionCall;
                    }

                    return root;
                });

                _parser.addGrammarElement("primaryExpression", function (parser, tokens) {
                    var leaf = parser.parseElement("leaf", tokens);
                    if (leaf) {
                        return parser.parseElement("indirectExpression", tokens, leaf);
                    }
                    parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
                });

                _parser.addGrammarElement("postfixExpression", function (parser, tokens) {
                    var root = parser.parseElement("primaryExpression", tokens);
                    if (tokens.matchOpToken(":")) {
                        var typeName = tokens.requireTokenType("IDENTIFIER");
                        var nullOk = !tokens.matchOpToken("!");
                        return {
                            type: "typeCheck",
                            typeName: typeName,
                            root: root,
                            nullOk: nullOk,
                            evaluate: function (context) {
                                return _runtime.typeCheck(root.evaluate(context), this.typeName.value, this.nullOk);
                            }
                        }
                    } else {
                        return root;
                    }
                });

                _parser.addGrammarElement("logicalNot", function (parser, tokens) {
                    if (tokens.matchToken("not")) {
                        var root = parser.parseElement("unaryExpression", tokens);
                        return {
                            type: "logicalNot",
                            root: root,
                            evaluate: function (context) {
                                return _runtime.mixedEval(context, function (val) {
                                    return !val;
                                    }, root);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("negativeNumber", function (parser, tokens) {
                    if (tokens.matchOpToken("-")) {
                        var root = parser.parseElement("unaryExpression", tokens);
                        return {
                            type: "negativeNumber",
                            root: root,
                            evaluate: function (context) {
                                return _runtime.mixedEval(context, function(value){
                                    return -1 * value;
                                }, root);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("unaryExpression", function (parser, tokens) {
                    return parser.parseAnyOf(["logicalNot", "negativeNumber", "postfixExpression"], tokens);
                });

                _parser.addGrammarElement("mathOperator", function (parser, tokens) {
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
                            evaluate: function (context) {
                                var theOperator = this.operator;
                                var op = function (lhsVal, rhsVal) {
                                    if (theOperator === "+") {
                                        return lhsVal + rhsVal;
                                    } else if (theOperator === "-") {
                                        return lhsVal - rhsVal;
                                    } else if (theOperator === "*") {
                                        return lhsVal * rhsVal;
                                    } else if (theOperator === "/") {
                                        return lhsVal / rhsVal;
                                    } else if (theOperator === "%") {
                                        return lhsVal % rhsVal;
                                    }
                                };
                                return _runtime.mixedEval(context, op, this.lhs, this.rhs);
                            }
                        }
                        mathOp = tokens.matchAnyOpToken("+", "-", "*", "/", "%")
                    }
                    return expr;
                });

                _parser.addGrammarElement("mathExpression", function (parser, tokens) {
                    return parser.parseAnyOf(["mathOperator", "unaryExpression"], tokens);
                });

                _parser.addGrammarElement("comparisonOperator", function (parser, tokens) {
                    var expr = parser.parseElement("mathExpression", tokens);
                    var comparisonOp, initialComparisonOp = null;
                    comparisonOp = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==")
                    while (comparisonOp) {
                        initialComparisonOp = initialComparisonOp || comparisonOp;
                        if (initialComparisonOp.value !== comparisonOp.value) {
                            parser.raiseParseError(tokens, "You must parenthesize comparison operations with different operators")
                        }
                        var rhs = parser.parseElement("mathExpression", tokens);
                        expr = {
                            type: "comparisonOperator",
                            operator: comparisonOp.value,
                            lhs: expr,
                            rhs: rhs,
                            evaluate: function (context) {
                                var theOperator = this.operator;
                                var op = function (lhsVal, rhsVal) {
                                    if (theOperator === "<") {
                                        return lhsVal < rhsVal;
                                    } else if (theOperator === ">") {
                                        return lhsVal > rhsVal;
                                    } else if (theOperator === "<=") {
                                        return lhsVal <= rhsVal;
                                    } else if (theOperator === ">=") {
                                        return lhsVal >= rhsVal;
                                    } else if (theOperator === "==") {
                                        return lhsVal == rhsVal;
                                    } else if (theOperator === "===") {
                                        return lhsVal === rhsVal;
                                    } else if (theOperator === "!=") {
                                        return lhsVal != rhsVal;
                                    } else if (theOperator === "!==") {
                                        return lhsVal !== rhsVal;
                                    }
                                }
                                return _runtime.mixedEval(context, op, this.lhs, this.rhs);
                            }
                        }
                        comparisonOp = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==")
                    }
                    return expr;
                });

                _parser.addGrammarElement("comparisonExpression", function (parser, tokens) {
                    return parser.parseAnyOf(["comparisonOperator", "mathExpression"], tokens);
                });

                _parser.addGrammarElement("logicalOperator", function (parser, tokens) {
                    var expr = parser.parseElement("comparisonExpression", tokens);
                    var logicalOp, initialLogicalOp = null;
                    logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
                    while (logicalOp) {
                        initialLogicalOp = initialLogicalOp || logicalOp;
                        if (initialLogicalOp.value !== logicalOp.value) {
                            parser.raiseParseError(tokens, "You must parenthesize logical operations with different operators")
                        }
                        var rhs = parser.parseElement("comparisonExpression", tokens);
                        expr = {
                            type: "logicalOperator",
                            operator: logicalOp.value,
                            lhs: expr,
                            rhs: rhs,
                            evaluate: function (context) {
                                var theOperator = this.operator;
                                var op = function (lhsVal, rhsVal) {
                                    if (theOperator === "and") {
                                        return lhsVal && rhsVal;
                                    } else {
                                        return lhsVal || rhsVal;
                                    }
                                };
                                return _runtime.mixedEval(context, op, this.lhs, this.rhs);
                            }
                        }
                        logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
                    }
                    return expr;
                });

                _parser.addGrammarElement("logicalExpression", function (parser, tokens) {
                    return parser.parseAnyOf(["logicalOperator", "mathExpression"], tokens);
                });

                _parser.addGrammarElement("expression", function (parser, tokens) {
                    return parser.parseElement("logicalExpression", tokens);
                });

                _parser.addGrammarElement("target", function (parser, tokens) {
                    var root = parser.parseAnyOf(["symbol", "classRef", "idRef"], tokens);
                    if (root == null) {
                        parser.raiseParseError(tokens, "Expected a valid target expression");
                    }

                    var propPath = []
                    while (tokens.matchOpToken(".")) {
                        propPath.push(tokens.requireTokenType("IDENTIFIER").value)
                    }

                    return {
                        type: "target",
                        propPath: propPath,
                        root: root,
                        evaluate: function (ctx) {
                            var op = function(targetRoot) {
                                return _runtime.evalTarget(targetRoot, propPath);
                            }
                            return _runtime.mixedEval(ctx, op, root);
                        }
                    };
                });

                _parser.addGrammarElement("command", function (parser, tokens) {
                    return parser.parseAnyOf(["addCmd", "removeCmd", "toggleCmd", "waitCmd", "returnCmd", "sendCmd", "triggerCmd",
                        "takeCmd", "logCmd", "callCmd", "putCmd", "setCmd", "ifCmd", "forCmd", "fetchCmd"], tokens);
                })

                _parser.addGrammarElement("commandList", function (parser, tokens) {
                    var cmd = parser.parseElement("command", tokens);
                    if (cmd) {
                        tokens.matchToken("then");
                        cmd.next = parser.parseElement("commandList", tokens);
                        return cmd;
                    }
                })

                _parser.addGrammarElement("hyperscript", function (parser, tokens) {
                    var onFeatures = []
                    var functionFeatures = []
                    var workerFeatures = []
                    do {
                        var feature = parser.parseElement("feature", tokens);
                        if (feature == null) {
                            parser.raiseParseError("Unexpected feature type : " + tokens.currentToken());
                        }
                        if (feature.type === "onFeature") {
                            onFeatures.push(feature);
                        } else if(feature.type === "functionFeature") {
                            feature.execute();
                            functionFeatures.push(feature);
                        } else if (feature.type === "workerFeature") {
                            workerFeatures.push(feature);
                            feature.execute();
                        }
                    } while (tokens.matchToken("end") && tokens.hasMore())
                    if (tokens.hasMore()) {
                        parser.raiseParseError(tokens);
                    }
                    return {
                        type: "hyperscript",
                        onFeatures: onFeatures,
                        functions: functionFeatures,
                        workers: workerFeatures,
                        execute: function () {
                            // no op
                        }
                    };
                })

                _parser.addGrammarElement("feature", function (parser, tokens) {
                    return parser.parseAnyOf([
                        "onFeature",
                        "functionFeature",
                        "workerFeature",
                    ], tokens);
                })

                _parser.addGrammarElement("onFeature", function (parser, tokens) {
                    if (tokens.matchToken("on")) {
                        var on = parser.parseElement("dotOrColonPath", tokens);
                        if (on == null) {
                            parser.raiseParseError(tokens, "Expected event name")
                        }

                        var filter = null;
                        if (tokens.matchOpToken('[')) {
                            filter = parser.parseElement("expression", tokens);
                            tokens.requireOpToken(']');
                        }

                        var args = [];
                        if (tokens.matchOpToken("(")) {
                            do {
                                args.push(tokens.requireTokenType('IDENTIFIER'));
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(')')
                        }

                        var from = null;
                        if (tokens.matchToken("from")) {
                            from = parser.parseElement("target", tokens);
                            if (from == null) {
                                parser.raiseParseError(tokens, "Expected target value")
                            }
                        }

                        var start = parser.parseElement("commandList", tokens);
                        var onFeature = {
                            type: "onFeature",
                            args: args,
                            on: on,
                            from: from,
                            filter: filter,
                            start: start,
                            execute: function (ctx) {
                                if(filter) {
                                    var initialCtx = ctx.meta.context;
                                    ctx.meta.context = ctx.event;
                                    try {
                                        var value = filter.evaluate(ctx);
                                        if (value) {
                                            // match the javascript semantics for if statements
                                        } else {
                                            return;
                                        }
                                    } finally {
                                        ctx.meta.context = initialCtx;
                                    }
                                }
                                _runtime.forEach(args, function (arg) {
                                    ctx[arg.value] = ctx.event[arg.value] || (ctx.event.detail ? ctx.event.detail[arg.value] : null);
                                });
                                start.execute(ctx);
                            }
                        };
                        parser.setParent(start, onFeature);
                        return onFeature;
                    }
                });

                _parser.addGrammarElement("functionFeature", function (parser, tokens) {
                    if (tokens.matchToken('def')) {
                        var functionName = parser.parseElement("dotOrColonPath", tokens);
                        var nameVal = functionName.evaluate();
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
                        var functionFeature = {
                            type: "functionFeature",
                            name: funcName,
                            args: args,
                            start: start,
                            execute: function (ctx) {
                                assignToNamespace(nameSpace, funcName, function() {
                                    // null, worker
                                    var root = 'document' in globalScope ? document.body : null
                                    var elt = 'document' in globalScope ? document.body : globalScope
                                    var ctx = _runtime.makeContext(root, elt, null);
                                    for (var i = 0; i < arguments.length; i++) {
                                        var argumentVal = arguments[i];
                                        var name = args[i];
                                        if (name) {
                                            ctx[name.value] = argumentVal;
                                        }
                                    }
                                    var resolve = null;
                                    var promise = new Promise(function(returnCall){
                                        resolve = returnCall;
                                    });
                                    start.execute(ctx);
                                    if (ctx.meta.returned) {
                                        return ctx.meta.returnValue;
                                    } else {
                                        ctx.meta.resolve = resolve;
                                        return promise
                                    }
                                });
                            }
                        };

                        var end = start;
                        while (end.next) {
                            end = end.next;
                        }
                        end.next = {
                            type: "implicitReturn",
                            execute: function (ctx) {
                                // automatically return at the end of the function if nothing else does
                                ctx.meta.returned = true;
                                if(ctx.meta.resolve){
                                    ctx.meta.resolve();
                                }
                            }
                        }

                        parser.setParent(start, functionFeature);
                        return functionFeature;
                    }
                });

                // Stuff for workers

                if ('document' in globalScope) var currentScriptSrc = document.currentScript.src;
                var invocationIdCounter = 0

                function workerFunc() {
                    /* WORKER BOUNDARY */
                    self.onmessage = function (e) {
                        switch (e.data.type) {
                        case 'init':
                            importScripts(e.data._hyperscript);
                            importScripts.apply(self, e.data.extraScripts);
                            var tokens = _hyperscript.lexer.makeTokensObject(e.data.tokens, [], '');
                            
                            // this is so hacky
                            self.window = {};
                            var parsed = _hyperscript.parser.parseElement('hyperscript', tokens);
                            self.functions = self.window;
                            delete self.window;

                            postMessage({ type: 'didInit' });
                            break;
                        case 'call':
                            try {
                                var result = self.functions[e.data.function].apply(self, e.data.args)
                                Promise.resolve(result).then(function(value) {
                                    postMessage({
                                        type: 'resolve',
                                        id: e.data.id,
                                        value: value
                                    })
                                })
                            } catch (error) {
                                postMessage({
                                    type: 'reject',
                                    id: e.data.id,
                                    error: error.toString()
                                })
                            }
                            break;
                        }
                    }
                    /* WORKER BOUNDARY */
                }

                _parser.addGrammarElement("workerFeature", function(parser, tokens) {
                    if (tokens.matchToken('worker')) {
                        var name = parser.parseElement("dotOrColonPath", tokens);
                        var qualifiedName = name.evaluate();
                        var nameSpace = qualifiedName.split(".");
                        var workerName = nameSpace.pop();

                        // Parse extra scripts
                        var extraScripts = [];
                        if (tokens.matchOpToken("(")) {
                            if (tokens.matchOpToken(")")) {
                                // no external scripts
                            } else {
                                do {
                                    var extraScript = tokens.requireTokenType('STRING').value;
                                    var absoluteUrl = new URL(extraScript, location.href).href;
                                    extraScripts.push(absoluteUrl);
                                } while (tokens.matchOpToken(","));
                                tokens.requireOpToken(')');
                            }
                        }

                        // Consume worker methods

                        var funcNames = [];
                        var bodyStartIndex = tokens.consumed.length;
                        var bodyEndIndex = tokens.consumed.length;
                        do {
                            var functionFeature = parser.parseElement('functionFeature', tokens);
                            if (functionFeature) {
                                funcNames.push(functionFeature.name);
                                bodyEndIndex = tokens.consumed.length;
                            } else break;
                        } while (tokens.matchToken("end") && tokens.hasMore()); // worker end


                        var bodyTokens = tokens.consumed.slice(bodyStartIndex, bodyEndIndex + 1);

                        // Create worker

                        // extract the body of the function, which was only defined so
                        // that we can get syntax highlighting
                        var workerCode = workerFunc.toString().split('/* WORKER BOUNDARY */')[1];
                        var blob = new Blob([workerCode], { type: 'text/javascript' });
                        var worker = new Worker(URL.createObjectURL(blob));

                        // Send init message to worker

                        worker.postMessage({
                            type: 'init',
                            _hyperscript: currentScriptSrc,
                            extraScripts: extraScripts,
                            tokens: bodyTokens
                        });

                        var workerPromise = new Promise(function (resolve, reject) {
                            worker.addEventListener('message', function(e) {
                                if (e.data.type === 'didInit') resolve();
                            }, { once: true });
                        });

                        // Create function stubs
                        var stubs = {};
                        funcNames.forEach(function(funcName) {
                            stubs[funcName] = function() {
                                var args = arguments;
                                return new Promise(function (resolve, reject) {
                                    var id = invocationIdCounter++;
                                    worker.addEventListener('message', function returnListener(e) {
                                        if (e.data.id !== id) return;
                                        worker.removeEventListener('message', returnListener);
                                        if (e.data.type === 'resolve') resolve(e.data.value);
                                        else reject(e.data.error);
                                    });
                                    workerPromise.then(function () {
                                        // Worker has been initialized, send invocation.
                                        worker.postMessage({
                                            type: 'call',
                                            function: funcName,
                                            args: Array.from(args),
                                            id: id
                                        });
                                    });
                                });
                            };
                        });

                        return {
                            type: 'workerFeature',
                            name: workerName,
                            worker: worker,
                            execute: function (ctx) {
                                assignToNamespace(nameSpace, workerName, stubs)
                            }
                        };
                    }
                })

                _parser.addGrammarElement("addCmd", function (parser, tokens) {
                    if (tokens.matchToken("add")) {
                        var classRef = parser.parseElement("classRef", tokens);
                        var attributeRef = null;
                        if (classRef == null) {
                            attributeRef = parser.parseElement("attributeRef", tokens);
                            if (attributeRef == null) {
                                parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                            }
                        }

                        if (tokens.matchToken("to")) {
                            var to = parser.parseElement("target", tokens);
                        } else {
                            var to = parser.parseElement("implicitMeTarget");
                        }

                        var addCmd = {
                            type: "addCmd",
                            classRef: classRef,
                            attributeRef: attributeRef,
                            to: to,
                            execute: function (ctx) {
                                if (this.classRef) {
                                    _runtime.forEach(to.evaluate(ctx), function(target){
                                        target.classList.add(classRef.className());
                                    })
                                } else {
                                    _runtime.forEach(to.evaluate(ctx), function(target){
                                        target.setAttribute(attributeRef.name, attributeRef.evaluate(ctx).value);
                                    })
                                }
                                _runtime.next(addCmd, ctx);
                            }
                        };
                        return addCmd
                    }
                });

                _parser.addGrammarElement("removeCmd", function (parser, tokens) {
                    if (tokens.matchToken("remove")) {
                        var classRef = parser.parseElement("classRef", tokens);
                        var attributeRef = null;
                        var elementExpr = null;
                        if (classRef == null) {
                            attributeRef = parser.parseElement("attributeRef", tokens);
                            if (attributeRef == null) {
                                elementExpr = parser.parseElement("expression", tokens)
                                if (elementExpr == null) {
                                    parser.raiseParseError(tokens, "Expected either a class reference, attribute expression or value expression");
                                }
                            }
                        }
                        if (tokens.matchToken("from")) {
                            var from = parser.parseElement("target", tokens);
                        } else {
                            var from = parser.parseElement("implicitMeTarget");
                        }

                        var removeCmd = {
                            type: "removeCmd",
                            classRef: classRef,
                            attributeRef: attributeRef,
                            elementExpr: elementExpr,
                            from: from,
                            execute: function (ctx) {
                                {
                                    if (elementExpr) {
                                        _runtime.forEach(elementExpr.evaluate(ctx), function (target) {
                                            target.parentElement.removeChild(target);
                                        });
                                    } else {
                                        if (classRef) {
                                            _runtime.forEach(from.evaluate(ctx), function(target){
                                                target.classList.remove(classRef.className());
                                            })
                                        } else {
                                            _runtime.forEach(from.evaluate(ctx), function(target){
                                                target.removeAttribute(attributeRef.name);
                                            })
                                        }
                                    }
                                    _runtime.next(removeCmd, ctx);
                                }
                            }
                        };
                        return removeCmd
                    }
                });

                _parser.addGrammarElement("toggleCmd", function (parser, tokens) {
                    if (tokens.matchToken("toggle")) {
                        var classRef = parser.parseElement("classRef", tokens);
                        var attributeRef = null;
                        if (classRef == null) {
                            attributeRef = parser.parseElement("attributeRef", tokens);
                            if (attributeRef == null) {
                                parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                            }
                        }
                        if (tokens.matchToken("on")) {
                            var on = parser.parseElement("target", tokens);
                        } else {
                            var on = parser.parseElement("implicitMeTarget");
                        }
                        var toggleCmd = {
                            type: "toggleCmd",
                            classRef: classRef,
                            attributeRef: attributeRef,
                            on: on,
                            execute: function (ctx) {
                                if (this.classRef) {
                                    _runtime.forEach( on.evaluate(ctx), function (target) {
                                        target.classList.toggle(classRef.className())
                                    });
                                } else {
                                    _runtime.forEach( on.evaluate(ctx), function (target) {
                                        if(target.hasAttribute(attributeRef.name )) {
                                            target.removeAttribute( attributeRef.name );
                                        } else {
                                            target.setAttribute(attributeRef.name, attributeRef.value.evaluate(ctx))
                                        }
                                    });
                                }
                                _runtime.next(toggleCmd, ctx);
                            }
                        };
                        return toggleCmd
                    }
                })

                _parser.addGrammarElement("waitCmd", function (parser, tokens) {
                    if (tokens.matchToken("wait")) {

                        // wait on event
                        if (tokens.matchToken("for")) {
                            var evt = parser.parseElement("dotOrColonPath", tokens);
                            if (evt == null) {
                                parser.raiseParseError(tokens, "Expected event name")
                            }
                            if (tokens.matchToken("from")) {
                                var on = parser.parseElement("expression", tokens);
                            }
                            // wait on event
                            var waitCmd = {
                                type: "waitCmd",
                                event: evt,
                                on: on,
                                execute: function (ctx) {
                                    var eventName = evt.evaluate(ctx);
                                    var target = on ? on.evaluate(ctx) : ctx['me'];
                                    var listener = function(){
                                        target.removeEventListener(eventName, listener);
                                        _runtime.next(waitCmd, ctx);
                                    };
                                    target.addEventListener(eventName, listener)
                                }
                            };
                        } else {
                            var time = parser.parseElement("expression", tokens);
                            var factor = 1;
                            if (tokens.matchToken("s") || tokens.matchToken("seconds")) {
                                factor = 1000;
                            } else if (tokens.matchToken("ms") || tokens.matchToken("milliseconds")) {
                                // do nothing
                            }
                            var waitCmd = {
                                type: "waitCmd",
                                time: time,
                                execute: function (ctx) {
                                    setTimeout(function () {
                                        _runtime.next(waitCmd, ctx);
                                    }, time.evaluate(ctx) * factor);
                                }
                            };
                        }
                        return waitCmd
                    }
                })

                // TODO  - colon path needs to eventually become part of ruby-style symbols
                _parser.addGrammarElement("dotOrColonPath", function (parser, tokens) {
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

                _parser.addGrammarElement("sendCmd", function (parser, tokens) {
                    if (tokens.matchToken("send")) {

                        var eventName = parser.parseElement("dotOrColonPath", tokens);

                        var details = parser.parseElement("namedArgumentList", tokens);
                        if (tokens.matchToken("to")) {
                            var to = parser.parseElement("target", tokens);
                        } else {
                            var to = parser.parseElement("implicitMeTarget");
                        }


                        var sendCmd = {
                            type: "sendCmd",
                            eventName: eventName,
                            details: details,
                            to: to,
                            execute: function (ctx) {
                                _runtime.forEach(to.evaluate(ctx), function (target) {
                                    _runtime.triggerEvent(target, eventName.evaluate(ctx), details ? details.evaluate(ctx) : {});
                                });
                                _runtime.next(sendCmd, ctx);
                            }
                        };
                        return sendCmd
                    }
                })

                _parser.addGrammarElement("returnCmd", function (parser, tokens) {
                    if (tokens.matchToken("return")) {

                        var value = parser.parseElement("expression", tokens);

                        var returnCmd = {
                            type: "returnCmd",
                            value: value,
                            execute: function (ctx) {
                                var resolve = ctx.meta.resolve;
                                ctx.meta.returned = true;
                                if (resolve) {
                                    if (value) {
                                        resolve(value.evaluate(ctx));
                                    } else {
                                        resolve()
                                    }
                                } else {
                                    ctx.meta.returned = true;
                                    ctx.meta.returnValue = value.evaluate(ctx);
                                }
                            }
                        };
                        return returnCmd
                    }
                })

                _parser.addGrammarElement("triggerCmd", function (parser, tokens) {
                    if (tokens.matchToken("trigger")) {

                        var eventName = parser.parseElement("dotOrColonPath", tokens);
                        var details = parser.parseElement("namedArgumentList", tokens);

                        var triggerCmd = {
                            type: "triggerCmd",
                            eventName: eventName,
                            details: details,
                            execute: function (ctx) {
                                _runtime.triggerEvent(_runtime.resolveSymbol("me", ctx), eventName.evaluate(ctx) ,details ? details.evaluate(ctx) : {});
                                _runtime.next(triggerCmd, ctx);
                            }
                        };
                        return triggerCmd
                    }
                })

                _parser.addGrammarElement("takeCmd", function (parser, tokens) {
                    if (tokens.matchToken("take")) {
                        var classRef = tokens.requireTokenType(tokens, "CLASS_REF");

                        if (tokens.matchToken("from")) {
                            var from = parser.parseElement("target", tokens);
                        } else {
                            var from = parser.parseElement("implicitAllTarget")
                        }

                        if (tokens.matchToken("for")) {
                            var forElt = parser.parseElement("target", tokens);
                        } else {
                            var forElt = parser.parseElement("implicitMeTarget")
                        }

                        var takeCmd = {
                            type: "takeCmd",
                            classRef: classRef,
                            from: from,
                            forElt: forElt,
                            execute: function (ctx) {
                                // TODO - expression?
                                var clazz = this.classRef.value.substr(1)
                                _runtime.forEach(from.evaluate(ctx), function(target){
                                    target.classList.remove(clazz);
                                })
                                _runtime.forEach(forElt.evaluate(ctx), function(target){
                                    target.classList.add(clazz);
                                });
                                _runtime.next(takeCmd, ctx);
                            }
                        };
                        return takeCmd
                    }
                })

                _parser.addGrammarElement("logCmd", function (parser, tokens) {
                    if (tokens.matchToken("log")) {
                        var exprs = [parser.parseElement("expression", tokens)];
                        while (tokens.matchOpToken(",")) {
                            exprs.push(parser.parseElement("expression", tokens));
                        }
                        if (tokens.matchToken("with")) {
                            var withExpr = parser.parseElement("expression", tokens);
                        }
                        var logCmd = {
                            type: "logCmd",
                            exprs: exprs,
                            withExpr: withExpr,
                            execute: function (ctx) {
                                if (withExpr) {
                                    withExpr.evaluate(ctx).apply(null, exprs.map(function (expr) {
                                        return expr.evaluate(ctx)
                                    }));
                                } else {
                                    console.log.apply(null, exprs.map(function (expr) {
                                        return expr.evaluate(ctx)
                                    }));
                                }
                                _runtime.next(logCmd, ctx);
                            }
                        };
                        return logCmd;
                    }
                })

                _parser.addGrammarElement("callCmd", function (parser, tokens) {
                    if (tokens.matchToken("call") || tokens.matchToken("get")) {
                        var expr = parser.parseElement("expression", tokens);
                        var callCmd = {
                            type: "callCmd",
                            expr: expr,
                            execute: function (ctx) {
                                var it = expr.evaluate(ctx);
                                if (it && it.then) {
                                    it.then(function (value) {
                                        ctx.it = value;
                                        _runtime.next(callCmd, ctx);
                                    })
                                } else {
                                    ctx.it = it;
                                    _runtime.next(callCmd, ctx);
                                }
                            }
                        };
                        return callCmd
                    }
                })

                _parser.addGrammarElement("putCmd", function (parser, tokens) {
                    if (tokens.matchToken("put")) {

                        var value = parser.parseElement("expression", tokens);

                        var operation = tokens.matchToken("into") ||
                            tokens.matchToken("before") ||
                            tokens.matchToken("after");

                        if (operation == null && tokens.matchToken("at")) {
                            operation = tokens.matchToken("start") ||
                                tokens.matchToken("end");
                            tokens.requireToken("of");
                        }

                        if (operation == null) {
                            parser.raiseParseError(tokens, "Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
                        }
                        var target = parser.parseElement("target", tokens);

                        var op = operation.value;
                        var directWrite = target.propPath.length === 0 && op === "into";
                        var symbolWrite = directWrite && target.root.type === "symbol";
                        if (directWrite && !symbolWrite) {
                            parser.raiseParseError(tokens, "Can only put directly into symbols, not references")
                        }

                        var putter = function(valueToPut, ctx){
                            if (symbolWrite) {
                                ctx[target.root.name] = valueToPut;
                            } else {
                                if (op === "into") {
                                    var lastProperty = target.propPath.slice(-1); // steal last property for assignment
                                    _runtime.forEach(_runtime.evalTarget(target.root.evaluate(ctx), target.propPath.slice(0, -1)), function(target){
                                        target[lastProperty] = valueToPut;
                                    })
                                } else if (op === "before") {
                                    _runtime.forEach(_runtime.evalTarget(target.root.evaluate(ctx), target.propPath), function(target){
                                        target.insertAdjacentHTML('beforebegin', valueToPut);
                                    })
                                } else if (op === "start") {
                                    _runtime.forEach(_runtime.evalTarget(target.root.evaluate(ctx), target.propPath), function(target){
                                        target.insertAdjacentHTML('afterbegin', valueToPut);
                                    })
                                } else if (op === "end") {
                                    _runtime.forEach(_runtime.evalTarget(target.root.evaluate(ctx), target.propPath), function(target){
                                        target.insertAdjacentHTML('beforeend', valueToPut);
                                    })
                                } else if (op === "after") {
                                    _runtime.forEach(_runtime.evalTarget(target.root.evaluate(ctx), target.propPath), function(target){
                                        target.insertAdjacentHTML('afterend', valueToPut);
                                    })
                                }
                            }
                            _runtime.next(putCmd, ctx);
                        }

                        var putCmd = {
                            type: "putCmd",
                            target: target,
                            op: op,
                            symbolWrite: symbolWrite,
                            value: value,
                            execute: function (ctx) {
                                var valueToPut = value.evaluate(ctx);
                                if (valueToPut.then) {
                                    valueToPut.then(function(finalValue){
                                        putter(finalValue, ctx);
                                    })
                                } else {
                                    putter(valueToPut, ctx);
                                }
                            }
                        };
                        return putCmd
                    }
                })

                _parser.addGrammarElement("setCmd", function (parser, tokens) {
                    if (tokens.matchToken("set")) {

                        var target = parser.parseElement("target", tokens);

                        tokens.requireToken("to");

                        var value = parser.parseElement("expression", tokens);

                        var directWrite = target.propPath.length === 0;
                        var symbolWrite = directWrite && target.root.type === "symbol";
                        if (directWrite && !symbolWrite) {
                            parser.raiseParseError(tokens, "Can only put directly into symbols, not references")
                        }

                        var setter = function(valueToSet, ctx) {
                            if (symbolWrite) {
                                ctx[target.root.name] = valueToSet;
                            } else {
                                var lastProperty = target.propPath.slice(-1); // steal last property for assignment
                                _runtime.forEach(_runtime.evalTarget(target.root.evaluate(ctx), target.propPath.slice(0, -1)), function (target) {
                                    target[lastProperty] = valueToSet;
                                })
                            }
                            _runtime.next(setCmd, ctx);
                        }

                        var setCmd = {
                            type: "setCmd",
                            target: target,
                            symbolWrite: symbolWrite,
                            value: value,
                            execute: function (ctx) {
                                var valueToSet = value.evaluate(ctx);
                                if (valueToSet.then) {
                                    valueToSet.then(function(finalValue){
                                        setter(finalValue, ctx);
                                    })
                                } else {
                                    setter(valueToSet, ctx);
                                }
                            }
                        };
                        return setCmd
                    }
                })

                _parser.addGrammarElement("ifCmd", function (parser, tokens) {
                    if (tokens.matchToken("if")) {
                        var expr = parser.parseElement("expression", tokens);
                        tokens.matchToken("then"); // optional 'then'
                        var trueBranch = parser.parseElement("commandList", tokens);
                        if (tokens.matchToken("else")) {
                            var falseBranch = parser.parseElement("commandList", tokens);
                        }
                        if (tokens.hasMore()) {
                            tokens.requireToken("end");
                        }
                        var ifCmd = {
                            type: "ifCmd",
                            expr: expr,
                            trueBranch: trueBranch,
                            falseBranch: falseBranch,
                            execute: function (ctx) {
                                if(expr.evaluate(ctx)) {
                                    trueBranch.execute(ctx);
                                } else if(falseBranch) {
                                    falseBranch.execute(ctx);
                                } else {
                                    _runtime.next(ifCmd, ctx);
                                }
                            }
                        };
                        parser.setParent(trueBranch, ifCmd);
                        parser.setParent(falseBranch, ifCmd);
                        return ifCmd
                    }
                })

                _parser.addGrammarElement("forCmd", function (parser, tokens) {
                    if (tokens.matchToken("for")) {
                        var identifier = tokens.requireTokenType('IDENTIFIER');
                        tokens.matchToken("in"); // optional 'then'
                        var expression = parser.parseElement("expression", tokens);
                        var loop = parser.parseElement("commandList", tokens);
                        if (tokens.hasMore()) {
                            tokens.requireToken("end");
                        }
                        var forCmd = {
                            type: "forCmd",
                            identifier: identifier.value,
                            expression: expression,
                            loop: loop,
                            execute: function (ctx) {
                                ctx.meta.iterators[identifier.value] = {
                                    index: 0,
                                    value: expression.evaluate(ctx)
                                };
                                forCmd.handleNext(ctx);
                            },
                            handleNext: function (ctx) {
                                var iterator = ctx.meta.iterators[identifier.value];
                                if (iterator.value === null ||
                                    iterator.index >= iterator.value.length) {
                                    if (forCmd.next) {
                                        forCmd.next.execute(ctx);
                                    } else {
                                        _runtime.next(forCmd.parent, ctx)
                                    }
                                } else {
                                    ctx[identifier.value] = iterator.value[iterator.index];
                                    iterator.index++;
                                    loop.execute(ctx);
                                }
                            }
                        };
                        parser.setParent(loop, forCmd);
                        return forCmd
                    }
                })

                _parser.addGrammarElement("fetchCmd", function (parser, tokens) {
                    if (tokens.matchToken("fetch")) {
                        var url = parser.parseElement("string", tokens);
                        if (url == null) {
                            var url = parser.parseElement("nakedString", tokens);
                        }
                        if (url == null) {
                            parser.raiseParseError(tokens, "Expected a URL");
                        }

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

                        var fetchCmd = {
                            type: "fetchCmd",
                            execute: function (ctx) {
                                fetch(url.evaluate(ctx), args ? args.evaluate(ctx) : null)
                                    .then(function (value) {
                                        if (type === "response") {
                                            ctx.it = value;
                                            _runtime.next(fetchCmd, ctx);
                                        } else if (type === "json") {
                                            value.json().then(function(result){
                                                ctx.it = result;
                                                _runtime.next(fetchCmd, ctx);
                                            })
                                        } else {
                                            value.text().then(function(result){
                                                ctx.it = result;
                                                _runtime.next(fetchCmd, ctx);
                                            })
                                        }
                                    })
                                    .catch(function(reason){
                                        _runtime.triggerEvent(ctx.me, "fetch:error", {
                                            reason: reason
                                        })
                                    })
                            }
                        };
                        return fetchCmd;
                    }
                })
            }

            //====================================================================
            // API
            //====================================================================

            function processNode(elt) {
                _runtime.processNode(elt);
            }

            function evaluate(str) {
                return _runtime.evaluate(str);
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

            function compileToJS(str) {
                var tokens = _lexer.tokenize(str);
                var hyperScript = _parser.parseHyperScript(tokens);
                return _parser.transpile(hyperScript);
            }

            if ('document' in globalScope) {
                ready(function () {
                    mergeMetaConfig();
                    processNode(document.body);
                    document.addEventListener("htmx:load", function(evt){
                        processNode(evt.detail.elt);
                    })
                })
            }

            /* Public API */
            return {
                lexer: _lexer,
                parser: _parser,
                runtime: _runtime,
                evaluate: evaluate,
                processNode: processNode,
                toJS: compileToJS,
                config: {
                    attributes : "_, script, data-script"
                }
            }
        }
    )()
}));