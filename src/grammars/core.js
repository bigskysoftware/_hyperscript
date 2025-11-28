// Core grammar for _hyperscript
import { Runtime } from '../core/runtime.js';

// Expression imports
import { IdRef, ClassRef, QueryRef, AttributeRef, StyleRef } from '../parsetree/expressions/webliterals.js';
import {
    ParenthesizedExpression, BlockLiteral, NegativeNumber, LogicalNot, SymbolRef, BeepExpression,
    PropertyAccess, OfExpression, PossessiveExpression, InExpression, AsExpression, FunctionCall,
    AttributeRefAccess, ArrayIndex, MathOperator, MathExpression, ComparisonOperator,
    ComparisonExpression, LogicalOperator, LogicalExpression, AsyncExpression
} from '../parsetree/expressions/expressions.js';
import {
    NakedString, StringLiteral, NumberLiteral, BooleanLiteral, NullLiteral,
    ArrayLiteral, ObjectKey, ObjectLiteral, NamedArgumentList
} from '../parsetree/expressions/literals.js';
import { ImplicitMeTarget } from '../parsetree/expressions/targets.js';
import { NoExpression, SomeExpression } from '../parsetree/expressions/existentials.js';
import { RelativePositionalExpression, PositionalExpression } from '../parsetree/expressions/positional.js';
import { StringPostfixExpression, TimeExpression, TypeCheckExpression } from '../parsetree/expressions/postfix.js';

// Command imports
import {
    LogCommand, BeepCommand, ThrowCommand, ReturnCommand, ExitCommand, HaltCommand,
    MakeCommand, AppendCommand, PickCommand, FetchCommand, GoCommand
} from '../parsetree/commands/basic.js';
import { SetCommand, DefaultCommand, IncrementCommand, DecrementCommand } from '../parsetree/commands/setters.js';
import { WaitCommand, TriggerCommand, SendCommand } from '../parsetree/commands/events.js';
import { IfCommand, RepeatCommand, ForCommand, ContinueCommand, BreakCommand, TellCommand } from '../parsetree/commands/controlflow.js';
import { JsBody, JsCommand, AsyncCommand, CallCommand, GetCommand } from '../parsetree/commands/execution.js';

