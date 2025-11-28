// Core grammar for _hyperscript
import { Lexer } from '../core/lexer.js';
import { Runtime } from '../core/runtime.js';
import {ElementCollection, RegExpIterable, TemplatedQueryElementCollection} from '../core/util.js';
import { getOrInitObject, varargConstructor } from '../core/helpers.js';
import { IdRef, ClassRef, QueryRef, AttributeRef, StyleRef } from '../parsetree/webliterals.js';
import { ParenthesizedExpression, BlockLiteral } from '../parsetree/expressions.js';
import { NakedString, StringLiteral, NumberLiteral, BooleanLiteral, NullLiteral, ArrayLiteral } from '../parsetree/literals.js';
import { ImplicitMeTarget } from '../parsetree/targets.js';
import { NoExpression, SomeExpression } from '../parsetree/existentials.js';

/**
 * @param {Parser} parser
 */
export default function hyperscriptCoreGrammar(parser) {
        parser.addLeafExpression("parenthesized", ParenthesizedExpression.parse);

        parser.addLeafExpression("string", StringLiteral.parse);

        parser.addGrammarElement("nakedString", NakedString.parse);

        parser.addLeafExpression("number", NumberLiteral.parse);

        parser.addLeafExpression("idRef", IdRef.parse);

        parser.addLeafExpression("classRef", ClassRef.parse);

        // TemplatedQueryElementCollection is now imported from ./core/util.js

        parser.addLeafExpression("queryRef", QueryRef.parse);

        parser.addLeafExpression("attributeRef", AttributeRef.parse);

        parser.addLeafExpression("styleRef", StyleRef.parse);

        parser.addGrammarElement("objectKey", function (helper) {
            var token;
            if ((token = helper.matchTokenType("STRING"))) {
                return {
                    type: "objectKey",
                    key: token.value,
                    evaluate: function () {
                        return token.value;
                    },
                };
            } else if (helper.matchOpToken("[")) {
                var expr = helper.parseElement("expression");
                helper.requireOpToken("]");
                return {
                    type: "objectKey",
                    expr: expr,
                    args: [expr],
                    op: function (ctx, expr) {
                        return expr;
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            } else {
                var key = "";
                do {
                    token = helper.matchTokenType("IDENTIFIER") || helper.matchOpToken("-");
                    if (token) key += token.value;
                } while (token);
                return {
                    type: "objectKey",
                    key: key,
                    evaluate: function () {
                        return key;
                    },
                };
            }
        });

        parser.addLeafExpression("objectLiteral", function (helper) {
            if (!helper.matchOpToken("{")) return;
            var keyExpressions = [];
            var valueExpressions = [];
            if (!helper.matchOpToken("}")) {
                do {
                    var name = helper.requireElement("objectKey");
                    helper.requireOpToken(":");
                    var value = helper.requireElement("expression");
                    valueExpressions.push(value);
                    keyExpressions.push(name);
                } while (helper.matchOpToken(",") && !helper.peekToken("}", 0, 'R_BRACE'));
                helper.requireOpToken("}");
            }
            return {
                type: "objectLiteral",
                args: [keyExpressions, valueExpressions],
                op: function (context, keys, values) {
                    var returnVal = {};
                    for (var i = 0; i < keys.length; i++) {
                        returnVal[keys[i]] = values[i];
                    }
                    return returnVal;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("nakedNamedArgumentList", function (helper) {
            var fields = [];
            var valueExpressions = [];
            if (helper.currentToken().type === "IDENTIFIER") {
                do {
                    var name = helper.requireTokenType("IDENTIFIER");
                    helper.requireOpToken(":");
                    var value = helper.requireElement("expression");
                    valueExpressions.push(value);
                    fields.push({ name: name, value: value });
                } while (helper.matchOpToken(","));
            }
            return {
                type: "namedArgumentList",
                fields: fields,
                args: [valueExpressions],
                op: function (context, values) {
                    var returnVal = { _namedArgList_: true };
                    for (var i = 0; i < values.length; i++) {
                        var field = fields[i];
                        returnVal[field.name.value] = values[i];
                    }
                    return returnVal;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("namedArgumentList", function (helper) {
            if (!helper.matchOpToken("(")) return;
            var elt = helper.requireElement("nakedNamedArgumentList");
            helper.requireOpToken(")");
            return elt;
        });

        parser.addGrammarElement("symbol", function (helper) {
            /** @scope {SymbolScope} */
            var scope = "default";
            if (helper.matchToken("global")) {
                scope = "global";
            } else if (helper.matchToken("element") || helper.matchToken("module")) {
                scope = "element";
                // optional possessive
                if (helper.matchOpToken("'")) {
                    helper.requireToken("s");
                }
            } else if (helper.matchToken("local")) {
                scope = "local";
            }

            // TODO better look ahead here
            let eltPrefix = helper.matchOpToken(":");
            let identifier = helper.matchTokenType("IDENTIFIER");
            if (identifier && identifier.value) {
                var name = identifier.value;
                if (eltPrefix) {
                    name = ":" + name;
                }
                if (scope === "default") {
                    if (name.indexOf("$") === 0) {
                        scope = "global";
                    }
                    if (name.indexOf(":") === 0) {
                        scope = "element";
                    }
                }
                return {
                    type: "symbol",
                    token: identifier,
                    scope: scope,
                    name: name,
                    evaluate: function (context) {
                        return context.meta.runtime.resolveSymbol(name, context, scope);
                    },
                };
            }
        });

        parser.addGrammarElement("implicitMeTarget", ImplicitMeTarget.parse);

        parser.addLeafExpression("boolean", BooleanLiteral.parse);

        parser.addLeafExpression("null", NullLiteral.parse);

        parser.addLeafExpression("arrayLiteral", ArrayLiteral.parse);

        parser.addLeafExpression("blockLiteral", BlockLiteral.parse);

        parser.addIndirectExpression("propertyAccess", function (helper, root) {
            if (!helper.matchOpToken(".")) return;
            var prop = helper.requireTokenType("IDENTIFIER");
            var propertyAccess = {
                type: "propertyAccess",
                root: root,
                prop: prop,
                args: [root],
                op: function (context, rootVal) {
                    var value = context.meta.runtime.resolveProperty(rootVal, prop.value);
                    return value;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
            return helper.parser.parseElement("indirectExpression", helper.tokens, propertyAccess);
        });

        parser.addIndirectExpression("of", function (helper, root) {
            if (!helper.matchToken("of")) return;
            var newRoot = helper.requireElement("unaryExpression");
            // find the urroot
            var childOfUrRoot = null;
            var urRoot = root;
            while (urRoot.root) {
                childOfUrRoot = urRoot;
                urRoot = urRoot.root;
            }
            if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef" && urRoot.type !== "styleRef" && urRoot.type !== "computedStyleRef") {
                helper.raiseParseError("Cannot take a property of a non-symbol: " + urRoot.type);
            }
            var attribute = urRoot.type === "attributeRef";
            var style = urRoot.type === "styleRef" || urRoot.type === "computedStyleRef";
            if (attribute || style) {
                var attributeElt = urRoot
            }
            var prop = urRoot.name;

            var propertyAccess = {
                type: "ofExpression",
                prop: urRoot.token,
                root: newRoot,
                attribute: attributeElt,
                expression: root,
                args: [newRoot],
                op: function (context, rootVal) {
                    if (attribute) {
                        return context.meta.runtime.resolveAttribute(rootVal, prop);
                    } else if (style) {
                        if (urRoot.type === "computedStyleRef") {
                            return context.meta.runtime.resolveComputedStyle(rootVal, prop);
                        } else {
                            return context.meta.runtime.resolveStyle(rootVal, prop);
                        }
                    } else {
                        return context.meta.runtime.resolveProperty(rootVal, prop);
                    }
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
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

            return helper.parser.parseElement("indirectExpression", helper.tokens, root);
        });

        parser.addIndirectExpression("possessive", function (helper, root) {
            if (helper.possessivesDisabled) {
                return;
            }
            var apostrophe = helper.matchOpToken("'");
            if (
                apostrophe ||
                (root.type === "symbol" &&
                    (root.name === "my" || root.name === "its" || root.name === "your") &&
                    (helper.currentToken().type === "IDENTIFIER" || helper.currentToken().type === "ATTRIBUTE_REF" || helper.currentToken().type === "STYLE_REF"))
            ) {
                if (apostrophe) {
                    helper.requireToken("s");
                }

                var attribute, style, prop;
                attribute = helper.parseElement("attributeRef");
                if (attribute == null) {
                    style = helper.parseElement("styleRef");
                    if (style == null) {
                        prop = helper.requireTokenType("IDENTIFIER");
                    }
                }
                var propertyAccess = {
                    type: "possessive",
                    root: root,
                    attribute: attribute || style,
                    prop: prop,
                    args: [root],
                    op: function (context, rootVal) {
                        if (attribute) {
                            var value = context.meta.runtime.resolveAttribute(rootVal, attribute.name);
                        } else if (style) {
                            var value
                            if (style.type === 'computedStyleRef') {
                                value = context.meta.runtime.resolveComputedStyle(rootVal, style['name']);
                            } else {
                                value = context.meta.runtime.resolveStyle(rootVal, style['name']);
                            }
                        } else {
                            var value = context.meta.runtime.resolveProperty(rootVal, prop.value);
                        }
                        return value;
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
                return helper.parser.parseElement("indirectExpression", helper.tokens, propertyAccess);
            }
        });

        parser.addIndirectExpression("inExpression", function (helper, root) {
            if (!helper.matchToken("in")) return;
            var target = helper.requireElement("unaryExpression");
            var propertyAccess = {
                type: "inExpression",
                root: root,
                args: [root, target],
                op: function (context, rootVal, target) {
                    var returnArr = [];
                    if (rootVal.css) {
                        context.meta.runtime.implicitLoop(target, function (targetElt) {
                            var results = targetElt.querySelectorAll(rootVal.css);
                            for (var i = 0; i < results.length; i++) {
                                returnArr.push(results[i]);
                            }
                        });
                    } else if (rootVal instanceof Element) {
                        var within = false;
                        context.meta.runtime.implicitLoop(target, function (targetElt) {
                            if (targetElt.contains(rootVal)) {
                                within = true;
                            }
                        });
                        if(within) {
                            return rootVal;
                        }
                    } else {
                        context.meta.runtime.implicitLoop(rootVal, function (rootElt) {
                            context.meta.runtime.implicitLoop(target, function (targetElt) {
                                if (rootElt === targetElt) {
                                    returnArr.push(rootElt);
                                }
                            });
                        });
                    }
                    return returnArr;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
            return helper.parser.parseElement("indirectExpression", helper.tokens, propertyAccess);
        });

        parser.addIndirectExpression("asExpression", function (helper, root) {
            if (!helper.matchToken("as")) return;
            helper.matchToken("a") || helper.matchToken("an");
            var conversion = helper.requireElement("dotOrColonPath").evaluate(); // OK No promise
            var propertyAccess = {
                type: "asExpression",
                root: root,
                args: [root],
                op: function (context, rootVal) {
                    return context.meta.runtime.convertValue(rootVal, conversion);
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
            return helper.parser.parseElement("indirectExpression", helper.tokens, propertyAccess);
        });

        parser.addIndirectExpression("functionCall", function (helper, root) {
            if (!helper.matchOpToken("(")) return;
            var args = [];
            if (!helper.matchOpToken(")")) {
                do {
                    args.push(helper.requireElement("expression"));
                } while (helper.matchOpToken(","));
                helper.requireOpToken(")");
            }

            if (root.root) {
                var functionCall = {
                    type: "functionCall",
                    root: root,
                    argExressions: args,
                    args: [root.root, args],
                    op: function (context, rootRoot, args) {
                        context.meta.runtime.nullCheck(rootRoot, root.root);
                        var func = rootRoot[root.prop.value];
                        context.meta.runtime.nullCheck(func, root);
                        if (func.hyperfunc) {
                            args.push(context);
                        }
                        return func.apply(rootRoot, args);
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            } else {
                var functionCall = {
                    type: "functionCall",
                    root: root,
                    argExressions: args,
                    args: [root, args],
                    op: function (context, func, argVals) {
                        context.meta.runtime.nullCheck(func, root);
                        if (func.hyperfunc) {
                            argVals.push(context);
                        }
                        var apply = func.apply(null, argVals);
                        return apply;
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            }
            return helper.parser.parseElement("indirectExpression", helper.tokens, functionCall);
        });

        parser.addIndirectExpression("attributeRefAccess", function (helper, root) {
            var attribute = helper.parseElement("attributeRef");
            if (!attribute) return;
            var attributeAccess = {
                type: "attributeRefAccess",
                root: root,
                attribute: attribute,
                args: [root],
                op: function (_ctx, rootVal) {
                    var value = _ctx.meta.runtime.resolveAttribute(rootVal, attribute.name);
                    return value;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
            return attributeAccess;
        });

        parser.addIndirectExpression("arrayIndex", function (helper, root) {
            if (!helper.matchOpToken("[")) return;
            var andBefore = false;
            var andAfter = false;
            var firstIndex = null;
            var secondIndex = null;

            if (helper.matchOpToken("..")) {
                andBefore = true;
                firstIndex = helper.requireElement("expression");
            } else {
                firstIndex = helper.requireElement("expression");

                if (helper.matchOpToken("..")) {
                    andAfter = true;
                    var current = helper.currentToken();
                    if (current.type !== "R_BRACKET") {
                        secondIndex = helper.parseElement("expression");
                    }
                }
            }
            helper.requireOpToken("]");

            var arrayIndex = {
                type: "arrayIndex",
                root: root,
                prop: firstIndex,
                firstIndex: firstIndex,
                secondIndex: secondIndex,
                args: [root, firstIndex, secondIndex],
                op: function (_ctx, root, firstIndex, secondIndex) {
                    if (root == null) {
                        return null;
                    }
                    if (andBefore) {
                        if (firstIndex < 0) {
                            firstIndex = root.length + firstIndex;
                        }
                        return root.slice(0, firstIndex + 1); // returns all items from beginning to firstIndex (inclusive)
                    } else if (andAfter) {
                        if (secondIndex != null) {
                            if (secondIndex < 0) {
                                secondIndex = root.length + secondIndex;
                            }
                            return root.slice(firstIndex, secondIndex + 1); // returns all items from firstIndex to secondIndex (inclusive)
                        } else {
                            return root.slice(firstIndex); // returns from firstIndex to end of array
                        }
                    } else {
                        return root[firstIndex];
                    }
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };

            return helper.parser.parseElement("indirectExpression", helper.tokens, arrayIndex);
        });

        // taken from https://drafts.csswg.org/css-values-4/#relative-length
        //        and https://drafts.csswg.org/css-values-4/#absolute-length
        //        (NB: we do not support `in` dues to conflicts w/ the hyperscript grammar)
        var STRING_POSTFIXES = [
            'em', 'ex', 'cap', 'ch', 'ic', 'rem', 'lh', 'rlh', 'vw', 'vh', 'vi', 'vb', 'vmin', 'vmax',
            'cm', 'mm', 'Q', 'pc', 'pt', 'px'
        ];
        parser.addGrammarElement("postfixExpression", function (helper) {
            var root = helper.parseElement("negativeNumber");

            let stringPosfix = helper.tokens.matchAnyToken.apply(helper.tokens, STRING_POSTFIXES) || helper.matchOpToken("%");
            if (stringPosfix) {
                return {
                    type: "stringPostfix",
                    postfix: stringPosfix.value,
                    args: [root],
                    op: function (context, val) {
                        return "" + val + stringPosfix.value;
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            }

            var timeFactor = null;
            if (helper.matchToken("s") || helper.matchToken("seconds")) {
                timeFactor = 1000;
            } else if (helper.matchToken("ms") || helper.matchToken("milliseconds")) {
                timeFactor = 1;
            }
            if (timeFactor) {
                return {
                    type: "timeExpression",
                    time: root,
                    factor: timeFactor,
                    args: [root],
                    op: function (context, val) {
                        return val * timeFactor;
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            }

            if (helper.matchOpToken(":")) {
                var typeName = helper.requireTokenType("IDENTIFIER");
                if (!typeName.value) return;
                var nullOk = !helper.matchOpToken("!");
                return {
                    type: "typeCheck",
                    typeName: typeName,
                    nullOk: nullOk,
                    args: [root],
                    op: function (context, val) {
                        var passed = context.meta.runtime.typeCheck(val, this.typeName.value, nullOk);
                        if (passed) {
                            return val;
                        } else {
                            throw new Error("Typecheck failed!  Expected: " + typeName.value);
                        }
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            } else {
                return root;
            }
        });

        parser.addGrammarElement("logicalNot", function (helper) {
            if (!helper.matchToken("not")) return;
            var root = helper.requireElement("unaryExpression");
            return {
                type: "logicalNot",
                root: root,
                args: [root],
                op: function (context, val) {
                    return !val;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("noExpression", NoExpression.parse);

        parser.addLeafExpression("some", SomeExpression.parse);

        parser.addGrammarElement("negativeNumber", function (helper) {
            if (helper.matchOpToken("-")) {
                var root = helper.requireElement("negativeNumber");
                return {
                    type: "negativeNumber",
                    root: root,
                    args: [root],
                    op: function (context, value) {
                        return -1 * value;
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            } else {
                return helper.requireElement("primaryExpression");
            }
        });

        parser.addGrammarElement("unaryExpression", function (helper) {
            helper.matchToken("the"); // optional "the"
            return helper.parseAnyOf(["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"]);
        });

        parser.addGrammarElement("beepExpression", function (helper) {
            if (!helper.matchToken("beep!")) return;
            var expression = helper.parseElement("unaryExpression");
            if (expression) {
                expression['booped'] = true;
                var originalEvaluate = expression.evaluate;
                expression.evaluate = function(ctx){
                    let value = originalEvaluate.apply(expression, arguments);
                    let element = ctx.me;
                    ctx.meta.runtime.beepValueToConsole(element, expression, value);
                    return value;
                }
                return expression;
            }
        });

        var scanForwardQuery = function(start, root, match, wrap) {
            var results = root.querySelectorAll(match);
            for (var i = 0; i < results.length; i++) {
                var elt = results[i];
                if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
                    return elt;
                }
            }
            if (wrap) {
                return results[0];
            }
        }

        var scanBackwardsQuery = function(start, root, match, wrap) {
            var results = root.querySelectorAll(match);
            for (var i = results.length - 1; i >= 0; i--) {
                var elt = results[i];
                if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING) {
                    return elt;
                }
            }
            if (wrap) {
                return results[results.length - 1];
            }
        }

        var scanForwardArray = function(start, array, match, wrap) {
            var matches = [];
            for(elt of array){
                if (elt.matches(match) || elt === start) {
                    matches.push(elt);
                }
            }
            for (var i = 0; i < matches.length - 1; i++) {
                var elt = matches[i];
                if (elt === start) {
                    return matches[i + 1];
                }
            }
            if (wrap) {
                var first = matches[0];
                if (first && first.matches(match)) {
                    return first;
                }
            }
        }

        var scanBackwardsArray = function(start, array, match, wrap) {
            return scanForwardArray(start, Array.from(array).reverse(), match, wrap);
        }

        parser.addGrammarElement("relativePositionalExpression", function (helper) {
            var op = helper.matchAnyToken("next", "previous");
            if (!op) return;
            var forwardSearch = op.value === "next";

            var thingElt = helper.parseElement("expression");

            if (helper.matchToken("from")) {
                helper.pushFollow("in");
                try {
                    var from = helper.requireElement("unaryExpression");
                } finally {
                    helper.popFollow();
                }
            } else {
                var from = helper.requireElement("implicitMeTarget");
            }

            var inSearch = false;
            var withinElt;
            if (helper.matchToken("in")) {
                inSearch = true;
                var inElt = helper.requireElement("unaryExpression");
            } else if (helper.matchToken("within")) {
                withinElt = helper.requireElement("unaryExpression");
            } else {
                withinElt = document.body;
            }

            var wrapping = false;
            if (helper.matchToken("with")) {
                helper.requireToken("wrapping")
                wrapping = true;
            }

            return {
                type: "relativePositionalExpression",
                from: from,
                forwardSearch: forwardSearch,
                inSearch: inSearch,
                wrapping: wrapping,
                inElt: inElt,
                withinElt: withinElt,
                operator: op.value,
                args: [thingElt, from, inElt, withinElt],
                op: function (context, thing, from, inElt, withinElt) {

                    var css = thing.css;
                    if (css == null) {
                        throw "Expected a CSS value to be returned by " + Tokens.sourceFor.apply(thingElt);
                    }

                    if(inSearch) {
                        if (inElt) {
                            if (forwardSearch) {
                                return scanForwardArray(from, inElt, css, wrapping);
                            } else {
                                return scanBackwardsArray(from, inElt, css, wrapping);
                            }
                        }
                    } else {
                        if (withinElt) {
                            if (forwardSearch) {
                                return scanForwardQuery(from, withinElt, css, wrapping);
                            } else {
                                return scanBackwardsQuery(from, withinElt, css, wrapping);
                            }
                        }
                    }
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            }

        });

        parser.addGrammarElement("positionalExpression", function (helper) {
            var op = helper.matchAnyToken("first", "last", "random");
            if (!op) return;
            helper.matchAnyToken("in", "from", "of");
            var rhs = helper.requireElement("unaryExpression");
            const operator = op.value;
            return {
                type: "positionalExpression",
                rhs: rhs,
                operator: op.value,
                args: [rhs],
                op: function (context, rhsVal) {
                    if (rhsVal && !Array.isArray(rhsVal)) {
                        if (rhsVal.children) {
                            rhsVal = rhsVal.children;
                        } else {
                            rhsVal = Array.from(rhsVal);
                        }
                    }
                    if (rhsVal) {
                        if (operator === "first") {
                            return rhsVal[0];
                        } else if (operator === "last") {
                            return rhsVal[rhsVal.length - 1];
                        } else if (operator === "random") {
                            return rhsVal[Math.floor(Math.random() * rhsVal.length)];
                        }
                    }
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("mathOperator", function (helper) {
            var expr = helper.parseElement("unaryExpression");
            var mathOp,
                initialMathOp = null;
            mathOp = helper.matchAnyOpToken("+", "-", "*", "/") || helper.matchToken('mod');
            while (mathOp) {
                initialMathOp = initialMathOp || mathOp;
                var operator = mathOp.value;
                if (initialMathOp.value !== operator) {
                    helper.raiseParseError("You must parenthesize math operations with different operators");
                }
                var rhs = helper.parseElement("unaryExpression");
                expr = {
                    type: "mathOperator",
                    lhs: expr,
                    rhs: rhs,
                    operator: operator,
                    args: [expr, rhs],
                    op: function (context, lhsVal, rhsVal) {
                        if (operator === "+") {
                            return lhsVal + rhsVal;
                        } else if (operator === "-") {
                            return lhsVal - rhsVal;
                        } else if (operator === "*") {
                            return lhsVal * rhsVal;
                        } else if (operator === "/") {
                            return lhsVal / rhsVal;
                        } else if (operator === "mod") {
                            return lhsVal % rhsVal;
                        }
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
                mathOp = helper.matchAnyOpToken("+", "-", "*", "/") || helper.matchToken('mod');
            }
            return expr;
        });

        parser.addGrammarElement("mathExpression", function (helper) {
            return helper.parseAnyOf(["mathOperator", "unaryExpression"]);
        });

        function sloppyContains(src, container, value){
            if (container['contains']) {
                return container.contains(value);
            } else if (container['includes']) {
                return container.includes(value);
            } else {
                throw Error("The value of " + src.sourceFor() + " does not have a contains or includes method on it");
            }
        }
        function sloppyMatches(src, target, toMatch){
            if (target['match']) {
                return !!target.match(toMatch);
            } else if (target['matches']) {
                return target.matches(toMatch);
            } else {
                throw Error("The value of " + src.sourceFor() + " does not have a match or matches method on it");
            }
        }

        parser.addGrammarElement("comparisonOperator", function (helper) {
            var expr = helper.parseElement("mathExpression");
            var comparisonToken = helper.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==");
            var operator = comparisonToken ? comparisonToken.value : null;
            var hasRightValue = true; // By default, most comparisons require two values, but there are some exceptions.
            var typeCheck = false;

            if (operator == null) {
                if (helper.matchToken("is") || helper.matchToken("am")) {
                    if (helper.matchToken("not")) {
                        if (helper.matchToken("in")) {
                            operator = "not in";
                        } else if (helper.matchToken("a") || helper.matchToken("an")) {
                            operator = "not a";
                            typeCheck = true;
                        } else if (helper.matchToken("empty")) {
                            operator = "not empty";
                            hasRightValue = false;
                        } else {
                            if (helper.matchToken("really")) {
                                operator = "!==";
                            } else {
                                operator = "!=";
                            }
                            // consume additional optional syntax
                            if (helper.matchToken("equal")) {
                                helper.matchToken("to");
                            }
                        }
                    } else if (helper.matchToken("in")) {
                        operator = "in";
                    } else if (helper.matchToken("a") || helper.matchToken("an")) {
                        operator = "a";
                        typeCheck = true;
                    } else if (helper.matchToken("empty")) {
                        operator = "empty";
                        hasRightValue = false;
                    } else if (helper.matchToken("less")) {
                        helper.requireToken("than");
                        if (helper.matchToken("or")) {
                            helper.requireToken("equal");
                            helper.requireToken("to");
                            operator = "<=";
                        } else {
                            operator = "<";
                        }
                    } else if (helper.matchToken("greater")) {
                        helper.requireToken("than");
                        if (helper.matchToken("or")) {
                            helper.requireToken("equal");
                            helper.requireToken("to");
                            operator = ">=";
                        } else {
                            operator = ">";
                        }
                    } else {
                        if (helper.matchToken("really")) {
                            operator = "===";
                        } else {
                            operator = "==";
                        }
                        if (helper.matchToken("equal")) {
                            helper.matchToken("to");
                        }
                    }
                } else if (helper.matchToken("equals")) {
                    operator = "==";
                } else if (helper.matchToken("really")) {
                    helper.requireToken("equals")
                    operator = "===";
                } else if (helper.matchToken("exist") || helper.matchToken("exists")) {
                    operator = "exist";
                    hasRightValue = false;
                } else if (helper.matchToken("matches") || helper.matchToken("match")) {
                    operator = "match";
                } else if (helper.matchToken("contains") || helper.matchToken("contain")) {
                    operator = "contain";
                } else if (helper.matchToken("includes") || helper.matchToken("include")) {
                    operator = "include";
                } else if (helper.matchToken("do") || helper.matchToken("does")) {
                    helper.requireToken("not");
                    if (helper.matchToken("matches") || helper.matchToken("match")) {
                        operator = "not match";
                    } else if (helper.matchToken("contains") || helper.matchToken("contain")) {
                        operator = "not contain";
                    } else if (helper.matchToken("exist") || helper.matchToken("exist")) {
                        operator = "not exist";
                        hasRightValue = false;
                    } else if (helper.matchToken("include")) {
                        operator = "not include";
                    } else {
                        helper.raiseParseError("Expected matches or contains");
                    }
                }
            }

            if (operator) {
                // Do not allow chained comparisons, which is dumb
                var typeName, nullOk, rhs
                if (typeCheck) {
                    typeName = helper.requireTokenType("IDENTIFIER");
                    nullOk = !helper.matchOpToken("!");
                } else if (hasRightValue) {
                    rhs = helper.requireElement("mathExpression");
                    if (operator === "match" || operator === "not match") {
                        rhs = rhs.css ? rhs.css : rhs;
                    }
                }
                var lhs = expr;
                expr = {
                    type: "comparisonOperator",
                    operator: operator,
                    typeName: typeName,
                    nullOk: nullOk,
                    lhs: expr,
                    rhs: rhs,
                    args: [expr, rhs],
                    op: function (context, lhsVal, rhsVal) {
                        if (operator === "==") {
                            return lhsVal == rhsVal;
                        } else if (operator === "!=") {
                            return lhsVal != rhsVal;
                        }
                        if (operator === "===") {
                            return lhsVal === rhsVal;
                        } else if (operator === "!==") {
                            return lhsVal !== rhsVal;
                        }
                        if (operator === "match") {
                            return lhsVal != null && sloppyMatches(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "not match") {
                            return lhsVal == null || !sloppyMatches(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "in") {
                            return rhsVal != null && sloppyContains(rhs, rhsVal, lhsVal);
                        }
                        if (operator === "not in") {
                            return rhsVal == null || !sloppyContains(rhs, rhsVal, lhsVal);
                        }
                        if (operator === "contain") {
                            return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "not contain") {
                            return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "include") {
                            return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "not include") {
                            return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "===") {
                            return lhsVal === rhsVal;
                        } else if (operator === "!==") {
                            return lhsVal !== rhsVal;
                        } else if (operator === "<") {
                            return lhsVal < rhsVal;
                        } else if (operator === ">") {
                            return lhsVal > rhsVal;
                        } else if (operator === "<=") {
                            return lhsVal <= rhsVal;
                        } else if (operator === ">=") {
                            return lhsVal >= rhsVal;
                        } else if (operator === "empty") {
                            return context.meta.runtime.isEmpty(lhsVal);
                        } else if (operator === "not empty") {
                            return !context.meta.runtime.isEmpty(lhsVal);
                        } else if (operator === "exist") {
                            return context.meta.runtime.doesExist(lhsVal);
                        } else if (operator === "not exist") {
                            return !context.meta.runtime.doesExist(lhsVal);
                        } else if (operator === "a") {
                            return context.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
                        } else if (operator === "not a") {
                            return !context.meta.runtime.typeCheck(lhsVal, typeName.value, nullOk);
                        } else {
                            throw "Unknown comparison : " + operator;
                        }
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            }
            return expr;
        });

        parser.addGrammarElement("comparisonExpression", function (helper) {
            return helper.parseAnyOf(["comparisonOperator", "mathExpression"]);
        });

        parser.addGrammarElement("logicalOperator", function (helper) {
            var expr = helper.parseElement("comparisonExpression");
            var logicalOp,
                initialLogicalOp = null;
            logicalOp = helper.matchToken("and") || helper.matchToken("or");
            while (logicalOp) {
                initialLogicalOp = initialLogicalOp || logicalOp;
                if (initialLogicalOp.value !== logicalOp.value) {
                    helper.raiseParseError("You must parenthesize logical operations with different operators");
                }
                var rhs = helper.requireElement("comparisonExpression");
                const operator = logicalOp.value;
                expr = {
                    type: "logicalOperator",
                    operator: operator,
                    lhs: expr,
                    rhs: rhs,
                    args: [expr, rhs],
                    op: function (context, lhsVal, rhsVal) {
                        if (operator === "and") {
                            return lhsVal && rhsVal;
                        } else {
                            return lhsVal || rhsVal;
                        }
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context, operator === "or");
                    },
                };
                logicalOp = helper.matchToken("and") || helper.matchToken("or");
            }
            return expr;
        });

        parser.addGrammarElement("logicalExpression", function (helper) {
            return helper.parseAnyOf(["logicalOperator", "mathExpression"]);
        });

        parser.addGrammarElement("asyncExpression", function (helper) {
            if (helper.matchToken("async")) {
                var value = helper.requireElement("logicalExpression");
                var expr = {
                    type: "asyncExpression",
                    value: value,
                    evaluate: function (context) {
                        return {
                            asyncWrapper: true,
                            value: this.value.evaluate(context), //OK
                        };
                    },
                };
                return expr;
            } else {
                return helper.parseElement("logicalExpression");
            }
        });

        parser.addGrammarElement("expression", function (helper) {
            helper.matchToken("the"); // optional the
            return helper.parseElement("asyncExpression");
        });

        parser.addGrammarElement("assignableExpression", function (helper) {
            helper.matchToken("the"); // optional the

            // TODO obviously we need to generalize this as a left hand side / targetable concept
            var expr = helper.parseElement("primaryExpression");
            if (expr && (
                expr.type === "symbol" ||
                expr.type === "ofExpression" ||
                expr.type === "propertyAccess" ||
                expr.type === "attributeRefAccess" ||
                expr.type === "attributeRef" ||
                expr.type === "styleRef" ||
                expr.type === "arrayIndex" ||
                expr.type === "possessive")
            ) {
                return expr;
            } else {
                helper.raiseParseError(
                    "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
                );
            }
            return expr;
        });

        parser.addGrammarElement("hyperscript", function (helper) {
            var features = [];

            if (helper.hasMore()) {
                while (helper.featureStart(helper.currentToken()) || helper.currentToken().value === "(") {
                    var feature = helper.requireElement("feature");
                    features.push(feature);
                    helper.matchToken("end"); // optional end
                }
            }
            return {
                type: "hyperscript",
                features: features,
                apply: function (target, source, args, runtime) {
                    // no op
                    for (const feature of features) {
                        feature.install(target, source, args, runtime);
                    }
                },
            };
        });

        var parseEventArgs = function (helper) {
            var args = [];
            // handle argument list (look ahead 3)
            if (
                helper.token(0).value === "(" &&
                (helper.token(1).value === ")" || helper.token(2).value === "," || helper.token(2).value === ")")
            ) {
                helper.matchOpToken("(");
                do {
                    args.push(helper.requireTokenType("IDENTIFIER"));
                } while (helper.matchOpToken(","));
                helper.requireOpToken(")");
            }
            return args;
        };

        parser.addFeature("on", function (helper) {
            if (!helper.matchToken("on")) return;
            var every = false;
            if (helper.matchToken("every")) {
                every = true;
            }
            var events = [];
            var displayName = null;
            do {
                var on = helper.requireElement("eventName", "Expected event name");

                var eventName = on.evaluate(); // OK No Promise

                if (displayName) {
                    displayName = displayName + " or " + eventName;
                } else {
                    displayName = "on " + eventName;
                }
                var args = parseEventArgs(helper);

                var filter = null;
                if (helper.matchOpToken("[")) {
                    filter = helper.requireElement("expression");
                    helper.requireOpToken("]");
                }

                var startCount, endCount ,unbounded;
                if (helper.currentToken().type === "NUMBER") {
                    var startCountToken = helper.consumeToken();
                    if (!startCountToken.value) return;
                    startCount = parseInt(startCountToken.value);
                    if (helper.matchToken("to")) {
                        var endCountToken = helper.consumeToken();
                        if (!endCountToken.value) return;
                        endCount = parseInt(endCountToken.value);
                    } else if (helper.matchToken("and")) {
                        unbounded = true;
                        helper.requireToken("on");
                    }
                }

                var intersectionSpec, mutationSpec;
                if (eventName === "intersection") {
                    intersectionSpec = {};
                    if (helper.matchToken("with")) {
                        intersectionSpec["with"] = helper.requireElement("expression").evaluate();
                    }
                    if (helper.matchToken("having")) {
                        do {
                            if (helper.matchToken("margin")) {
                                intersectionSpec["rootMargin"] = helper.requireElement("stringLike").evaluate();
                            } else if (helper.matchToken("threshold")) {
                                intersectionSpec["threshold"] = helper.requireElement("expression").evaluate();
                            } else {
                                helper.raiseParseError("Unknown intersection config specification");
                            }
                        } while (helper.matchToken("and"));
                    }
                } else if (eventName === "mutation") {
                    mutationSpec = {};
                    if (helper.matchToken("of")) {
                        do {
                            if (helper.matchToken("anything")) {
                                mutationSpec["attributes"] = true;
                                mutationSpec["subtree"] = true;
                                mutationSpec["characterData"] = true;
                                mutationSpec["childList"] = true;
                            } else if (helper.matchToken("childList")) {
                                mutationSpec["childList"] = true;
                            } else if (helper.matchToken("attributes")) {
                                mutationSpec["attributes"] = true;
                                mutationSpec["attributeOldValue"] = true;
                            } else if (helper.matchToken("subtree")) {
                                mutationSpec["subtree"] = true;
                            } else if (helper.matchToken("characterData")) {
                                mutationSpec["characterData"] = true;
                                mutationSpec["characterDataOldValue"] = true;
                            } else if (helper.currentToken().type === "ATTRIBUTE_REF") {
                                var attribute = helper.consumeToken();
                                if (mutationSpec["attributeFilter"] == null) {
                                    mutationSpec["attributeFilter"] = [];
                                }
                                if (attribute.value.indexOf("@") == 0) {
                                    mutationSpec["attributeFilter"].push(attribute.value.substring(1));
                                } else {
                                    helper.raiseParseError(
                                        "Only shorthand attribute references are allowed here"
                                    );
                                }
                            } else {
                                helper.raiseParseError("Unknown mutation config specification");
                            }
                        } while (helper.matchToken("or"));
                    } else {
                        mutationSpec["attributes"] = true;
                        mutationSpec["characterData"] = true;
                        mutationSpec["childList"] = true;
                    }
                }

                var from = null;
                var elsewhere = false;
                if (helper.matchToken("from")) {
                    if (helper.matchToken("elsewhere")) {
                        elsewhere = true;
                    } else {
                        helper.pushFollow("or");
                        try {
                            from = helper.requireElement("expression")
                        } finally {
                            helper.popFollow();
                        }
                        if (!from) {
                            helper.raiseParseError('Expected either target value or "elsewhere".');
                        }
                    }
                }
                // support both "elsewhere" and "from elsewhere"
                if (from === null && elsewhere === false && helper.matchToken("elsewhere")) {
                    elsewhere = true;
                }

                if (helper.matchToken("in")) {
                    var inExpr = helper.parseElement('unaryExpression');
                }

                if (helper.matchToken("debounced")) {
                    helper.requireToken("at");
                    var timeExpr = helper.requireElement("unaryExpression");
                    var debounceTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                } else if (helper.matchToken("throttled")) {
                    helper.requireToken("at");
                    var timeExpr = helper.requireElement("unaryExpression");
                    var throttleTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                }

                events.push({
                    execCount: 0,
                    every: every,
                    on: eventName,
                    args: args,
                    filter: filter,
                    from: from,
                    inExpr: inExpr,
                    elsewhere: elsewhere,
                    startCount: startCount,
                    endCount: endCount,
                    unbounded: unbounded,
                    debounceTime: debounceTime,
                    throttleTime: throttleTime,
                    mutationSpec: mutationSpec,
                    intersectionSpec: intersectionSpec,
                    debounced: undefined,
                    lastExec: undefined,
                });
            } while (helper.matchToken("or"));

            var queueLast = true;
            if (!every) {
                if (helper.matchToken("queue")) {
                    if (helper.matchToken("all")) {
                        var queueAll = true;
                        var queueLast = false;
                    } else if (helper.matchToken("first")) {
                        var queueFirst = true;
                    } else if (helper.matchToken("none")) {
                        var queueNone = true;
                    } else {
                        helper.requireToken("last");
                    }
                }
            }

            var start = helper.requireElement("commandList");
            parser.ensureTerminated(start);

            var errorSymbol, errorHandler;
            if (helper.matchToken("catch")) {
                errorSymbol = helper.requireTokenType("IDENTIFIER").value;
                errorHandler = helper.requireElement("commandList");
                parser.ensureTerminated(errorHandler);
            }

            if (helper.matchToken("finally")) {
                var finallyHandler = helper.requireElement("commandList");
                parser.ensureTerminated(finallyHandler);
            }

            var onFeature = {
                displayName: displayName,
                events: events,
                start: start,
                every: every,
                execCount: 0,
                errorHandler: errorHandler,
                errorSymbol: errorSymbol,
                execute: function (/** @type {Context} */ ctx) {
                    let eventQueueInfo = ctx.meta.runtime.getEventQueueFor(ctx.me, onFeature);
                    if (eventQueueInfo.executing && every === false) {
                        if (queueNone || (queueFirst && eventQueueInfo.queue.length > 0)) {
                            return;
                        }
                        if (queueLast) {
                            eventQueueInfo.queue.length = 0;
                        }
                        eventQueueInfo.queue.push(ctx);
                        return;
                    }
                    onFeature.execCount++;
                    eventQueueInfo.executing = true;
                    ctx.meta.onHalt = function () {
                        eventQueueInfo.executing = false;
                        var queued = eventQueueInfo.queue.shift();
                        if (queued) {
                            setTimeout(function () {
                                onFeature.execute(queued);
                            }, 1);
                        }
                    };
                    ctx.meta.reject = function (err) {
                        console.error(err.message ? err.message : err);
                        console.error(err.stack)
                        var hypertrace = ctx.meta.runtime.getHyperTrace(ctx, err);
                        if (hypertrace) {
                            hypertrace.print();
                        }
                        ctx.meta.runtime.triggerEvent(ctx.me, "exception", {
                            error: err,
                        });
                    };
                    start.execute(ctx);
                },
                install: function (elt, source, args, runtime) {
                    for (const eventSpec of onFeature.events) {
                        var targets;
                        if (eventSpec.elsewhere) {
                            targets = [document];
                        } else if (eventSpec.from) {
                            targets = eventSpec.from.evaluate(runtime.makeContext(elt, onFeature, elt, null));
                        } else {
                            targets = [elt];
                        }
                        runtime.implicitLoop(targets, function (target) {
                            // OK NO PROMISE

                            var eventName = eventSpec.on;
                            if (target == null) {
                              console.warn("'%s' feature ignored because target does not exists:", displayName, elt);
                              return;
                            }

                            if (eventSpec.mutationSpec) {
                                eventName = "hyperscript:mutation";
                                const observer = new MutationObserver(function (mutationList, observer) {
                                    if (!onFeature.executing) {
                                        runtime.triggerEvent(target, eventName, {
                                            mutationList: mutationList,
                                            observer: observer,
                                        });
                                    }
                                });
                                observer.observe(target, eventSpec.mutationSpec);
                            }

                            if (eventSpec.intersectionSpec) {
                                eventName = "hyperscript:intersection";
                                const observer = new IntersectionObserver(function (entries) {
                                    for (const entry of entries) {
                                        var detail = {
                                            observer: observer,
                                        };
                                        detail = Object.assign(detail, entry);
                                        detail["intersecting"] = entry.isIntersecting;
                                        runtime.triggerEvent(target, eventName, detail);
                                    }
                                }, eventSpec.intersectionSpec);
                                observer.observe(target);
                            }

                            var addEventListener = target.addEventListener || target.on;
                            addEventListener.call(target, eventName, function listener(evt) {
                                // OK NO PROMISE
                                if (typeof Node !== 'undefined' && elt instanceof Node && target !== elt && !elt.isConnected) {
                                    target.removeEventListener(eventName, listener);
                                    return;
                                }

                                var ctx = runtime.makeContext(elt, onFeature, elt, evt);
                                if (eventSpec.elsewhere && elt.contains(evt.target)) {
                                    return;
                                }
                                if (eventSpec.from) {
                                    ctx.result = target;
                                }

                                // establish context
                                for (const arg of eventSpec.args) {
                                    let eventValue = ctx.event[arg.value];
                                    if (eventValue !== undefined) {
                                        ctx.locals[arg.value] = eventValue;
                                    } else if ('detail' in ctx.event) {
                                        ctx.locals[arg.value] = ctx.event['detail'][arg.value];
                                    }
                                }

                                // install error handler if any
                                ctx.meta.errorHandler = errorHandler;
                                ctx.meta.errorSymbol = errorSymbol;
                                ctx.meta.finallyHandler = finallyHandler;

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
                                    while (true) {
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
                                        if (
                                            eventSpec.execCount < eventSpec.startCount ||
                                            eventSpec.execCount > eventSpec.endCount
                                        ) {
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
                                    if (
                                        eventSpec.lastExec &&
                                        Date.now() < (eventSpec.lastExec + eventSpec.throttleTime)
                                    ) {
                                        return;
                                    } else {
                                        eventSpec.lastExec = Date.now();
                                    }
                                }

                                // apply execute
                                onFeature.execute(ctx);
                            });
                        });
                    }
                },
            };
            helper.setParent(start, onFeature);
            return onFeature;
        });

        parser.addFeature("def", function (helper) {
            if (!helper.matchToken("def")) return;
            var functionName = helper.requireElement("dotOrColonPath");
            var nameVal = functionName.evaluate(); // OK
            var nameSpace = nameVal.split(".");
            var funcName = nameSpace.pop();

            var args = [];
            if (helper.matchOpToken("(")) {
                if (helper.matchOpToken(")")) {
                    // empty args list
                } else {
                    do {
                        args.push(helper.requireTokenType("IDENTIFIER"));
                    } while (helper.matchOpToken(","));
                    helper.requireOpToken(")");
                }
            }

            var start = helper.requireElement("commandList");

            var errorSymbol, errorHandler;
            if (helper.matchToken("catch")) {
                errorSymbol = helper.requireTokenType("IDENTIFIER").value;
                errorHandler = helper.parseElement("commandList");
            }

            if (helper.matchToken("finally")) {
                var finallyHandler = helper.requireElement("commandList");
                parser.ensureTerminated(finallyHandler);
            }

            var functionFeature = {
                displayName:
                    funcName +
                    "(" +
                    args
                        .map(function (arg) {
                            return arg.value;
                        })
                        .join(", ") +
                    ")",
                name: funcName,
                args: args,
                start: start,
                errorHandler: errorHandler,
                errorSymbol: errorSymbol,
                finallyHandler: finallyHandler,
                install: function (target, source, funcArgs, runtime) {
                    var func = function () {
                        // null, worker
                        var ctx = runtime.makeContext(source, functionFeature, target, null);

                        // install error handler if any
                        ctx.meta.errorHandler = errorHandler;
                        ctx.meta.errorSymbol = errorSymbol;
                        ctx.meta.finallyHandler = finallyHandler;

                        for (var i = 0; i < args.length; i++) {
                            var name = args[i];
                            var argumentVal = arguments[i];
                            if (name) {
                                ctx.locals[name.value] = argumentVal;
                            }
                        }
                        ctx.meta.caller = arguments[args.length];
                        if (ctx.meta.caller) {
                            ctx.meta.callingCommand = ctx.meta.caller.meta.command;
                        }
                        var resolve,
                            reject = null;
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
                            return promise;
                        }
                    };
                    func.hyperfunc = true;
                    func.hypername = nameVal;
                    runtime.assignToNamespace(target, nameSpace, funcName, func);
                },
            };

            parser.ensureTerminated(start);

            // terminate error handler if any
            if (errorHandler) {
                parser.ensureTerminated(errorHandler);
            }

            helper.setParent(start, functionFeature);
            return functionFeature;
        });

        parser.addFeature("set", function (helper) {
            let setCmd = helper.parseElement("setCommand");
            if (setCmd) {
                if (setCmd.target.scope !== "element") {
                    helper.raiseParseError("variables declared at the feature level must be element scoped.");
                }
                let setFeature = {
                    start: setCmd,
                    install: function (target, source, args, runtime) {
                        setCmd && setCmd.execute(runtime.makeContext(target, setFeature, target, null));
                    },
                };
                parser.ensureTerminated(setCmd);
                return setFeature;
            }
        });

        parser.addFeature("init", function (helper) {
            if (!helper.matchToken("init")) return;

            var immediately = helper.matchToken("immediately");

            var start = helper.requireElement("commandList");
            var initFeature = {
                start: start,
                install: function (target, source, args, runtime) {
                    let handler = function () {
                        start && start.execute(runtime.makeContext(target, initFeature, target, null));
                    };
                    if (immediately) {
                        handler();
                    } else {
                        setTimeout(handler, 0);
                    }
                },
            };

            // terminate body
            parser.ensureTerminated(start);
            helper.setParent(start, initFeature);
            return initFeature;
        });

        parser.addFeature("worker", function (helper) {
            if (helper.matchToken("worker")) {
                helper.raiseParseError(
                    "In order to use the 'worker' feature, include " +
                        "the _hyperscript worker plugin. See " +
                        "https://hyperscript.org/features/worker/ for " +
                        "more info."
                );
                return undefined
            }
        });

        parser.addFeature("behavior", function (helper) {
            if (!helper.matchToken("behavior")) return;
            var path = helper.requireElement("dotOrColonPath").evaluate();
            var nameSpace = path.split(".");
            var name = nameSpace.pop();

            var formalParams = [];
            if (helper.matchOpToken("(") && !helper.matchOpToken(")")) {
                do {
                    formalParams.push(helper.requireTokenType("IDENTIFIER").value);
                } while (helper.matchOpToken(","));
                helper.requireOpToken(")");
            }
            var hs = helper.requireElement("hyperscript");
            for (var i = 0; i < hs.features.length; i++) {
                var feature = hs.features[i];
                feature.behavior = path;
            }

            return {
                install: function (target, source, args, runtime) {
                    runtime.assignToNamespace(
                        runtime.globalScope.document && runtime.globalScope.document.body,
                        nameSpace,
                        name,
                        function (target, source, innerArgs) {
                            var internalData = runtime.getInternalData(target);
                            var elementScope = getOrInitObject(internalData, path + "Scope");
                            for (var i = 0; i < formalParams.length; i++) {
                                elementScope[formalParams[i]] = innerArgs[formalParams[i]];
                            }
                            hs.apply(target, source, null, runtime);
                        }
                    );
                },
            };
        });

        parser.addFeature("install", function (helper) {
            if (!helper.matchToken("install")) return;
            var behaviorPath = helper.requireElement("dotOrColonPath").evaluate();
            var behaviorNamespace = behaviorPath.split(".");
            var args = helper.parseElement("namedArgumentList");

            var installFeature;
            return (installFeature = {
                install: function (target, source, installArgs, runtime) {
                    runtime.unifiedEval(
                        {
                            args: [args],
                            op: function (ctx, args) {
                                var behavior = runtime.globalScope;
                                for (var i = 0; i < behaviorNamespace.length; i++) {
                                    behavior = behavior[behaviorNamespace[i]];
                                    if (typeof behavior !== "object" && typeof behavior !== "function")
                                        throw new Error("No such behavior defined as " + behaviorPath);
                                }

                                if (!(behavior instanceof Function))
                                    throw new Error(behaviorPath + " is not a behavior");

                                behavior(target, source, args);
                            },
                        },
                        runtime.makeContext(target, installFeature, target, null)
                    );
                },
            });
        });

        parser.addGrammarElement("jsBody", function (helper) {
            var jsSourceStart = helper.currentToken().start;
            var jsLastToken = helper.currentToken();

            var funcNames = [];
            var funcName = "";
            var expectFunctionDeclaration = false;
            while (helper.hasMore()) {
                jsLastToken = helper.consumeToken();
                var peek = helper.token(0, true);
                if (peek.type === "IDENTIFIER" && peek.value === "end") {
                    break;
                }
                if (expectFunctionDeclaration) {
                    if (jsLastToken.type === "IDENTIFIER" || jsLastToken.type === "NUMBER") {
                        funcName += jsLastToken.value;
                    } else {
                        if (funcName !== "") funcNames.push(funcName);
                        funcName = "";
                        expectFunctionDeclaration = false;
                    }
                } else if (jsLastToken.type === "IDENTIFIER" && jsLastToken.value === "function") {
                    expectFunctionDeclaration = true;
                }
            }
            var jsSourceEnd = jsLastToken.end + 1;

            return {
                type: "jsBody",
                exposedFunctionNames: funcNames,
                jsSource: helper.source.substring(jsSourceStart, jsSourceEnd),
            };
        });

        parser.addFeature("js", function (helper) {
            if (!helper.matchToken("js")) return;
            var jsBody = helper.requireElement("jsBody");

            var jsSource =
                jsBody.jsSource +
                "\nreturn { " +
                jsBody.exposedFunctionNames
                    .map(function (name) {
                        return name + ":" + name;
                    })
                    .join(",") +
                " } ";
            var func = new Function(jsSource);

            return {
                jsSource: jsSource,
                function: func,
                exposedFunctionNames: jsBody.exposedFunctionNames,
                install: function (target, source, args, runtime) {
                    Object.assign(runtime.globalScope, func());
                },
            };
        });

        parser.addCommand("js", function (helper) {
            if (!helper.matchToken("js")) return;
            // Parse inputs
            var inputs = [];
            if (helper.matchOpToken("(")) {
                if (helper.matchOpToken(")")) {
                    // empty input list
                } else {
                    do {
                        var inp = helper.requireTokenType("IDENTIFIER");
                        inputs.push(inp.value);
                    } while (helper.matchOpToken(","));
                    helper.requireOpToken(")");
                }
            }

            var jsBody = helper.requireElement("jsBody");
            helper.matchToken("end");

            var func = varargConstructor(Function, inputs.concat([jsBody.jsSource]));

            var command = {
                jsSource: jsBody.jsSource,
                function: func,
                inputs: inputs,
                op: function (context) {
                    var args = [];
                    inputs.forEach(function (input) {
                        args.push(context.meta.runtime.resolveSymbol(input, context, 'default'));
                    });
                    var result = func.apply(context.meta.runtime.globalScope, args);
                    if (result && typeof result.then === "function") {
                        return new Promise(function (resolve) {
                            result.then(function (actualResult) {
                                context.result = actualResult;
                                resolve(context.meta.runtime.findNext(this, context));
                            });
                        });
                    } else {
                        context.result = result;
                        return context.meta.runtime.findNext(this, context);
                    }
                },
            };
            return command;
        });

        parser.addCommand("async", function (helper) {
            if (!helper.matchToken("async")) return;
            if (helper.matchToken("do")) {
                var body = helper.requireElement("commandList");

                // Append halt
                var end = body;
                while (end.next) end = end.next;
                end.next = Runtime.HALT;

                helper.requireToken("end");
            } else {
                var body = helper.requireElement("command");
            }
            var command = {
                body: body,
                op: function (context) {
                    setTimeout(function () {
                        body.execute(context);
                    });
                    return context.meta.runtime.findNext(this, context);
                },
            };
            helper.setParent(body, command);
            return command;
        });

        parser.addCommand("tell", function (helper) {
            var startToken = helper.currentToken();
            if (!helper.matchToken("tell")) return;
            var value = helper.requireElement("expression");
            var body = helper.requireElement("commandList");
            if (helper.hasMore() && !helper.featureStart(helper.currentToken())) {
                helper.requireToken("end");
            }
            var slot = "tell_" + startToken.start;
            var tellCmd = {
                value: value,
                body: body,
                args: [value],
                resolveNext: function (context) {
                    var iterator = context.meta.iterators[slot];
                    if (iterator.index < iterator.value.length) {
                        context.you = iterator.value[iterator.index++];
                        return body;
                    } else {
                        // restore original me
                        context.you = iterator.originalYou;
                        if (this.next) {
                            return this.next;
                        } else {
                            return context.meta.runtime.findNext(this.parent, context);
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
                        originalYou: context.you,
                        index: 0,
                        value: value,
                    };
                    return this.resolveNext(context);
                },
            };
            helper.setParent(body, tellCmd);
            return tellCmd;
        });

        parser.addCommand("wait", function (helper) {
            if (!helper.matchToken("wait")) return;
            var command;

            // wait on event
            if (helper.matchToken("for")) {
                helper.matchToken("a"); // optional "a"
                var events = [];
                do {
                    var lookahead = helper.token(0);
                    if (lookahead.type === 'NUMBER' || lookahead.type === 'L_PAREN') {
                        events.push({
                            time: helper.requireElement('expression').evaluate() // TODO: do we want to allow async here?
                        })
                    } else {
                        events.push({
                            name: helper.requireElement("dotOrColonPath", "Expected event name").evaluate(),
                            args: parseEventArgs(helper),
                        });
                    }
                } while (helper.matchToken("or"));

                if (helper.matchToken("from")) {
                    var on = helper.requireElement("expression");
                }

                // wait on event
                command = {
                    event: events,
                    on: on,
                    args: [on],
                    op: function (context, on) {
                        var target = on ? on : context.me;
                        if (!(target instanceof EventTarget))
                            throw new Error("Not a valid event target: " + this.on.sourceFor());
                        return new Promise((resolve) => {
                            var resolved = false;
                            for (const eventInfo of events) {
                                var listener = (event) => {
                                    context.result = event;
                                    if (eventInfo.args) {
                                        for (const arg of eventInfo.args) {
                                            context.locals[arg.value] =
                                                event[arg.value] || (event.detail ? event.detail[arg.value] : null);
                                        }
                                    }
                                    if (!resolved) {
                                        resolved = true;
                                        resolve(context.meta.runtime.findNext(this, context));
                                    }
                                };
                                if (eventInfo.name){
                                    target.addEventListener(eventInfo.name, listener, {once: true});
                                } else if (eventInfo.time != null) {
                                    setTimeout(listener, eventInfo.time, eventInfo.time)
                                }
                            }
                        });
                    },
                };
                return command;
            } else {
                var time;
                if (helper.matchToken("a")) {
                    helper.requireToken("tick");
                    time = 0;
                } else {
                    time = helper.requireElement("expression");
                }

                command = {
                    type: "waitCmd",
                    time: time,
                    args: [time],
                    op: function (context, timeValue) {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                resolve(context.meta.runtime.findNext(this, context));
                            }, timeValue);
                        });
                    },
                    execute: function (context) {
                        return context.meta.runtime.unifiedExec(this, context);
                    },
                };
                return command;
            }
        });

        // TODO  - colon path needs to eventually become part of ruby-style symbols
        parser.addGrammarElement("dotOrColonPath", function (helper) {
            var root = helper.matchTokenType("IDENTIFIER");
            if (root) {
                var path = [root.value];

                var separator = helper.matchOpToken(".") || helper.matchOpToken(":");
                if (separator) {
                    do {
                        path.push(helper.requireTokenType("IDENTIFIER", "NUMBER").value);
                    } while (helper.matchOpToken(separator.value));
                }

                return {
                    type: "dotOrColonPath",
                    path: path,
                    evaluate: function () {
                        return path.join(separator ? separator.value : "");
                    },
                };
            }
        });


        parser.addGrammarElement("eventName", function (helper) {
            var token;
            if ((token = helper.matchTokenType("STRING"))) {
                return {
                    evaluate: function() {
                        return token.value;
                    },
                };
            }

            return helper.parseElement("dotOrColonPath");
        });

        function parseSendCmd(cmdType, helper) {
            var eventName = helper.requireElement("eventName");

            var details = helper.parseElement("namedArgumentList");
            if ((cmdType === "send" && helper.matchToken("to")) ||
                (cmdType === "trigger" && helper.matchToken("on"))) {
                var toExpr = helper.requireElement("expression");
            } else {
                var toExpr = helper.requireElement("implicitMeTarget");
            }

            var sendCmd = {
                eventName: eventName,
                details: details,
                to: toExpr,
                args: [toExpr, eventName, details],
                op: function (context, to, eventName, details) {
                    context.meta.runtime.nullCheck(to, toExpr);
                    context.meta.runtime.implicitLoop(to, function (target) {
                        context.meta.runtime.triggerEvent(target, eventName, details, context.me);
                    });
                    return context.meta.runtime.findNext(sendCmd, context);
                },
            };
            return sendCmd;
        }

        parser.addCommand("trigger", function (helper) {
            if (helper.matchToken("trigger")) {
                return parseSendCmd("trigger", helper);
            }
        });

        parser.addCommand("send", function (helper) {
            if (helper.matchToken("send")) {
                return parseSendCmd("send", helper);
            }
        });

        var parseReturnFunction = function (helper, returnAValue) {
            if (returnAValue) {
                if (helper.commandBoundary(helper.currentToken())) {
                    helper.raiseParseError("'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
                } else {
                    var value = helper.requireElement("expression");
                }
            }

            var returnCmd = {
                value: value,
                args: [value],
                op: function (context, value) {
                    var resolve = context.meta.resolve;
                    context.meta.returned = true;
                    context.meta.returnValue = value;
                    if (resolve) {
                        if (value) {
                            resolve(value);
                        } else {
                            resolve();
                        }
                    }
                    return context.meta.runtime.HALT;
                },
            };
            return returnCmd;
        };

        parser.addCommand("return", function (helper) {
            if (helper.matchToken("return")) {
                return parseReturnFunction(helper, true);
            }
        });

        parser.addCommand("exit", function (helper) {
            if (helper.matchToken("exit")) {
                return parseReturnFunction(helper, false);
            }
        });

        parser.addCommand("halt", function (helper) {
            if (helper.matchToken("halt")) {
                if (helper.matchToken("the")) {
                    helper.requireToken("event");
                    // optional possessive
                    if (helper.matchOpToken("'")) {
                        helper.requireToken("s");
                    }
                    var keepExecuting = true;
                }
                if (helper.matchToken("bubbling")) {
                    var bubbling = true;
                } else if (helper.matchToken("default")) {
                    var haltDefault = true;
                }
                var exit = parseReturnFunction(helper, false);

                var haltCmd = {
                    keepExecuting: true,
                    bubbling: bubbling,
                    haltDefault: haltDefault,
                    exit: exit,
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
                            if (keepExecuting) {
                                return ctx.meta.runtime.findNext(this, ctx);
                            } else {
                                return exit;
                            }
                        }
                    },
                };
                return haltCmd;
            }
        });

        parser.addCommand("log", function (helper) {
            if (!helper.matchToken("log")) return;
            var exprs = [helper.parseElement("expression")];
            while (helper.matchOpToken(",")) {
                exprs.push(helper.requireElement("expression"));
            }
            if (helper.matchToken("with")) {
                var withExpr = helper.requireElement("expression");
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
                    return ctx.meta.runtime.findNext(this, ctx);
                },
            };
            return logCmd;
        });

        parser.addCommand("beep!", function (helper) {
            if (!helper.matchToken("beep!")) return;
            var exprs = [helper.parseElement("expression")];
            while (helper.matchOpToken(",")) {
                exprs.push(helper.requireElement("expression"));
            }
            var beepCmd = {
                exprs: exprs,
                args: [exprs],
                op: function (ctx, values) {
                    for (let i = 0; i < exprs.length; i++) {
                        const expr = exprs[i];
                        const val = values[i];
                        ctx.meta.runtime.beepValueToConsole(ctx.me, expr, val);
                    }
                    return ctx.meta.runtime.findNext(this, ctx);
                },
            };
            return beepCmd;
        });

        parser.addCommand("throw", function (helper) {
            if (!helper.matchToken("throw")) return;
            var expr = helper.requireElement("expression");
            var throwCmd = {
                expr: expr,
                args: [expr],
                op: function (ctx, expr) {
                    ctx.meta.runtime.registerHyperTrace(ctx, expr);
                    throw expr;
                },
            };
            return throwCmd;
        });

        var parseCallOrGet = function (helper) {
            var expr = helper.requireElement("expression");
            var callCmd = {
                expr: expr,
                args: [expr],
                op: function (context, result) {
                    context.result = result;
                    return context.meta.runtime.findNext(callCmd, context);
                },
            };
            return callCmd;
        };
        parser.addCommand("call", function (helper) {
            if (!helper.matchToken("call")) return;
            var call = parseCallOrGet(helper);
            if (call.expr && call.expr.type !== "functionCall") {
                helper.raiseParseError("Must be a function invocation");
            }
            return call;
        });
        parser.addCommand("get", function (helper) {
            if (helper.matchToken("get")) {
                return parseCallOrGet(helper);
            }
        });

        parser.addCommand("make", function (helper) {
            if (!helper.matchToken("make")) return;
            helper.matchToken("a") || helper.matchToken("an");

            var expr = helper.requireElement("expression");

            var args = [];
            if (expr.type !== "queryRef" && helper.matchToken("from")) {
                do {
                    args.push(helper.requireElement("expression"));
                } while (helper.matchOpToken(","));
            }

            if (helper.matchToken("called")) {
                var target = helper.requireElement("symbol");
            }

            var command;
            if (expr.type === "queryRef") {
                command = {
                    op: function (ctx) {
                        var match,
                            tagname = "div",
                            id,
                            classes = [];
                        var re = /(?:(^|#|\.)([^#\. ]+))/g;
                        while ((match = re.exec(expr.css))) {
                            if (match[1] === "") tagname = match[2].trim();
                            else if (match[1] === "#") id = match[2].trim();
                            else classes.push(match[2].trim());
                        }

                        var result = document.createElement(tagname);
                        if (id !== undefined) result.id = id;
                        for (var i = 0; i < classes.length; i++) {
                            var cls = classes[i];
                            result.classList.add(cls)
                        }

                        ctx.result = result;
                        if (target){
                            ctx.meta.runtime.setSymbol(target.name, ctx, target.scope, result);
                        }

                        return ctx.meta.runtime.findNext(this, ctx);
                    },
                };
                return command;
            } else {
                command = {
                    args: [expr, args],
                    op: function (ctx, expr, args) {
                        ctx.result = varargConstructor(expr, args);
                        if (target){
                            ctx.meta.runtime.setSymbol(target.name, ctx, target.scope, ctx.result);
                        }

                        return ctx.meta.runtime.findNext(this, ctx);
                    },
                };
                return command;
            }
        });

        parser.addGrammarElement("pseudoCommand", function (helper) {

            let lookAhead = helper.token(1);
            if (!(lookAhead && lookAhead.op && (lookAhead.value === '.' || lookAhead.value === "("))) {
                return null;
            }

            var expr = helper.requireElement("primaryExpression");

            var rootRoot = expr.root;
            var root = expr;
            while (rootRoot.root != null) {
                root = root.root;
                rootRoot = rootRoot.root;
            }

            if (expr.type !== "functionCall") {
                helper.raiseParseError("Pseudo-commands must be function calls");
            }

            if (root.type === "functionCall" && root.root.root == null) {
                if (helper.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
                    var realRoot = helper.requireElement("expression");
                } else if (helper.matchToken("me")) {
                    var realRoot = helper.requireElement("implicitMeTarget");
                }
            }

            /** @type {ASTNode} */

            var pseudoCommand
            if(realRoot){
                pseudoCommand = {
                    type: "pseudoCommand",
                    root: realRoot,
                    argExressions: root.argExressions,
                    args: [realRoot, root.argExressions],
                    op: function (context, rootRoot, args) {
                        context.meta.runtime.nullCheck(rootRoot, realRoot);
                        var func = rootRoot[root.root.name];
                        context.meta.runtime.nullCheck(func, root);
                        if (func.hyperfunc) {
                            args.push(context);
                        }
                        context.result = func.apply(rootRoot, args);
                        return context.meta.runtime.findNext(pseudoCommand, context);
                    },
                    execute: function (context) {
                        return context.meta.runtime.unifiedExec(this, context);
                    },
                }
            } else {
                pseudoCommand = {
                    type: "pseudoCommand",
                    expr: expr,
                    args: [expr],
                    op: function (context, result) {
                        context.result = result;
                        return context.meta.runtime.findNext(pseudoCommand, context);
                    },
                    execute: function (context) {
                        return context.meta.runtime.unifiedExec(this, context);
                    },
                };
            }

            return pseudoCommand;
        });

        /**
        * @param {Parser} parser
        * @param {Runtime} runtime
        * @param {Tokens} tokens
        * @param {*} target
        * @param {*} value
        * @returns
        */
        var makeSetter = function (helper, target, value) {

            var symbolWrite = target.type === "symbol";
            var attributeWrite = target.type === "attributeRef";
            var styleWrite = target.type === "styleRef";
            var arrayWrite = target.type === "arrayIndex";

            if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
                helper.raiseParseError("Can only put directly into symbols, not references");
            }

            var rootElt = null;
            var prop = null;
            if (symbolWrite) {
                // rootElt is null
            } else if (attributeWrite || styleWrite) {
                rootElt = helper.requireElement("implicitMeTarget");
                var attribute = target;
            } else if(arrayWrite) {
                prop = target.firstIndex;
                rootElt = target.root;
            } else {
                prop = target.prop ? target.prop.value : null;
                var attribute = target.attribute;
                rootElt = target.root;
            }

            /** @type {ASTNode} */
            var setCmd = {
                target: target,
                symbolWrite: symbolWrite,
                value: value,
                args: [rootElt, prop, value],
                op: function (context, root, prop, valueToSet) {
                    if (symbolWrite) {
                        context.meta.runtime.setSymbol(target.name, context, target.scope, valueToSet);
                    } else {
                        context.meta.runtime.nullCheck(root, rootElt);
                        if (arrayWrite) {
                            root[prop] = valueToSet;
                        } else {
                            context.meta.runtime.implicitLoop(root, function (elt) {
                                if (attribute) {
                                    if (attribute.type === "attributeRef") {
                                        if (valueToSet == null) {
                                            elt.removeAttribute(attribute.name);
                                        } else {
                                            elt.setAttribute(attribute.name, valueToSet);
                                        }
                                    } else {
                                        elt.style[attribute.name] = valueToSet;
                                    }
                                } else {
                                    elt[prop] = valueToSet;
                                }
                            });
                        }
                    }
                    return context.meta.runtime.findNext(this, context);
                },
            };
            return setCmd;
        };

        parser.addCommand("default", function (helper) {
            if (!helper.matchToken("default")) return;
            var target = helper.requireElement("assignableExpression");
            helper.requireToken("to");

            var value = helper.requireElement("expression");

            /** @type {ASTNode} */
            var setter = makeSetter(helper, target, value);
            var defaultCmd = {
                target: target,
                value: value,
                setter: setter,
                args: [target],
                op: function (context, target) {
                    if (target) {
                        return context.meta.runtime.findNext(this, context);
                    } else {
                        return setter;
                    }
                },
            };
            setter.parent = defaultCmd;
            return defaultCmd;
        });

        parser.addCommand("set", function (helper) {
            if (!helper.matchToken("set")) return;
            if (helper.currentToken().type === "L_BRACE") {
                var obj = helper.requireElement("objectLiteral");
                helper.requireToken("on");
                var target = helper.requireElement("expression");

                var command = {
                    objectLiteral: obj,
                    target: target,
                    args: [obj, target],
                    op: function (ctx, obj, target) {
                        Object.assign(target, obj);
                        return ctx.meta.runtime.findNext(this, ctx);
                    },
                };
                return command;
            }

            try {
                helper.pushFollow("to");
                var target = helper.requireElement("assignableExpression");
            } finally {
                helper.popFollow();
            }
            helper.requireToken("to");
            var value = helper.requireElement("expression");
            return makeSetter(helper, target, value);
        });

        parser.addCommand("if", function (helper) {
            if (!helper.matchToken("if")) return;
            var expr = helper.requireElement("expression");
            helper.matchToken("then"); // optional 'then'
            var trueBranch = helper.parseElement("commandList");
            var nestedIfStmt = false;
            let elseToken = helper.matchToken("else") || helper.matchToken("otherwise");
            if (elseToken) {
                let elseIfIfToken = helper.peekToken("if");
                nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
                if (nestedIfStmt) {
                    var falseBranch = helper.parseElement("command");
                } else {
                    var falseBranch = helper.parseElement("commandList");
                }
            }
            if (helper.hasMore() && !nestedIfStmt) {
                helper.requireToken("end");
            }

            /** @type {ASTNode} */
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
                        return context.meta.runtime.findNext(this, context);
                    }
                },
            };
            helper.setParent(trueBranch, ifCmd);
            helper.setParent(falseBranch, ifCmd);
            return ifCmd;
        });

        var parseRepeatExpression = function (helper, startedWithForToken) {
            var innerStartToken = helper.currentToken();
            var identifier;
            if (helper.matchToken("for") || startedWithForToken) {
                var identifierToken = helper.requireTokenType("IDENTIFIER");
                identifier = identifierToken.value;
                helper.requireToken("in");
                var expression = helper.requireElement("expression");
            } else if (helper.matchToken("in")) {
                identifier = "it";
                var expression = helper.requireElement("expression");
            } else if (helper.matchToken("while")) {
                var whileExpr = helper.requireElement("expression");
            } else if (helper.matchToken("until")) {
                var isUntil = true;
                if (helper.matchToken("event")) {
                    var evt = helper.requireElement("dotOrColonPath", "Expected event name");
                    if (helper.matchToken("from")) {
                        var on = helper.requireElement("expression");
                    }
                } else {
                    var whileExpr = helper.requireElement("expression");
                }
            } else {
                if (!helper.commandBoundary(helper.currentToken()) &&
                    helper.currentToken().value !== 'forever') {
                    var times = helper.requireElement("expression");
                    helper.requireToken("times");
                } else {
                    helper.matchToken("forever"); // consume optional forever
                    var forever = true;
                }
            }

            if (helper.matchToken("index")) {
                var identifierToken = helper.requireTokenType("IDENTIFIER");
                var indexIdentifier = identifierToken.value;
            } else if (helper.matchToken("indexed")) {
                helper.requireToken("by");
                var identifierToken = helper.requireTokenType("IDENTIFIER");
                var indexIdentifier = identifierToken.value;
            }

            var loop = helper.parseElement("commandList");
            if (loop && evt) {
                // if this is an event based loop, wait a tick at the end of the loop so that
                // events have a chance to trigger in the loop condition o_O)))
                var last = loop;
                while (last.next) {
                    last = last.next;
                }
                var waitATick = {
                    type: "waitATick",
                    op: function () {
                        return new Promise(function (resolve) {
                            setTimeout(function () {
                                resolve(context.meta.runtime.findNext(waitATick));
                            }, 0);
                        });
                    },
                };
                last.next = waitATick;
            }
            if (helper.hasMore()) {
                helper.requireToken("end");
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
                args: [whileExpr, times],
                op: function (context, whileValue, times) {
                    var iteratorInfo = context.meta.iterators[slot];
                    var keepLooping = false;
                    var loopVal = null;
                    if (this.forever) {
                        keepLooping = true;
                    } else if (this.until) {
                        if (evt) {
                            keepLooping = context.meta.iterators[slot].eventFired === false;
                        } else {
                            keepLooping = whileValue !== true;
                        }
                    } else if (whileExpr) {
                        keepLooping = whileValue;
                    } else if (times) {
                        keepLooping = iteratorInfo.index < times;
                    } else {
                        var nextValFromIterator = iteratorInfo.iterator.next();
                        keepLooping = !nextValFromIterator.done;
                        loopVal = nextValFromIterator.value;
                    }

                    if (keepLooping) {
                        if (iteratorInfo.value) {
                            context.result = context.locals[identifier] = loopVal;
                        } else {
                            context.result = iteratorInfo.index;
                        }
                        if (indexIdentifier) {
                            context.locals[indexIdentifier] = iteratorInfo.index;
                        }
                        iteratorInfo.index++;
                        return loop;
                    } else {
                        context.meta.iterators[slot] = null;
                        return context.meta.runtime.findNext(this.parent, context);
                    }
                },
            };
            helper.setParent(loop, repeatCmd);
            var repeatInit = {
                name: "repeatInit",
                args: [expression, evt, on],
                op: function (context, value, event, on) {
                    var iteratorInfo = {
                        index: 0,
                        value: value,
                        eventFired: false,
                    };
                    context.meta.iterators[slot] = iteratorInfo;
                    if (value) {
                        if (value[Symbol.iterator]) {
                            iteratorInfo.iterator = value[Symbol.iterator]();
                        } else {
                            iteratorInfo.iterator = Object.keys(value)[Symbol.iterator]();
                        }
                    }
                    if (evt) {
                        var target = on || context.me;
                        target.addEventListener(
                            event,
                            function (e) {
                                context.meta.iterators[slot].eventFired = true;
                            },
                            { once: true }
                        );
                    }
                    return repeatCmd; // continue to loop
                },
                execute: function (context) {
                    return context.meta.runtime.unifiedExec(this, context);
                },
            };
            helper.setParent(repeatCmd, repeatInit);
            return repeatInit;
        };

        parser.addCommand("repeat", function (helper) {
            if (helper.matchToken("repeat")) {
                return parseRepeatExpression(helper, false);
            }
        });

        parser.addCommand("for", function (helper) {
            if (helper.matchToken("for")) {
                return parseRepeatExpression(helper, true);
            }
        });

      parser.addCommand("continue", function (helper) {

        if (!helper.matchToken("continue")) return;

        var command = {
          op: function (context) {

            // scan for the closest repeat statement
            for (var parent = this.parent ; true ; parent = parent.parent) {

              if (parent == undefined) {
                helper.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.")
              }
              if (parent.loop != undefined) {
                return parent.resolveNext(context)
              }
            }
          }
        };
        return command;
      });

      parser.addCommand("break", function (helper) {

        if (!helper.matchToken("break")) return;

        var command = {
          op: function (context) {

            // scan for the closest repeat statement
            for (var parent = this.parent ; true ; parent = parent.parent) {

              if (parent == undefined) {
                helper.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.")
              }
              if (parent.loop != undefined) {
                  return context.meta.runtime.findNext(parent.parent, context);
              }
            }
          }
        };
        return command;
      });

        parser.addGrammarElement("stringLike", function (helper) {
            return helper.parseAnyOf(["string", "nakedString"]);
        });

        parser.addCommand("append", function (helper) {
            if (!helper.matchToken("append")) return;
            var targetExpr = null;

            var value = helper.requireElement("expression");

            /** @type {ASTNode} */
            var implicitResultSymbol = {
                type: "symbol",
                evaluate: function (context) {
                    return context.meta.runtime.resolveSymbol("result", context);
                },
            };

            if (helper.matchToken("to")) {
                targetExpr = helper.requireElement("expression");
            } else {
                targetExpr = implicitResultSymbol;
            }

            var setter = null;
            if (targetExpr.type === "symbol" || targetExpr.type === "attributeRef" || targetExpr.root != null) {
                setter = makeSetter(helper, targetExpr, implicitResultSymbol);
            }

            var command = {
                value: value,
                target: targetExpr,
                args: [targetExpr, value],
                op: function (context, target, value) {
                    if (Array.isArray(target)) {
                        target.push(value);
                        return context.meta.runtime.findNext(this, context);
                    } else if (target instanceof Element) {
                        if (value instanceof Element) {
                            target.insertAdjacentElement("beforeend", value); // insert at end, preserving existing content
                        } else {
                            target.insertAdjacentHTML("beforeend", value); // insert at end, preserving existing content
                        }
                        context.meta.runtime.processNode(/** @type {HTMLElement} */ (target)); // process parent so any new content works
                        return context.meta.runtime.findNext(this, context);
                    } else if(setter) {
                        context.result = (target || "") + value;
                        return setter;
                    } else {
                        throw Error("Unable to append a value!")
                    }
                },
                execute: function (context) {
                    return context.meta.runtime.unifiedExec(this, context/*, value, target*/);
                },
            };

            if (setter != null) {
                setter.parent = command;
            }

            return command;
        });

        function parsePickRange(helper) {
            helper.matchToken("at") || helper.matchToken("from");
            const rv = { includeStart: true, includeEnd: false }

            rv.from = helper.matchToken("start") ? 0 : helper.requireElement("expression")

            if (helper.matchToken("to") || helper.matchOpToken("..")) {
              if (helper.matchToken("end")) {
                rv.toEnd = true;
              } else {
                rv.to = helper.requireElement("expression");
              }
            }

            if (helper.matchToken("inclusive")) rv.includeEnd = true;
            else if (helper.matchToken("exclusive")) rv.includeStart = false;

            return rv;
        }

        // RegExpIterator and RegExpIterable are now imported from ./core/util.js

        parser.addCommand("pick", (helper) => {
          if (!helper.matchToken("pick")) return;

          helper.matchToken("the");

          if (helper.matchToken("item") || helper.matchToken("items")
           || helper.matchToken("character") || helper.matchToken("characters")) {
            const range = parsePickRange(helper);

            helper.requireToken("from");
            const root = helper.requireElement("expression");

            return {
              args: [root, range.from, range.to],
              op(ctx, root, from, to) {
                if (range.toEnd) to = root.length;
                if (!range.includeStart) from++;
                if (range.includeEnd) to++;
                if (to == null || to == undefined) to = from + 1;
                ctx.result = root.slice(from, to);
                return ctx.meta.runtime.findNext(this, ctx);
              }
            }
          }

          if (helper.matchToken("match")) {
            helper.matchToken("of");
            const re = helper.parseElement("expression");
            let flags = ""
            if (helper.matchOpToken("|")) {
              flags = helper.requireTokenType("IDENTIFIER").value;
            }

            helper.requireToken("from");
            const root = helper.parseElement("expression");

            return {
              args: [root, re],
              op(ctx, root, re) {
                ctx.result = new RegExp(re, flags).exec(root);
                return ctx.meta.runtime.findNext(this, ctx);
              }
            }
          }

          if (helper.matchToken("matches")) {
            helper.matchToken("of");
            const re = helper.parseElement("expression");
            let flags = "gu"
            if (helper.matchOpToken("|")) {
              flags = 'g' + helper.requireTokenType("IDENTIFIER").value.replace('g', '');
            }

            helper.requireToken("from");
            const root = helper.parseElement("expression");

            return {
              args: [root, re],
              op(ctx, root, re) {
                ctx.result = new RegExpIterable(re, flags, root);
                return ctx.meta.runtime.findNext(this, ctx);
              }
            }
          }
        });

        parser.addCommand("increment", function (helper) {
            if (!helper.matchToken("increment")) return;
            var amountExpr;

            // This is optional.  Defaults to "result"
            var target = helper.parseElement("assignableExpression");

            // This is optional. Defaults to 1.
            if (helper.matchToken("by")) {
                amountExpr = helper.requireElement("expression");
            }

            var implicitIncrementOp = {
                type: "implicitIncrementOp",
                target: target,
                args: [target, amountExpr],
                op: function (context, targetValue, amount) {
                    targetValue = targetValue ? parseFloat(targetValue) : 0;
                    amount = amountExpr ? parseFloat(amount) : 1;
                    var newValue = targetValue + amount;
                    context.result = newValue;
                    return newValue;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                }
            };

            return makeSetter(helper, target, implicitIncrementOp);
        });

        parser.addCommand("decrement", function (helper) {
            if (!helper.matchToken("decrement")) return;
            var amountExpr;

            // This is optional.  Defaults to "result"
            var target = helper.parseElement("assignableExpression");

            // This is optional. Defaults to 1.
            if (helper.matchToken("by")) {
                amountExpr = helper.requireElement("expression");
            }

            var implicitDecrementOp = {
                type: "implicitDecrementOp",
                target: target,
                args: [target, amountExpr],
                op: function (context, targetValue, amount) {
                    targetValue = targetValue ? parseFloat(targetValue) : 0;
                    amount = amountExpr ? parseFloat(amount) : 1;
                    var newValue = targetValue - amount;
                    context.result = newValue;
                    return newValue;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                }
            };

            return makeSetter(helper, target, implicitDecrementOp);
        });

        function parseConversionInfo(helper) {
            var type = "text";
            var conversion;
            helper.matchToken("a") || helper.matchToken("an");
            if (helper.matchToken("json") || helper.matchToken("Object")) {
                type = "json";
            } else if (helper.matchToken("response")) {
                type = "response";
            } else if (helper.matchToken("html")) {
                type = "html";
            } else if (helper.matchToken("text")) {
                // default, ignore
            } else {
                conversion = helper.requireElement("dotOrColonPath").evaluate();
            }
            return {type, conversion};
        }

        parser.addCommand("fetch", function (helper) {
            if (!helper.matchToken("fetch")) return;
            var url = helper.requireElement("stringLike");

            if (helper.matchToken("as")) {
                var conversionInfo = parseConversionInfo(helper);
            }

            if (helper.matchToken("with") && helper.currentToken().value !== "{") {
                var args = helper.parseElement("nakedNamedArgumentList");
            } else {
                var args = helper.parseElement("objectLiteral");
            }

            if (conversionInfo == null && helper.matchToken("as")) {
                conversionInfo = parseConversionInfo(helper);
            }

            var type = conversionInfo ? conversionInfo.type : "text";
            var conversion = conversionInfo ? conversionInfo.conversion : null

            /** @type {ASTNode} */
            var fetchCmd = {
                url: url,
                argExpressions: args,
                args: [url, args],
                op: function (context, url, args) {
                    var detail = args || {};
                    detail["sender"] = context.me;
                    detail["headers"] = detail["headers"] || {}
                    var abortController = new AbortController();
                    let abortListener = context.me.addEventListener('fetch:abort', function(){
                        abortController.abort();
                    }, {once: true});
                    detail['signal'] = abortController.signal;
                    context.meta.runtime.triggerEvent(context.me, "hyperscript:beforeFetch", detail);
                    context.meta.runtime.triggerEvent(context.me, "fetch:beforeRequest", detail);
                    args = detail;
                    var finished = false;
                    if (args.timeout) {
                        setTimeout(function () {
                            if (!finished) {
                                abortController.abort();
                            }
                        }, args.timeout);
                    }
                    return fetch(url, args)
                        .then(function (resp) {
                            let resultDetails = {response:resp};
                            context.meta.runtime.triggerEvent(context.me, "fetch:afterResponse", resultDetails);
                            resp = resultDetails.response;

                            if (type === "response") {
                                context.result = resp;
                                context.meta.runtime.triggerEvent(context.me, "fetch:afterRequest", {result:resp});
                                finished = true;
                                return context.meta.runtime.findNext(fetchCmd, context);
                            }
                            if (type === "json") {
                                return resp.json().then(function (result) {
                                    context.result = result;
                                    context.meta.runtime.triggerEvent(context.me, "fetch:afterRequest", {result});
                                    finished = true;
                                    return context.meta.runtime.findNext(fetchCmd, context);
                                });
                            }
                            return resp.text().then(function (result) {
                                if (conversion) result = context.meta.runtime.convertValue(result, conversion);

                                if (type === "html") result = context.meta.runtime.convertValue(result, "Fragment");

                                context.result = result;
                                context.meta.runtime.triggerEvent(context.me, "fetch:afterRequest", {result});
                                finished = true;
                                return context.meta.runtime.findNext(fetchCmd, context);
                            });
                        })
                        .catch(function (reason) {
                            context.meta.runtime.triggerEvent(context.me, "fetch:error", {
                                reason: reason,
                            });
                            throw reason;
                        }).finally(function(){
                            context.me.removeEventListener('fetch:abort', abortListener);
                        });
                },
            };
            return fetchCmd;
        });
}
