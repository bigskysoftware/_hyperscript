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
        // Runtime
        //-----------------------------------------------

        function makeEvalAction(elt, actionList) {
            return function () {
                evalActionList(elt, actionList.slice(0));
            };
        }

        function evalActionList(elt, actionList) {
            if (actionList.length > 0) {
                var action = actionList.shift();
                if (action.operation.type === "wait") {
                    setTimeout(function(){
                        evalActionList(elt, actionList);
                    }, action.operation.time);
                } else {
                    evalAction(elt, action);
                    evalActionList(elt, actionList);
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

        function evalAction(elt, action) {
            if (action.operation.on) {
                var targets = document.querySelectorAll(action.operation.on.value);
            } else {
                var targets = [elt];
            }
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                if (action.operation.type === "add") {
                    if (action.operation.attribute.name === "class") {
                        target.classList.add(action.operation.attribute.value);
                    } else {
                        // TODO handle styles
                        target.setAttribute(action.operation.attribute.name, action.operation.attribute.value)
                    }
                } else if (action.operation.type === "remove") {
                    if (action.operation.attribute.name === "class") {
                        target.classList.remove(action.operation.attribute.value);
                    } else {
                        // TODO handle styles
                        target.removeAttribute(action.operation.attribute.name)
                    }
                } else if (action.operation.type === "toggle") {
                    if (action.operation.attribute.name === "class") {
                        // TODO handle styles
                        target.classList.toggle(action.operation.attribute.value);
                    } else {
                    }
                } else if (action.operation.type === "call") {
                    evalJavascriptInContext(action.operation.expr, elt);
                } else if (action.operation.type === "send") {
                    triggerEvent(target, action.operation.name);
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

        function parseAddExpr(tokens) {
            if (match(tokens, "add")) {
                return {
                    type: "add",
                    attribute: parseAttributeExpression(tokens.shift()),
                    on: parseToExpression(tokens)
                }
            }
        }

        function parseRemoveExpr(tokens) {
            if (match(tokens, "remove")) {
                return {
                    type: "remove",
                    attribute: parseAttributeExpression(tokens.shift()),
                    on: parseFromExpression(tokens)
                }
            }
        }

        function parseToggleExpr(tokens) {
            if (match(tokens, "toggle")) {
                return {
                    type: "toggle",
                    attribute: parseAttributeExpression(tokens.shift()),
                    on: parseOnExpression(tokens)
                }
            }
        }

        function parseCallExpr(tokens) {
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

        function parseWaitExpr(tokens) {
            if (match(tokens, "wait")) {
                return {
                    type: "wait",
                    time: parseInterval(tokens.shift())
                }
            }
        }

        function parseSendExpr(tokens) {
            if (match(tokens, "send")) {
                return {
                    type: "send",
                    name: tokens.shift(),
                    on: parseToExpression(tokens)
                }
            }
        }

        function parseOperationExpression(tokens) {
            var expr = parseAddExpr(tokens);
            if(expr) return expr;

            expr = parseRemoveExpr(tokens);
            if(expr) return expr;

            expr = parseToggleExpr(tokens);
            if(expr) return expr;

            expr = parseCallExpr(tokens);
            if(expr) return expr;

            expr = parseWaitExpr(tokens);
            if(expr) return expr;

            expr = parseSendExpr(tokens);
            if(expr) return expr;
        }

        function parseAction(tokens) {
            return {
                type:"action",
                operation:parseOperationExpression(tokens),
            }
        }

        function parseActionList(tokens) {
            var actionList = {
                type: "action_list",
                on: parseOnExpression(tokens),
                actions: []
            }
            do {
                actionList.actions.push(parseAction(tokens));
            } while (match(tokens, "then"))
            return actionList;
        }

        function parseHypeScript(tokens) {
            var hypeScript = {
                type: "hype_script",
                actionLists: []
            }
            do {
                hypeScript.actionLists.push(parseActionList(tokens));
            } while (match(tokens, "and"))
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
                elt.addEventListener(event, makeEvalAction(elt, actionList.actions))
            }
        }

        function getHyped(elt) {
            if (elt) {
                var hypeScript = elt.getAttribute("_")
                    || elt.getAttribute("hypescript")
                    || elt.getAttribute("data-hypescript");
                if (hypeScript) {
                    var hypeScript = parse(hypeScript);

                    applyHypeScript(hypeScript, elt);
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
            getHyped:getHyped
        }
    }
)()}));