// Feature imports
import { SetFeature } from '../parsetree/features/set.js';
import { InitFeature } from '../parsetree/features/init.js';
import { WorkerFeature } from '../parsetree/features/worker.js';
import { BehaviorFeature } from '../parsetree/features/behavior.js';
import { InstallFeature } from '../parsetree/features/install.js';
import { JsFeature } from '../parsetree/features/js.js';
import { DefFeature } from '../parsetree/features/def.js';
import { OnFeature } from '../parsetree/features/on.js';

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

        parser.addGrammarElement("objectKey", ObjectKey.parse);

        parser.addLeafExpression("objectLiteral", ObjectLiteral.parse);

        parser.addGrammarElement("nakedNamedArgumentList", NamedArgumentList.parseNaked);

        parser.addGrammarElement("namedArgumentList", NamedArgumentList.parse);

        parser.addGrammarElement("symbol", SymbolRef.parse);

        parser.addGrammarElement("implicitMeTarget", ImplicitMeTarget.parse);

        parser.addLeafExpression("boolean", BooleanLiteral.parse);

        parser.addLeafExpression("null", NullLiteral.parse);

        parser.addLeafExpression("arrayLiteral", ArrayLiteral.parse);

        parser.addLeafExpression("blockLiteral", BlockLiteral.parse);

        parser.addIndirectExpression("propertyAccess", PropertyAccess.parse);

        parser.addIndirectExpression("of", OfExpression.parse);

        parser.addIndirectExpression("possessive", PossessiveExpression.parse);

        parser.addIndirectExpression("inExpression", InExpression.parse);

        parser.addIndirectExpression("asExpression", AsExpression.parse);

        parser.addIndirectExpression("functionCall", FunctionCall.parse);

        parser.addIndirectExpression("attributeRefAccess", AttributeRefAccess.parse);

        parser.addIndirectExpression("arrayIndex", ArrayIndex.parse);

        parser.addGrammarElement("postfixExpression", function (helper) {
            var root = helper.parseElement("negativeNumber");

            return StringPostfixExpression.parse(helper, root) ||
                   TimeExpression.parse(helper, root) ||
                   TypeCheckExpression.parse(helper, root) ||
                   root;
        });

        parser.addGrammarElement("logicalNot", LogicalNot.parse);

        parser.addGrammarElement("noExpression", NoExpression.parse);

        parser.addLeafExpression("some", SomeExpression.parse);

        parser.addGrammarElement("negativeNumber", NegativeNumber.parse);

        parser.addGrammarElement("unaryExpression", function (helper) {
            helper.matchToken("the"); // optional "the"
            return helper.parseAnyOf(["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"]);
        });

        parser.addGrammarElement("beepExpression", BeepExpression.parse);

        parser.addGrammarElement("relativePositionalExpression", RelativePositionalExpression.parse);

        parser.addGrammarElement("positionalExpression", PositionalExpression.parse);

        parser.addGrammarElement("mathOperator", MathOperator.parse);

        parser.addGrammarElement("mathExpression", MathExpression.parse);

        parser.addGrammarElement("comparisonOperator", ComparisonOperator.parse);

        parser.addGrammarElement("comparisonExpression", ComparisonExpression.parse);

        parser.addGrammarElement("logicalOperator", LogicalOperator.parse);

        parser.addGrammarElement("logicalExpression", LogicalExpression.parse);

        parser.addGrammarElement("asyncExpression", AsyncExpression.parse);

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

        parser.addFeature("on", function (helper) {
            return OnFeature.parse(helper, parser);
        });

        parser.addFeature("def", function (helper) {
            return DefFeature.parse(helper, parser);
        });

        parser.addFeature("set", function (helper) {
            return SetFeature.parse(helper, parser);
        });

        parser.addFeature("init", function (helper) {
            return InitFeature.parse(helper, parser);
        });

        parser.addFeature("worker", WorkerFeature.parse);

        parser.addFeature("behavior", BehaviorFeature.parse);

        parser.addFeature("install", InstallFeature.parse);

        parser.addGrammarElement("jsBody", JsBody.parse);

        parser.addFeature("js", JsFeature.parse);

        parser.addCommand("js", JsCommand.parse);

        parser.addCommand("async", AsyncCommand.parse);

        parser.addCommand("tell", TellCommand.parse);

        parser.addCommand("wait", WaitCommand.parse);

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

        parser.addCommand("trigger", TriggerCommand.parse);

        parser.addCommand("send", SendCommand.parse);

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

        parser.addCommand("return", ReturnCommand.parse);

        parser.addCommand("exit", ExitCommand.parse);

        parser.addCommand("halt", HaltCommand.parse);

        parser.addCommand("log", LogCommand.parse);

        parser.addCommand("beep!", BeepCommand.parse);

        parser.addCommand("throw", ThrowCommand.parse);

        parser.addCommand("call", CallCommand.parse);

        parser.addCommand("get", GetCommand.parse);

        parser.addCommand("make", MakeCommand.parse);

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

        parser.addCommand("default", DefaultCommand.parse);

        parser.addCommand("set", SetCommand.parse);

        parser.addCommand("if", IfCommand.parse);

        parser.addCommand("repeat", RepeatCommand.parse);

        parser.addCommand("for", ForCommand.parse);

        parser.addCommand("continue", ContinueCommand.parse);

        parser.addCommand("break", BreakCommand.parse);

        parser.addGrammarElement("stringLike", function (helper) {
            return helper.parseAnyOf(["string", "nakedString"]);
        });

        parser.addCommand("append", function (helper) {
            return AppendCommand.parse(helper, makeSetter);
        });

        parser.addCommand("pick", PickCommand.parse);

        parser.addCommand("increment", IncrementCommand.parse);

        parser.addCommand("decrement", DecrementCommand.parse);

        parser.addCommand("fetch", FetchCommand.parse);
}
