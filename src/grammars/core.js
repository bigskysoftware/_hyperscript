// Core grammar for _hyperscript
import { Lexer } from '../core/lexer.js';
import { Runtime } from '../core/runtime.js';
import { ElementCollection, TemplatedQueryElementCollection } from '../core/util.js';
import { getOrInitObject, varargConstructor } from '../core/helpers.js';

/**
 * @param {Parser} parser
 */
export default function hyperscriptCoreGrammar(parser) {
        parser.addLeafExpression("parenthesized", function (parser, tokens) {
            if (tokens.matchOpToken("(")) {
                var follows = tokens.clearFollows();
                try {
                    var expr = parser.requireElement("expression", tokens);
                } finally {
                    tokens.restoreFollows(follows);
                }
                tokens.requireOpToken(")");
                return expr;
            }
        });

        parser.addLeafExpression("string", function (parser, tokens) {
            var stringToken = tokens.matchTokenType("STRING");
            if (!stringToken) return;
            var rawValue = /** @type {string} */ (stringToken.value);
            /** @type {any[]} */
            var args;
            if (stringToken.template) {
                var innerTokens = Lexer.tokenize(rawValue, true);
                args = parser.parseStringTemplate(innerTokens);
            } else {
                args = [];
            }
            return {
                type: "string",
                token: stringToken,
                args: args,
                op: function (context) {
                    var returnStr = "";
                    for (var i = 1; i < arguments.length; i++) {
                        var val = arguments[i];
                        if (val !== undefined) {
                            returnStr += val;
                        }
                    }
                    return returnStr;
                },
                evaluate: function (context) {
                    if (args.length === 0) {
                        return rawValue;
                    } else {
                        return context.meta.runtime.unifiedEval(this, context);
                    }
                },
            };
        });

        parser.addGrammarElement("nakedString", function (parser, tokens) {
            if (tokens.hasMore()) {
                var tokenArr = tokens.consumeUntilWhitespace();
                tokens.matchTokenType("WHITESPACE");
                return {
                    type: "nakedString",
                    tokens: tokenArr,
                    evaluate: function (context) {
                        return tokenArr
                            .map(function (t) {
                                return t.value;
                            })
                            .join("");
                    },
                };
            }
        });

        parser.addLeafExpression("number", function (parser, tokens) {
            var number = tokens.matchTokenType("NUMBER");
            if (!number) return;
            var numberToken = number;
            var value = parseFloat(/** @type {string} */ (number.value));
            return {
                type: "number",
                value: value,
                numberToken: numberToken,
                evaluate: function () {
                    return value;
                },
            };
        });

        parser.addLeafExpression("idRef", function (parser, tokens) {
            var elementId = tokens.matchTokenType("ID_REF");
            if (!elementId) return;
            if (!elementId.value) return;
            // TODO - unify these two expression types
            if (elementId.template) {
                var templateValue = elementId.value.substring(2);
                var innerTokens = Lexer.tokenize(templateValue);
                var innerExpression = parser.requireElement("expression", innerTokens);
                return {
                    type: "idRefTemplate",
                    args: [innerExpression],
                    op: function (context, arg) {
                        return context.meta.runtime.getRootNode(context.me).getElementById(arg);
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            } else {
                const value = elementId.value.substring(1);
                return {
                    type: "idRef",
                    css: elementId.value,
                    value: value,
                    evaluate: function (context) {
                        return (
                            context.meta.runtime.getRootNode(context.me).getElementById(value)
                        );
                    },
                };
            }
        });

        parser.addLeafExpression("classRef", function (parser, tokens) {
            var classRef = tokens.matchTokenType("CLASS_REF");

            if (!classRef) return;
            if (!classRef.value) return;

            // TODO - unify these two expression types
            if (classRef.template) {
                var templateValue = classRef.value.substring(2);
                var innerTokens = Lexer.tokenize(templateValue);
                var innerExpression = parser.requireElement("expression", innerTokens);
                return {
                    type: "classRefTemplate",
                    args: [innerExpression],
                    op: function (context, arg) {
                        return new ElementCollection("." + arg, context.me, true)
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            } else {
                const css = classRef.value;
                return {
                    type: "classRef",
                    css: css,
                    evaluate: function (context) {
                        return new ElementCollection(css, context.me, true)
                    },
                };
            }
        });

        // TemplatedQueryElementCollection is now imported from ./core/util.js

        parser.addLeafExpression("queryRef", function (parser, tokens) {
            var queryStart = tokens.matchOpToken("<");
            if (!queryStart) return;
            var queryTokens = tokens.consumeUntil("/");
            tokens.requireOpToken("/");
            tokens.requireOpToken(">");
            var queryValue = queryTokens
                .map(function (t) {
                    if (t.type === "STRING") {
                        return '"' + t.value + '"';
                    } else {
                        return t.value;
                    }
                })
                .join("");

            var template, innerTokens, args;
            if (/\$[^=]/.test(queryValue)) {
                template = true;
                innerTokens = Lexer.tokenize(queryValue, true);
                args = parser.parseStringTemplate(innerTokens);
            }

            return {
                type: "queryRef",
                css: queryValue,
                args: args,
                op: function (context, ...args) {
                    if (template) {
                        return new TemplatedQueryElementCollection(queryValue, context.me, args)
                    } else {
                        return new ElementCollection(queryValue, context.me)
                    }
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addLeafExpression("attributeRef", function (parser, tokens) {
            var attributeRef = tokens.matchTokenType("ATTRIBUTE_REF");
            if (!attributeRef) return;
            if (!attributeRef.value) return;
            var outerVal = attributeRef.value;
            if (outerVal.indexOf("[") === 0) {
                var innerValue = outerVal.substring(2, outerVal.length - 1);
            } else {
                var innerValue = outerVal.substring(1);
            }
            var css = "[" + innerValue + "]";
            var split = innerValue.split("=");
            var name = split[0];
            var value = split[1];
            if (value) {
                // strip quotes
                if (value.indexOf('"') === 0) {
                    value = value.substring(1, value.length - 1);
                }
            }
            return {
                type: "attributeRef",
                name: name,
                css: css,
                value: value,
                op: function (context) {
                    var target = context.you || context.me;
                    if (target) {
                        return target.getAttribute(name);
                    }
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addLeafExpression("styleRef", function (parser, tokens) {
            var styleRef = tokens.matchTokenType("STYLE_REF");
            if (!styleRef) return;
            if (!styleRef.value) return;
            var styleProp = styleRef.value.substr(1);
            if (styleProp.startsWith("computed-")) {
                styleProp = styleProp.substr("computed-".length);
                return {
                    type: "computedStyleRef",
                    name: styleProp,
                    op: function (context) {
                        var target = context.you || context.me;
                        if (target) {
                            return context.meta.runtime.resolveComputedStyle(target, styleProp);
                        }
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            } else {
                return {
                    type: "styleRef",
                    name: styleProp,
                    op: function (context) {
                        var target = context.you || context.me;
                        if (target) {
                            return context.meta.runtime.resolveStyle(target, styleProp);
                        }
                    },
                    evaluate: function (context) {
                        return context.meta.runtime.unifiedEval(this, context);
                    },
                };
            }
        });

        parser.addGrammarElement("objectKey", function (parser, tokens) {
            var token;
            if ((token = tokens.matchTokenType("STRING"))) {
                return {
                    type: "objectKey",
                    key: token.value,
                    evaluate: function () {
                        return token.value;
                    },
                };
            } else if (tokens.matchOpToken("[")) {
                var expr = parser.parseElement("expression", tokens);
                tokens.requireOpToken("]");
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
                    token = tokens.matchTokenType("IDENTIFIER") || tokens.matchOpToken("-");
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

        parser.addLeafExpression("objectLiteral", function (parser, tokens) {
            if (!tokens.matchOpToken("{")) return;
            var keyExpressions = [];
            var valueExpressions = [];
            if (!tokens.matchOpToken("}")) {
                do {
                    var name = parser.requireElement("objectKey", tokens);
                    tokens.requireOpToken(":");
                    var value = parser.requireElement("expression", tokens);
                    valueExpressions.push(value);
                    keyExpressions.push(name);
                } while (tokens.matchOpToken(",") && !tokens.peekToken("}", 0, 'R_BRACE'));
                tokens.requireOpToken("}");
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

        parser.addGrammarElement("nakedNamedArgumentList", function (parser, tokens) {
            var fields = [];
            var valueExpressions = [];
            if (tokens.currentToken().type === "IDENTIFIER") {
                do {
                    var name = tokens.requireTokenType("IDENTIFIER");
                    tokens.requireOpToken(":");
                    var value = parser.requireElement("expression", tokens);
                    valueExpressions.push(value);
                    fields.push({ name: name, value: value });
                } while (tokens.matchOpToken(","));
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

        parser.addGrammarElement("namedArgumentList", function (parser, tokens) {
            if (!tokens.matchOpToken("(")) return;
            var elt = parser.requireElement("nakedNamedArgumentList", tokens);
            tokens.requireOpToken(")");
            return elt;
        });

        parser.addGrammarElement("symbol", function (parser, tokens) {
            /** @scope {SymbolScope} */
            var scope = "default";
            if (tokens.matchToken("global")) {
                scope = "global";
            } else if (tokens.matchToken("element") || tokens.matchToken("module")) {
                scope = "element";
                // optional possessive
                if (tokens.matchOpToken("'")) {
                    tokens.requireToken("s");
                }
            } else if (tokens.matchToken("local")) {
                scope = "local";
            }

            // TODO better look ahead here
            let eltPrefix = tokens.matchOpToken(":");
            let identifier = tokens.matchTokenType("IDENTIFIER");
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

        parser.addGrammarElement("implicitMeTarget", function (parser, tokens) {
            return {
                type: "implicitMeTarget",
                evaluate: function (context) {
                    return context.you || context.me;
                },
            };
        });

        parser.addLeafExpression("boolean", function (parser, tokens) {
            var booleanLiteral = tokens.matchToken("true") || tokens.matchToken("false");
            if (!booleanLiteral) return;
            const value = booleanLiteral.value === "true";
            return {
                type: "boolean",
                evaluate: function (context) {
                    return value;
                },
            };
        });

        parser.addLeafExpression("null", function (parser, tokens) {
            if (tokens.matchToken("null")) {
                return {
                    type: "null",
                    evaluate: function (context) {
                        return null;
                    },
                };
            }
        });

        parser.addLeafExpression("arrayLiteral", function (parser, tokens) {
            if (!tokens.matchOpToken("[")) return;
            var values = [];
            if (!tokens.matchOpToken("]")) {
                do {
                    var expr = parser.requireElement("expression", tokens);
                    values.push(expr);
                } while (tokens.matchOpToken(","));
                tokens.requireOpToken("]");
            }
            return {
                type: "arrayLiteral",
                values: values,
                args: [values],
                op: function (context, values) {
                    return values;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addLeafExpression("blockLiteral", function (parser, tokens) {
            if (!tokens.matchOpToken("\\")) return;
            var args = [];
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
            var expr = parser.requireElement("expression", tokens);
            return {
                type: "blockLiteral",
                args: args,
                expr: expr,
                evaluate: function (ctx) {
                    var returnFunc = function () {
                        //TODO - push scope
                        for (var i = 0; i < args.length; i++) {
                            ctx.locals[args[i].value] = arguments[i];
                        }
                        return expr.evaluate(ctx); //OK
                    };
                    return returnFunc;
                },
            };
        });

        parser.addIndirectExpression("propertyAccess", function (parser, tokens, root) {
            if (!tokens.matchOpToken(".")) return;
            var prop = tokens.requireTokenType("IDENTIFIER");
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
            return parser.parseElement("indirectExpression", tokens, propertyAccess);
        });

        parser.addIndirectExpression("of", function (parser, tokens, root) {
            if (!tokens.matchToken("of")) return;
            var newRoot = parser.requireElement("unaryExpression", tokens);
            // find the urroot
            var childOfUrRoot = null;
            var urRoot = root;
            while (urRoot.root) {
                childOfUrRoot = urRoot;
                urRoot = urRoot.root;
            }
            if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef" && urRoot.type !== "styleRef" && urRoot.type !== "computedStyleRef") {
                parser.raiseParseError(tokens, "Cannot take a property of a non-symbol: " + urRoot.type);
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

            return parser.parseElement("indirectExpression", tokens, root);
        });

        parser.addIndirectExpression("possessive", function (parser, tokens, root) {
            if (parser.possessivesDisabled) {
                return;
            }
            var apostrophe = tokens.matchOpToken("'");
            if (
                apostrophe ||
                (root.type === "symbol" &&
                    (root.name === "my" || root.name === "its" || root.name === "your") &&
                    (tokens.currentToken().type === "IDENTIFIER" || tokens.currentToken().type === "ATTRIBUTE_REF" || tokens.currentToken().type === "STYLE_REF"))
            ) {
                if (apostrophe) {
                    tokens.requireToken("s");
                }

                var attribute, style, prop;
                attribute = parser.parseElement("attributeRef", tokens);
                if (attribute == null) {
                    style = parser.parseElement("styleRef", tokens);
                    if (style == null) {
                        prop = tokens.requireTokenType("IDENTIFIER");
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
                return parser.parseElement("indirectExpression", tokens, propertyAccess);
            }
        });

        parser.addIndirectExpression("inExpression", function (parser, tokens, root) {
            if (!tokens.matchToken("in")) return;
            var target = parser.requireElement("unaryExpression", tokens);
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
            return parser.parseElement("indirectExpression", tokens, propertyAccess);
        });

        parser.addIndirectExpression("asExpression", function (parser, tokens, root) {
            if (!tokens.matchToken("as")) return;
            tokens.matchToken("a") || tokens.matchToken("an");
            var conversion = parser.requireElement("dotOrColonPath", tokens).evaluate(); // OK No promise
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
            return parser.parseElement("indirectExpression", tokens, propertyAccess);
        });

        parser.addIndirectExpression("functionCall", function (parser, tokens, root) {
            if (!tokens.matchOpToken("(")) return;
            var args = [];
            if (!tokens.matchOpToken(")")) {
                do {
                    args.push(parser.requireElement("expression", tokens));
                } while (tokens.matchOpToken(","));
                tokens.requireOpToken(")");
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
            return parser.parseElement("indirectExpression", tokens, functionCall);
        });

        parser.addIndirectExpression("attributeRefAccess", function (parser, tokens, root) {
            var attribute = parser.parseElement("attributeRef", tokens);
            if (!attribute) return;
            var attributeAccess = {
                type: "attributeRefAccess",
                root: root,
                attribute: attribute,
                args: [root],
                op: function (_ctx, rootVal) {
                    var value = context.meta.runtime.resolveAttribute(rootVal, attribute.name);
                    return value;
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
            return attributeAccess;
        });

        parser.addIndirectExpression("arrayIndex", function (parser, tokens, root) {
            if (!tokens.matchOpToken("[")) return;
            var andBefore = false;
            var andAfter = false;
            var firstIndex = null;
            var secondIndex = null;

            if (tokens.matchOpToken("..")) {
                andBefore = true;
                firstIndex = parser.requireElement("expression", tokens);
            } else {
                firstIndex = parser.requireElement("expression", tokens);

                if (tokens.matchOpToken("..")) {
                    andAfter = true;
                    var current = tokens.currentToken();
                    if (current.type !== "R_BRACKET") {
                        secondIndex = parser.parseElement("expression", tokens);
                    }
                }
            }
            tokens.requireOpToken("]");

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

            return parser.parseElement("indirectExpression", tokens, arrayIndex);
        });

        // taken from https://drafts.csswg.org/css-values-4/#relative-length
        //        and https://drafts.csswg.org/css-values-4/#absolute-length
        //        (NB: we do not support `in` dues to conflicts w/ the hyperscript grammar)
        var STRING_POSTFIXES = [
            'em', 'ex', 'cap', 'ch', 'ic', 'rem', 'lh', 'rlh', 'vw', 'vh', 'vi', 'vb', 'vmin', 'vmax',
            'cm', 'mm', 'Q', 'pc', 'pt', 'px'
        ];
        parser.addGrammarElement("postfixExpression", function (parser, tokens) {
            var root = parser.parseElement("negativeNumber", tokens);

            let stringPosfix = tokens.matchAnyToken.apply(tokens, STRING_POSTFIXES) || tokens.matchOpToken("%");
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
            if (tokens.matchToken("s") || tokens.matchToken("seconds")) {
                timeFactor = 1000;
            } else if (tokens.matchToken("ms") || tokens.matchToken("milliseconds")) {
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

            if (tokens.matchOpToken(":")) {
                var typeName = tokens.requireTokenType("IDENTIFIER");
                if (!typeName.value) return;
                var nullOk = !tokens.matchOpToken("!");
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

        parser.addGrammarElement("logicalNot", function (parser, tokens) {
            if (!tokens.matchToken("not")) return;
            var root = parser.requireElement("unaryExpression", tokens);
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

        parser.addGrammarElement("noExpression", function (parser, tokens) {
            if (!tokens.matchToken("no")) return;
            var root = parser.requireElement("unaryExpression", tokens);
            return {
                type: "noExpression",
                root: root,
                args: [root],
                op: function (context, val) {
                    return context.meta.runtime.isEmpty(val);
                },
                evaluate: function (context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addLeafExpression("some", function (parser, tokens) {
            if (!tokens.matchToken("some")) return;
            var root = parser.requireElement("expression", tokens);
            return {
                type: "noExpression",
                root: root,
                args: [root],
                op: function (context, val) {
                    return !context.meta.runtime.isEmpty(val);
                },
                evaluate(context) {
                    return context.meta.runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("negativeNumber", function (parser, tokens) {
            if (tokens.matchOpToken("-")) {
                var root = parser.requireElement("negativeNumber", tokens);
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
                return parser.requireElement("primaryExpression", tokens);
            }
        });

        parser.addGrammarElement("unaryExpression", function (parser, tokens) {
            tokens.matchToken("the"); // optional "the"
            return parser.parseAnyOf(
                ["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"],
                tokens
            );
        });

        parser.addGrammarElement("beepExpression", function (parser, tokens) {
            if (!tokens.matchToken("beep!")) return;
            var expression = parser.parseElement("unaryExpression", tokens);
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
            context.meta.runtime.forEach(array, function(elt){
                if (elt.matches(match) || elt === start) {
                    matches.push(elt);
                }
            })
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

        parser.addGrammarElement("relativePositionalExpression", function (parser, tokens) {
            var op = tokens.matchAnyToken("next", "previous");
            if (!op) return;
            var forwardSearch = op.value === "next";

            var thingElt = parser.parseElement("expression", tokens);

            if (tokens.matchToken("from")) {
                tokens.pushFollow("in");
                try {
                    var from = parser.requireElement("unaryExpression", tokens);
                } finally {
                    tokens.popFollow();
                }
            } else {
                var from = parser.requireElement("implicitMeTarget", tokens);
            }

            var inSearch = false;
            var withinElt;
            if (tokens.matchToken("in")) {
                inSearch = true;
                var inElt = parser.requireElement("unaryExpression", tokens);
            } else if (tokens.matchToken("within")) {
                withinElt = parser.requireElement("unaryExpression", tokens);
            } else {
                withinElt = document.body;
            }

            var wrapping = false;
            if (tokens.matchToken("with")) {
                tokens.requireToken("wrapping")
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

        parser.addGrammarElement("positionalExpression", function (parser, tokens) {
            var op = tokens.matchAnyToken("first", "last", "random");
            if (!op) return;
            tokens.matchAnyToken("in", "from", "of");
            var rhs = parser.requireElement("unaryExpression", tokens);
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

        parser.addGrammarElement("mathOperator", function (parser, tokens) {
            var expr = parser.parseElement("unaryExpression", tokens);
            var mathOp,
                initialMathOp = null;
            mathOp = tokens.matchAnyOpToken("+", "-", "*", "/") || tokens.matchToken('mod');
            while (mathOp) {
                initialMathOp = initialMathOp || mathOp;
                var operator = mathOp.value;
                if (initialMathOp.value !== operator) {
                    parser.raiseParseError(tokens, "You must parenthesize math operations with different operators");
                }
                var rhs = parser.parseElement("unaryExpression", tokens);
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
                mathOp = tokens.matchAnyOpToken("+", "-", "*", "/") || tokens.matchToken('mod');
            }
            return expr;
        });

        parser.addGrammarElement("mathExpression", function (parser, tokens) {
            return parser.parseAnyOf(["mathOperator", "unaryExpression"], tokens);
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

        parser.addGrammarElement("comparisonOperator", function (parser, tokens) {
            var expr = parser.parseElement("mathExpression", tokens);
            var comparisonToken = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==");
            var operator = comparisonToken ? comparisonToken.value : null;
            var hasRightValue = true; // By default, most comparisons require two values, but there are some exceptions.
            var typeCheck = false;

            if (operator == null) {
                if (tokens.matchToken("is") || tokens.matchToken("am")) {
                    if (tokens.matchToken("not")) {
                        if (tokens.matchToken("in")) {
                            operator = "not in";
                        } else if (tokens.matchToken("a") || tokens.matchToken("an")) {
                            operator = "not a";
                            typeCheck = true;
                        } else if (tokens.matchToken("empty")) {
                            operator = "not empty";
                            hasRightValue = false;
                        } else {
                            if (tokens.matchToken("really")) {
                                operator = "!==";
                            } else {
                                operator = "!=";
                            }
                            // consume additional optional syntax
                            if (tokens.matchToken("equal")) {
                                tokens.matchToken("to");
                            }
                        }
                    } else if (tokens.matchToken("in")) {
                        operator = "in";
                    } else if (tokens.matchToken("a") || tokens.matchToken("an")) {
                        operator = "a";
                        typeCheck = true;
                    } else if (tokens.matchToken("empty")) {
                        operator = "empty";
                        hasRightValue = false;
                    } else if (tokens.matchToken("less")) {
                        tokens.requireToken("than");
                        if (tokens.matchToken("or")) {
                            tokens.requireToken("equal");
                            tokens.requireToken("to");
                            operator = "<=";
                        } else {
                            operator = "<";
                        }
                    } else if (tokens.matchToken("greater")) {
                        tokens.requireToken("than");
                        if (tokens.matchToken("or")) {
                            tokens.requireToken("equal");
                            tokens.requireToken("to");
                            operator = ">=";
                        } else {
                            operator = ">";
                        }
                    } else {
                        if (tokens.matchToken("really")) {
                            operator = "===";
                        } else {
                            operator = "==";
                        }
                        if (tokens.matchToken("equal")) {
                            tokens.matchToken("to");
                        }
                    }
                } else if (tokens.matchToken("equals")) {
                    operator = "==";
                } else if (tokens.matchToken("really")) {
                    tokens.requireToken("equals")
                    operator = "===";
                } else if (tokens.matchToken("exist") || tokens.matchToken("exists")) {
                    operator = "exist";
                    hasRightValue = false;
                } else if (tokens.matchToken("matches") || tokens.matchToken("match")) {
                    operator = "match";
                } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
                    operator = "contain";
                } else if (tokens.matchToken("includes") || tokens.matchToken("include")) {
                    operator = "include";
                } else if (tokens.matchToken("do") || tokens.matchToken("does")) {
                    tokens.requireToken("not");
                    if (tokens.matchToken("matches") || tokens.matchToken("match")) {
                        operator = "not match";
                    } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
                        operator = "not contain";
                    } else if (tokens.matchToken("exist") || tokens.matchToken("exist")) {
                        operator = "not exist";
                        hasRightValue = false;
                    } else if (tokens.matchToken("include")) {
                        operator = "not include";
                    } else {
                        parser.raiseParseError(tokens, "Expected matches or contains");
                    }
                }
            }

            if (operator) {
                // Do not allow chained comparisons, which is dumb
                var typeName, nullOk, rhs
                if (typeCheck) {
                    typeName = tokens.requireTokenType("IDENTIFIER");
                    nullOk = !tokens.matchOpToken("!");
                } else if (hasRightValue) {
                    rhs = parser.requireElement("mathExpression", tokens);
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

        parser.addGrammarElement("comparisonExpression", function (parser, tokens) {
            return parser.parseAnyOf(["comparisonOperator", "mathExpression"], tokens);
        });

        parser.addGrammarElement("logicalOperator", function (parser, tokens) {
            var expr = parser.parseElement("comparisonExpression", tokens);
            var logicalOp,
                initialLogicalOp = null;
            logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
            while (logicalOp) {
                initialLogicalOp = initialLogicalOp || logicalOp;
                if (initialLogicalOp.value !== logicalOp.value) {
                    parser.raiseParseError(tokens, "You must parenthesize logical operations with different operators");
                }
                var rhs = parser.requireElement("comparisonExpression", tokens);
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
                logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
            }
            return expr;
        });

        parser.addGrammarElement("logicalExpression", function (parser, tokens) {
            return parser.parseAnyOf(["logicalOperator", "mathExpression"], tokens);
        });

        parser.addGrammarElement("asyncExpression", function (parser, tokens) {
            if (tokens.matchToken("async")) {
                var value = parser.requireElement("logicalExpression", tokens);
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
                return parser.parseElement("logicalExpression", tokens);
            }
        });

        parser.addGrammarElement("expression", function (parser, tokens) {
            tokens.matchToken("the"); // optional the
            return parser.parseElement("asyncExpression", tokens);
        });

        parser.addGrammarElement("assignableExpression", function (parser, tokens) {
            tokens.matchToken("the"); // optional the

            // TODO obviously we need to generalize this as a left hand side / targetable concept
            var expr = parser.parseElement("primaryExpression", tokens);
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
                parser.raiseParseError(
                    tokens,
                    "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
                );
            }
            return expr;
        });

        parser.addGrammarElement("hyperscript", function (parser, tokens) {
            var features = [];

            if (tokens.hasMore()) {
                while (parser.featureStart(tokens.currentToken()) || tokens.currentToken().value === "(") {
                    var feature = parser.requireElement("feature", tokens);
                    features.push(feature);
                    tokens.matchToken("end"); // optional end
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

        var parseEventArgs = function (tokens) {
            var args = [];
            // handle argument list (look ahead 3)
            if (
                tokens.token(0).value === "(" &&
                (tokens.token(1).value === ")" || tokens.token(2).value === "," || tokens.token(2).value === ")")
            ) {
                tokens.matchOpToken("(");
                do {
                    args.push(tokens.requireTokenType("IDENTIFIER"));
                } while (tokens.matchOpToken(","));
                tokens.requireOpToken(")");
            }
            return args;
        };

        parser.addFeature("on", function (parser, tokens) {
            if (!tokens.matchToken("on")) return;
            var every = false;
            if (tokens.matchToken("every")) {
                every = true;
            }
            var events = [];
            var displayName = null;
            do {
                var on = parser.requireElement("eventName", tokens, "Expected event name");

                var eventName = on.evaluate(); // OK No Promise

                if (displayName) {
                    displayName = displayName + " or " + eventName;
                } else {
                    displayName = "on " + eventName;
                }
                var args = parseEventArgs(tokens);

                var filter = null;
                if (tokens.matchOpToken("[")) {
                    filter = parser.requireElement("expression", tokens);
                    tokens.requireOpToken("]");
                }

                var startCount, endCount ,unbounded;
                if (tokens.currentToken().type === "NUMBER") {
                    var startCountToken = tokens.consumeToken();
                    if (!startCountToken.value) return;
                    startCount = parseInt(startCountToken.value);
                    if (tokens.matchToken("to")) {
                        var endCountToken = tokens.consumeToken();
                        if (!endCountToken.value) return;
                        endCount = parseInt(endCountToken.value);
                    } else if (tokens.matchToken("and")) {
                        unbounded = true;
                        tokens.requireToken("on");
                    }
                }

                var intersectionSpec, mutationSpec;
                if (eventName === "intersection") {
                    intersectionSpec = {};
                    if (tokens.matchToken("with")) {
                        intersectionSpec["with"] = parser.requireElement("expression", tokens).evaluate();
                    }
                    if (tokens.matchToken("having")) {
                        do {
                            if (tokens.matchToken("margin")) {
                                intersectionSpec["rootMargin"] = parser.requireElement("stringLike", tokens).evaluate();
                            } else if (tokens.matchToken("threshold")) {
                                intersectionSpec["threshold"] = parser.requireElement("expression", tokens).evaluate();
                            } else {
                                parser.raiseParseError(tokens, "Unknown intersection config specification");
                            }
                        } while (tokens.matchToken("and"));
                    }
                } else if (eventName === "mutation") {
                    mutationSpec = {};
                    if (tokens.matchToken("of")) {
                        do {
                            if (tokens.matchToken("anything")) {
                                mutationSpec["attributes"] = true;
                                mutationSpec["subtree"] = true;
                                mutationSpec["characterData"] = true;
                                mutationSpec["childList"] = true;
                            } else if (tokens.matchToken("childList")) {
                                mutationSpec["childList"] = true;
                            } else if (tokens.matchToken("attributes")) {
                                mutationSpec["attributes"] = true;
                                mutationSpec["attributeOldValue"] = true;
                            } else if (tokens.matchToken("subtree")) {
                                mutationSpec["subtree"] = true;
                            } else if (tokens.matchToken("characterData")) {
                                mutationSpec["characterData"] = true;
                                mutationSpec["characterDataOldValue"] = true;
                            } else if (tokens.currentToken().type === "ATTRIBUTE_REF") {
                                var attribute = tokens.consumeToken();
                                if (mutationSpec["attributeFilter"] == null) {
                                    mutationSpec["attributeFilter"] = [];
                                }
                                if (attribute.value.indexOf("@") == 0) {
                                    mutationSpec["attributeFilter"].push(attribute.value.substring(1));
                                } else {
                                    parser.raiseParseError(
                                        tokens,
                                        "Only shorthand attribute references are allowed here"
                                    );
                                }
                            } else {
                                parser.raiseParseError(tokens, "Unknown mutation config specification");
                            }
                        } while (tokens.matchToken("or"));
                    } else {
                        mutationSpec["attributes"] = true;
                        mutationSpec["characterData"] = true;
                        mutationSpec["childList"] = true;
                    }
                }

                var from = null;
                var elsewhere = false;
                if (tokens.matchToken("from")) {
                    if (tokens.matchToken("elsewhere")) {
                        elsewhere = true;
                    } else {
                        tokens.pushFollow("or");
                        try {
                            from = parser.requireElement("expression", tokens)
                        } finally {
                            tokens.popFollow();
                        }
                        if (!from) {
                            parser.raiseParseError(tokens, 'Expected either target value or "elsewhere".');
                        }
                    }
                }
                // support both "elsewhere" and "from elsewhere"
                if (from === null && elsewhere === false && tokens.matchToken("elsewhere")) {
                    elsewhere = true;
                }

                if (tokens.matchToken("in")) {
                    var inExpr = parser.parseElement('unaryExpression', tokens);
                }

                if (tokens.matchToken("debounced")) {
                    tokens.requireToken("at");
                    var timeExpr = parser.requireElement("unaryExpression", tokens);
                    var debounceTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                } else if (tokens.matchToken("throttled")) {
                    tokens.requireToken("at");
                    var timeExpr = parser.requireElement("unaryExpression", tokens);
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
            } while (tokens.matchToken("or"));

            var queueLast = true;
            if (!every) {
                if (tokens.matchToken("queue")) {
                    if (tokens.matchToken("all")) {
                        var queueAll = true;
                        var queueLast = false;
                    } else if (tokens.matchToken("first")) {
                        var queueFirst = true;
                    } else if (tokens.matchToken("none")) {
                        var queueNone = true;
                    } else {
                        tokens.requireToken("last");
                    }
                }
            }

            var start = parser.requireElement("commandList", tokens);
            parser.ensureTerminated(start);

            var errorSymbol, errorHandler;
            if (tokens.matchToken("catch")) {
                errorSymbol = tokens.requireTokenType("IDENTIFIER").value;
                errorHandler = parser.requireElement("commandList", tokens);
                parser.ensureTerminated(errorHandler);
            }

            if (tokens.matchToken("finally")) {
                var finallyHandler = parser.requireElement("commandList", tokens);
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
            parser.setParent(start, onFeature);
            return onFeature;
        });

        parser.addFeature("def", function (parser, tokens) {
            if (!tokens.matchToken("def")) return;
            var functionName = parser.requireElement("dotOrColonPath", tokens);
            var nameVal = functionName.evaluate(); // OK
            var nameSpace = nameVal.split(".");
            var funcName = nameSpace.pop();

            var args = [];
            if (tokens.matchOpToken("(")) {
                if (tokens.matchOpToken(")")) {
                    // empty args list
                } else {
                    do {
                        args.push(tokens.requireTokenType("IDENTIFIER"));
                    } while (tokens.matchOpToken(","));
                    tokens.requireOpToken(")");
                }
            }

            var start = parser.requireElement("commandList", tokens);

            var errorSymbol, errorHandler;
            if (tokens.matchToken("catch")) {
                errorSymbol = tokens.requireTokenType("IDENTIFIER").value;
                errorHandler = parser.parseElement("commandList", tokens);
            }

            if (tokens.matchToken("finally")) {
                var finallyHandler = parser.requireElement("commandList", tokens);
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

            parser.setParent(start, functionFeature);
            return functionFeature;
        });

        parser.addFeature("set", function (parser, tokens) {
            let setCmd = parser.parseElement("setCommand", tokens);
            if (setCmd) {
                if (setCmd.target.scope !== "element") {
                    parser.raiseParseError(tokens, "variables declared at the feature level must be element scoped.");
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

        parser.addFeature("init", function (parser, tokens) {
            if (!tokens.matchToken("init")) return;

            var immediately = tokens.matchToken("immediately");

            var start = parser.requireElement("commandList", tokens);
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
            parser.setParent(start, initFeature);
            return initFeature;
        });

        parser.addFeature("worker", function (parser, tokens) {
            if (tokens.matchToken("worker")) {
                parser.raiseParseError(
                    tokens,
                    "In order to use the 'worker' feature, include " +
                        "the _hyperscript worker plugin. See " +
                        "https://hyperscript.org/features/worker/ for " +
                        "more info."
                );
                return undefined
            }
        });

        parser.addFeature("behavior", function (parser, tokens) {
            if (!tokens.matchToken("behavior")) return;
            var path = parser.requireElement("dotOrColonPath", tokens).evaluate();
            var nameSpace = path.split(".");
            var name = nameSpace.pop();

            var formalParams = [];
            if (tokens.matchOpToken("(") && !tokens.matchOpToken(")")) {
                do {
                    formalParams.push(tokens.requireTokenType("IDENTIFIER").value);
                } while (tokens.matchOpToken(","));
                tokens.requireOpToken(")");
            }
            var hs = parser.requireElement("hyperscript", tokens);
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

        parser.addFeature("install", function (parser, tokens) {
            if (!tokens.matchToken("install")) return;
            var behaviorPath = parser.requireElement("dotOrColonPath", tokens).evaluate();
            var behaviorNamespace = behaviorPath.split(".");
            var args = parser.parseElement("namedArgumentList", tokens);

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

        parser.addGrammarElement("jsBody", function (parser, tokens) {
            var jsSourceStart = tokens.currentToken().start;
            var jsLastToken = tokens.currentToken();

            var funcNames = [];
            var funcName = "";
            var expectFunctionDeclaration = false;
            while (tokens.hasMore()) {
                jsLastToken = tokens.consumeToken();
                var peek = tokens.token(0, true);
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
                jsSource: tokens.source.substring(jsSourceStart, jsSourceEnd),
            };
        });

        parser.addFeature("js", function (parser, tokens) {
            if (!tokens.matchToken("js")) return;
            var jsBody = parser.requireElement("jsBody", tokens);

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

        parser.addCommand("js", function (parser, tokens) {
            if (!tokens.matchToken("js")) return;
            // Parse inputs
            var inputs = [];
            if (tokens.matchOpToken("(")) {
                if (tokens.matchOpToken(")")) {
                    // empty input list
                } else {
                    do {
                        var inp = tokens.requireTokenType("IDENTIFIER");
                        inputs.push(inp.value);
                    } while (tokens.matchOpToken(","));
                    tokens.requireOpToken(")");
                }
            }

            var jsBody = parser.requireElement("jsBody", tokens);
            tokens.matchToken("end");

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
                    var result = func.apply(globalScope, args);
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

        parser.addCommand("async", function (parser, tokens) {
            if (!tokens.matchToken("async")) return;
            if (tokens.matchToken("do")) {
                var body = parser.requireElement("commandList", tokens);

                // Append halt
                var end = body;
                while (end.next) end = end.next;
                end.next = Runtime.HALT;

                tokens.requireToken("end");
            } else {
                var body = parser.requireElement("command", tokens);
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
            parser.setParent(body, command);
            return command;
        });

        parser.addCommand("tell", function (parser, tokens) {
            var startToken = tokens.currentToken();
            if (!tokens.matchToken("tell")) return;
            var value = parser.requireElement("expression", tokens);
            var body = parser.requireElement("commandList", tokens);
            if (tokens.hasMore() && !parser.featureStart(tokens.currentToken())) {
                tokens.requireToken("end");
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
            parser.setParent(body, tellCmd);
            return tellCmd;
        });

        parser.addCommand("wait", function (parser, tokens) {
            if (!tokens.matchToken("wait")) return;
            var command;

            // wait on event
            if (tokens.matchToken("for")) {
                tokens.matchToken("a"); // optional "a"
                var events = [];
                do {
                    var lookahead = tokens.token(0);
                    if (lookahead.type === 'NUMBER' || lookahead.type === 'L_PAREN') {
                        events.push({
                            time: parser.requireElement('expression', tokens).evaluate() // TODO: do we want to allow async here?
                        })
                    } else {
                        events.push({
                            name: parser.requireElement("dotOrColonPath", tokens, "Expected event name").evaluate(),
                            args: parseEventArgs(tokens),
                        });
                    }
                } while (tokens.matchToken("or"));

                if (tokens.matchToken("from")) {
                    var on = parser.requireElement("expression", tokens);
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
                if (tokens.matchToken("a")) {
                    tokens.requireToken("tick");
                    time = 0;
                } else {
                    time = parser.requireElement("expression", tokens);
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
        parser.addGrammarElement("dotOrColonPath", function (parser, tokens) {
            var root = tokens.matchTokenType("IDENTIFIER");
            if (root) {
                var path = [root.value];

                var separator = tokens.matchOpToken(".") || tokens.matchOpToken(":");
                if (separator) {
                    do {
                        path.push(tokens.requireTokenType("IDENTIFIER", "NUMBER").value);
                    } while (tokens.matchOpToken(separator.value));
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


        parser.addGrammarElement("eventName", function (parser, tokens) {
            var token;
            if ((token = tokens.matchTokenType("STRING"))) {
                return {
                    evaluate: function() {
                        return token.value;
                    },
                };
            }

            return parser.parseElement("dotOrColonPath", tokens);
        });

        function parseSendCmd(cmdType, parser, tokens) {
            var eventName = parser.requireElement("eventName", tokens);

            var details = parser.parseElement("namedArgumentList", tokens);
            if ((cmdType === "send" && tokens.matchToken("to")) ||
                (cmdType === "trigger" && tokens.matchToken("on"))) {
                var toExpr = parser.requireElement("expression", tokens);
            } else {
                var toExpr = parser.requireElement("implicitMeTarget", tokens);
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

        parser.addCommand("trigger", function (parser, tokens) {
            if (tokens.matchToken("trigger")) {
                return parseSendCmd("trigger", parser, tokens);
            }
        });

        parser.addCommand("send", function (parser, tokens) {
            if (tokens.matchToken("send")) {
                return parseSendCmd("send", parser, tokens);
            }
        });

        var parseReturnFunction = function (parser, tokens, returnAValue) {
            if (returnAValue) {
                if (parser.commandBoundary(tokens.currentToken())) {
                    parser.raiseParseError(tokens, "'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
                } else {
                    var value = parser.requireElement("expression", tokens);
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

        parser.addCommand("return", function (parser, tokens) {
            if (tokens.matchToken("return")) {
                return parseReturnFunction(parser, tokens, true);
            }
        });

        parser.addCommand("exit", function (parser, tokens) {
            if (tokens.matchToken("exit")) {
                return parseReturnFunction(parser, tokens, false);
            }
        });

        parser.addCommand("halt", function (parser, tokens) {
            if (tokens.matchToken("halt")) {
                if (tokens.matchToken("the")) {
                    tokens.requireToken("event");
                    // optional possessive
                    if (tokens.matchOpToken("'")) {
                        tokens.requireToken("s");
                    }
                    var keepExecuting = true;
                }
                if (tokens.matchToken("bubbling")) {
                    var bubbling = true;
                } else if (tokens.matchToken("default")) {
                    var haltDefault = true;
                }
                var exit = parseReturnFunction(parser, tokens, false);

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

        parser.addCommand("log", function (parser, tokens) {
            if (!tokens.matchToken("log")) return;
            var exprs = [parser.parseElement("expression", tokens)];
            while (tokens.matchOpToken(",")) {
                exprs.push(parser.requireElement("expression", tokens));
            }
            if (tokens.matchToken("with")) {
                var withExpr = parser.requireElement("expression", tokens);
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

        parser.addCommand("beep!", function (parser, tokens) {
            if (!tokens.matchToken("beep!")) return;
            var exprs = [parser.parseElement("expression", tokens)];
            while (tokens.matchOpToken(",")) {
                exprs.push(parser.requireElement("expression", tokens));
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

        parser.addCommand("throw", function (parser, tokens) {
            if (!tokens.matchToken("throw")) return;
            var expr = parser.requireElement("expression", tokens);
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

        var parseCallOrGet = function (parser, tokens) {
            var expr = parser.requireElement("expression", tokens);
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
        parser.addCommand("call", function (parser, tokens) {
            if (!tokens.matchToken("call")) return;
            var call = parseCallOrGet(parser, tokens);
            if (call.expr && call.expr.type !== "functionCall") {
                parser.raiseParseError(tokens, "Must be a function invocation");
            }
            return call;
        });
        parser.addCommand("get", function (parser, tokens) {
            if (tokens.matchToken("get")) {
                return parseCallOrGet(parser, tokens);
            }
        });

        parser.addCommand("make", function (parser, tokens) {
            if (!tokens.matchToken("make")) return;
            tokens.matchToken("a") || tokens.matchToken("an");

            var expr = parser.requireElement("expression", tokens);

            var args = [];
            if (expr.type !== "queryRef" && tokens.matchToken("from")) {
                do {
                    args.push(parser.requireElement("expression", tokens));
                } while (tokens.matchOpToken(","));
            }

            if (tokens.matchToken("called")) {
                var target = parser.requireElement("symbol", tokens);
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

        parser.addGrammarElement("pseudoCommand", function (parser, tokens) {

            let lookAhead = tokens.token(1);
            if (!(lookAhead && lookAhead.op && (lookAhead.value === '.' || lookAhead.value === "("))) {
                return null;
            }

            var expr = parser.requireElement("primaryExpression", tokens);

            var rootRoot = expr.root;
            var root = expr;
            while (rootRoot.root != null) {
                root = root.root;
                rootRoot = rootRoot.root;
            }

            if (expr.type !== "functionCall") {
                parser.raiseParseError(tokens, "Pseudo-commands must be function calls");
            }

            if (root.type === "functionCall" && root.root.root == null) {
                if (tokens.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
                    var realRoot = parser.requireElement("expression", tokens);
                } else if (tokens.matchToken("me")) {
                    var realRoot = parser.requireElement("implicitMeTarget", tokens);
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
        var makeSetter = function (parser, tokens, target, value) {

            var symbolWrite = target.type === "symbol";
            var attributeWrite = target.type === "attributeRef";
            var styleWrite = target.type === "styleRef";
            var arrayWrite = target.type === "arrayIndex";

            if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
                parser.raiseParseError(tokens, "Can only put directly into symbols, not references");
            }

            var rootElt = null;
            var prop = null;
            if (symbolWrite) {
                // rootElt is null
            } else if (attributeWrite || styleWrite) {
                rootElt = parser.requireElement("implicitMeTarget", tokens);
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

        parser.addCommand("default", function (parser, tokens) {
            if (!tokens.matchToken("default")) return;
            var target = parser.requireElement("assignableExpression", tokens);
            tokens.requireToken("to");

            var value = parser.requireElement("expression", tokens);

            /** @type {ASTNode} */
            var setter = makeSetter(parser, tokens, target, value);
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

        parser.addCommand("set", function (parser, tokens) {
            if (!tokens.matchToken("set")) return;
            if (tokens.currentToken().type === "L_BRACE") {
                var obj = parser.requireElement("objectLiteral", tokens);
                tokens.requireToken("on");
                var target = parser.requireElement("expression", tokens);

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
                tokens.pushFollow("to");
                var target = parser.requireElement("assignableExpression", tokens);
            } finally {
                tokens.popFollow();
            }
            tokens.requireToken("to");
            var value = parser.requireElement("expression", tokens);
            return makeSetter(parser, tokens, target, value);
        });

        parser.addCommand("if", function (parser, tokens) {
            if (!tokens.matchToken("if")) return;
            var expr = parser.requireElement("expression", tokens);
            tokens.matchToken("then"); // optional 'then'
            var trueBranch = parser.parseElement("commandList", tokens);
            var nestedIfStmt = false;
            let elseToken = tokens.matchToken("else") || tokens.matchToken("otherwise");
            if (elseToken) {
                let elseIfIfToken = tokens.peekToken("if");
                nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
                if (nestedIfStmt) {
                    var falseBranch = parser.parseElement("command", tokens);
                } else {
                    var falseBranch = parser.parseElement("commandList", tokens);
                }
            }
            if (tokens.hasMore() && !nestedIfStmt) {
                tokens.requireToken("end");
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
            parser.setParent(trueBranch, ifCmd);
            parser.setParent(falseBranch, ifCmd);
            return ifCmd;
        });

        var parseRepeatExpression = function (parser, tokens, startedWithForToken) {
            var innerStartToken = tokens.currentToken();
            var identifier;
            if (tokens.matchToken("for") || startedWithForToken) {
                var identifierToken = tokens.requireTokenType("IDENTIFIER");
                identifier = identifierToken.value;
                tokens.requireToken("in");
                var expression = parser.requireElement("expression", tokens);
            } else if (tokens.matchToken("in")) {
                identifier = "it";
                var expression = parser.requireElement("expression", tokens);
            } else if (tokens.matchToken("while")) {
                var whileExpr = parser.requireElement("expression", tokens);
            } else if (tokens.matchToken("until")) {
                var isUntil = true;
                if (tokens.matchToken("event")) {
                    var evt = parser.requireElement("dotOrColonPath", tokens, "Expected event name");
                    if (tokens.matchToken("from")) {
                        var on = parser.requireElement("expression", tokens);
                    }
                } else {
                    var whileExpr = parser.requireElement("expression", tokens);
                }
            } else {
                if (!parser.commandBoundary(tokens.currentToken()) &&
                    tokens.currentToken().value !== 'forever') {
                    var times = parser.requireElement("expression", tokens);
                    tokens.requireToken("times");
                } else {
                    tokens.matchToken("forever"); // consume optional forever
                    var forever = true;
                }
            }

            if (tokens.matchToken("index")) {
                var identifierToken = tokens.requireTokenType("IDENTIFIER");
                var indexIdentifier = identifierToken.value;
            } else if (tokens.matchToken("indexed")) {
                tokens.requireToken("by");
                var identifierToken = tokens.requireTokenType("IDENTIFIER");
                var indexIdentifier = identifierToken.value;
            }

            var loop = parser.parseElement("commandList", tokens);
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
            if (tokens.hasMore()) {
                tokens.requireToken("end");
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
            parser.setParent(loop, repeatCmd);
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
            parser.setParent(repeatCmd, repeatInit);
            return repeatInit;
        };

        parser.addCommand("repeat", function (parser, tokens) {
            if (tokens.matchToken("repeat")) {
                return parseRepeatExpression(parser, tokens, false);
            }
        });

        parser.addCommand("for", function (parser, tokens) {
            if (tokens.matchToken("for")) {
                return parseRepeatExpression(parser, tokens, true);
            }
        });

      parser.addCommand("continue", function (parser, tokens) {

        if (!tokens.matchToken("continue")) return;

        var command = {
          op: function (context) {

            // scan for the closest repeat statement
            for (var parent = this.parent ; true ; parent = parent.parent) {

              if (parent == undefined) {
                parser.raiseParseError(tokens, "Command `continue` cannot be used outside of a `repeat` loop.")
              }
              if (parent.loop != undefined) {
                return parent.resolveNext(context)
              }
            }
          }
        };
        return command;
      });

      parser.addCommand("break", function (parser, tokens) {

        if (!tokens.matchToken("break")) return;

        var command = {
          op: function (context) {

            // scan for the closest repeat statement
            for (var parent = this.parent ; true ; parent = parent.parent) {

              if (parent == undefined) {
                parser.raiseParseError(tokens, "Command `continue` cannot be used outside of a `repeat` loop.")
              }
              if (parent.loop != undefined) {
                  return context.meta.runtime.findNext(parent.parent, context);
              }
            }
          }
        };
        return command;
      });

        parser.addGrammarElement("stringLike", function (parser, tokens) {
            return parser.parseAnyOf(["string", "nakedString"], tokens);
        });

        parser.addCommand("append", function (parser, tokens) {
            if (!tokens.matchToken("append")) return;
            var targetExpr = null;

            var value = parser.requireElement("expression", tokens);

            /** @type {ASTNode} */
            var implicitResultSymbol = {
                type: "symbol",
                evaluate: function (context) {
                    return context.meta.runtime.resolveSymbol("result", context);
                },
            };

            if (tokens.matchToken("to")) {
                targetExpr = parser.requireElement("expression", tokens);
            } else {
                targetExpr = implicitResultSymbol;
            }

            var setter = null;
            if (targetExpr.type === "symbol" || targetExpr.type === "attributeRef" || targetExpr.root != null) {
                setter = makeSetter(parser, tokens, targetExpr, implicitResultSymbol);
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

        function parsePickRange(parser, tokens) {
            tokens.matchToken("at") || tokens.matchToken("from");
            const rv = { includeStart: true, includeEnd: false }

            rv.from = tokens.matchToken("start") ? 0 : parser.requireElement("expression", tokens)

            if (tokens.matchToken("to") || tokens.matchOpToken("..")) {
              if (tokens.matchToken("end")) {
                rv.toEnd = true;
              } else {
                rv.to = parser.requireElement("expression", tokens);
              }
            }

            if (tokens.matchToken("inclusive")) rv.includeEnd = true;
            else if (tokens.matchToken("exclusive")) rv.includeStart = false;

            return rv;
        }

        // RegExpIterator and RegExpIterable are now imported from ./core/util.js

        parser.addCommand("pick", (parser, tokens) => {
          if (!tokens.matchToken("pick")) return;

          tokens.matchToken("the");

          if (tokens.matchToken("item") || tokens.matchToken("items")
           || tokens.matchToken("character") || tokens.matchToken("characters")) {
            const range = parsePickRange(parser, tokens);

            tokens.requireToken("from");
            const root = parser.requireElement("expression", tokens);

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

          if (tokens.matchToken("match")) {
            tokens.matchToken("of");
            const re = parser.parseElement("expression", tokens);
            let flags = ""
            if (tokens.matchOpToken("|")) {
              flags = tokens.requireTokenType("IDENTIFIER").value;
            }

            tokens.requireToken("from");
            const root = parser.parseElement("expression", tokens);

            return {
              args: [root, re],
              op(ctx, root, re) {
                ctx.result = new RegExp(re, flags).exec(root);
                return context.meta.runtime.findNext(this, ctx);
              }
            }
          }

          if (tokens.matchToken("matches")) {
            tokens.matchToken("of");
            const re = parser.parseElement("expression", tokens);
            let flags = "gu"
            if (tokens.matchOpToken("|")) {
              flags = 'g' + tokens.requireTokenType("IDENTIFIER").value.replace('g', '');
            }

            tokens.requireToken("from");
            const root = parser.parseElement("expression", tokens);

            return {
              args: [root, re],
              op(ctx, root, re) {
                ctx.result = new RegExpIterable(re, flags, root);
                return context.meta.runtime.findNext(this, ctx);
              }
            }
          }
        });

        parser.addCommand("increment", function (parser, tokens) {
            if (!tokens.matchToken("increment")) return;
            var amountExpr;

            // This is optional.  Defaults to "result"
            var target = parser.parseElement("assignableExpression", tokens);

            // This is optional. Defaults to 1.
            if (tokens.matchToken("by")) {
                amountExpr = parser.requireElement("expression", tokens);
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

            return makeSetter(parser, tokens, target, implicitIncrementOp);
        });

        parser.addCommand("decrement", function (parser, tokens) {
            if (!tokens.matchToken("decrement")) return;
            var amountExpr;

            // This is optional.  Defaults to "result"
            var target = parser.parseElement("assignableExpression", tokens);

            // This is optional. Defaults to 1.
            if (tokens.matchToken("by")) {
                amountExpr = parser.requireElement("expression", tokens);
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

            return makeSetter(parser, tokens, target, implicitDecrementOp);
        });

        function parseConversionInfo(tokens, parser) {
            var type = "text";
            var conversion;
            tokens.matchToken("a") || tokens.matchToken("an");
            if (tokens.matchToken("json") || tokens.matchToken("Object")) {
                type = "json";
            } else if (tokens.matchToken("response")) {
                type = "response";
            } else if (tokens.matchToken("html")) {
                type = "html";
            } else if (tokens.matchToken("text")) {
                // default, ignore
            } else {
                conversion = parser.requireElement("dotOrColonPath", tokens).evaluate();
            }
            return {type, conversion};
        }

        parser.addCommand("fetch", function (parser, tokens) {
            if (!tokens.matchToken("fetch")) return;
            var url = parser.requireElement("stringLike", tokens);

            if (tokens.matchToken("as")) {
                var conversionInfo = parseConversionInfo(tokens, parser);
            }

            if (tokens.matchToken("with") && tokens.currentToken().value !== "{") {
                var args = parser.parseElement("nakedNamedArgumentList", tokens);
            } else {
                var args = parser.parseElement("objectLiteral", tokens);
            }

            if (conversionInfo == null && tokens.matchToken("as")) {
                conversionInfo = parseConversionInfo(tokens, parser);
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
