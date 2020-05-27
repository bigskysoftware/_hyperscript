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

        //-----------------------------------------------
        // Eval
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

        function evalAction(elt, action) {
            if (action.operation.on) {
                var targets = document.querySelectorAll(action.operation.on.value);
            } else {
                var targets = [elt];
            }
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                if (action.operation.type === "add") {
                    target.classList.add(action.operation.value);
                } else if (action.operation.type === "remove") {
                    target.classList.remove(action.operation.value);
                } else if (action.operation.type === "toggle") {
                    target.classList.toggle(action.operation.value);
                } else if (action.operation.type === "call") {
                    evalJavascriptInContext(action.operation.expr, elt);
                }
            }
        }

        //-----------------------------------------------
        // Parser
        //-----------------------------------------------

        function parseOnExpression(tokens) {
            if (match(tokens,"on")) {
                return {
                    type: "on",
                    value: tokens.shift()
                }
            }
        }

        function parseAddExpr(tokens) {
            if (match(tokens, "add")) {
                return {
                    type: "add",
                    value: tokens.shift(),
                    on: parseOnExpression(tokens)
                }
            }
        }

        function parseRemoveExpr(tokens) {
            if (match(tokens, "remove")) {
                return {
                    type: "remove",
                    value: tokens.shift(),
                    on: parseOnExpression(tokens)
                }
            }
        }

        function parseToggleExpr(tokens) {
            if (match(tokens, "toggle")) {
                return {
                    type: "toggle",
                    value: tokens.shift(),
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
        }

        function parseAction(tokens) {
            return {
                type:"action",
                operation:parseOperationExpression(tokens),
            }
        }

        function parseHyperScript(tokens) {
            var hyperScript = {
                on:parseOnExpression(tokens),
                actions: []
            }
            do {
                hyperScript.actions.push(parseAction(tokens));
            } while (match(tokens, "then"))
            return hyperScript;
        }

        //-----------------------------------------------
        // API
        //-----------------------------------------------
        function parse(string) {
            var tokens = splitOnWhitespace(string);
            return parseHyperScript(tokens);
        }

        function getHyped(elt) {
            if (elt) {
                var hypeScript = elt.getAttribute("_")
                    || elt.getAttribute("hypescript")
                    || elt.getAttribute("data-hypescript");
                var hyperScript = parse(hypeScript);
                if (hyperScript.on) {
                    var event = hyperScript.on.value;
                } else {
                    var event = defaultEvent(elt);
                }
                elt.addEventListener(event, makeEvalAction(elt, hyperScript.actions))
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