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
import { PseudoCommand } from '../parsetree/commands/pseudoCommand.js';

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
 * @param {LanguageKernel} kernel
 */
export default function hyperscriptCoreGrammar(kernel) {
        kernel.addLeafExpression("parenthesized", ParenthesizedExpression.parse);

        kernel.addLeafExpression("string", StringLiteral.parse);

        kernel.addGrammarElement("nakedString", NakedString.parse);

        kernel.addLeafExpression("number", NumberLiteral.parse);

        kernel.addLeafExpression("idRef", IdRef.parse);

        kernel.addLeafExpression("classRef", ClassRef.parse);

        // TemplatedQueryElementCollection is now imported from ./core/util.js

        kernel.addLeafExpression("queryRef", QueryRef.parse);

        kernel.addLeafExpression("attributeRef", AttributeRef.parse);

        kernel.addLeafExpression("styleRef", StyleRef.parse);

        kernel.addGrammarElement("objectKey", ObjectKey.parse);

        kernel.addLeafExpression("objectLiteral", ObjectLiteral.parse);

        kernel.addGrammarElement("nakedNamedArgumentList", NamedArgumentList.parseNaked);

        kernel.addGrammarElement("namedArgumentList", NamedArgumentList.parse);

        kernel.addGrammarElement("symbol", SymbolRef.parse);

        kernel.addGrammarElement("implicitMeTarget", ImplicitMeTarget.parse);

        kernel.addLeafExpression("boolean", BooleanLiteral.parse);

        kernel.addLeafExpression("null", NullLiteral.parse);

        kernel.addLeafExpression("arrayLiteral", ArrayLiteral.parse);

        kernel.addLeafExpression("blockLiteral", BlockLiteral.parse);

        kernel.addIndirectExpression("propertyAccess", PropertyAccess.parse);

        kernel.addIndirectExpression("of", OfExpression.parse);

        kernel.addIndirectExpression("possessive", PossessiveExpression.parse);

        kernel.addIndirectExpression("inExpression", InExpression.parse);

        kernel.addIndirectExpression("asExpression", AsExpression.parse);

        kernel.addIndirectExpression("functionCall", FunctionCall.parse);

        kernel.addIndirectExpression("attributeRefAccess", AttributeRefAccess.parse);

        kernel.addIndirectExpression("arrayIndex", ArrayIndex.parse);

        kernel.addGrammarElement("postfixExpression", function (parser) {
            var root = parser.parseElement("negativeNumber");

            return StringPostfixExpression.parse(parser, root) ||
                   TimeExpression.parse(parser, root) ||
                   TypeCheckExpression.parse(parser, root) ||
                   root;
        });

        kernel.addGrammarElement("logicalNot", LogicalNot.parse);

        kernel.addGrammarElement("noExpression", NoExpression.parse);

        kernel.addLeafExpression("some", SomeExpression.parse);

        kernel.addGrammarElement("negativeNumber", NegativeNumber.parse);

        kernel.addGrammarElement("unaryExpression", function (parser) {
            parser.matchToken("the"); // optional "the"
            return parser.parseAnyOf(["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"]);
        });

        kernel.addGrammarElement("beepExpression", BeepExpression.parse);

        kernel.addGrammarElement("relativePositionalExpression", RelativePositionalExpression.parse);

        kernel.addGrammarElement("positionalExpression", PositionalExpression.parse);

        kernel.addGrammarElement("mathOperator", MathOperator.parse);

        kernel.addGrammarElement("mathExpression", MathExpression.parse);

        kernel.addGrammarElement("comparisonOperator", ComparisonOperator.parse);

        kernel.addGrammarElement("comparisonExpression", ComparisonExpression.parse);

        kernel.addGrammarElement("logicalOperator", LogicalOperator.parse);

        kernel.addGrammarElement("logicalExpression", LogicalExpression.parse);

        kernel.addGrammarElement("asyncExpression", AsyncExpression.parse);

        kernel.addGrammarElement("expression", function (parser) {
            parser.matchToken("the"); // optional the
            return parser.parseElement("asyncExpression");
        });

        kernel.addGrammarElement("assignableExpression", function (parser) {
            parser.matchToken("the"); // optional the

            // TODO obviously we need to generalize this as a left hand side / targetable concept
            var expr = parser.parseElement("primaryExpression");
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
                    "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
                );
            }
            return expr;
        });

        kernel.addGrammarElement("hyperscript", function (parser) {
            var features = [];

            if (parser.hasMore()) {
                while (parser.featureStart(parser.currentToken()) || parser.currentToken().value === "(") {
                    var feature = parser.requireElement("feature");
                    features.push(feature);
                    parser.matchToken("end"); // optional end
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

        kernel.addFeature("on", function (parser) {
            return OnFeature.parse(parser, kernel);
        });

        kernel.addFeature("def", function (parser) {
            return DefFeature.parse(parser, kernel);
        });

        kernel.addFeature("set", function (parser) {
            return SetFeature.parse(parser, kernel);
        });

        kernel.addFeature("init", function (parser) {
            return InitFeature.parse(parser, kernel);
        });

        kernel.addFeature("worker", WorkerFeature.parse);

        kernel.addFeature("behavior", BehaviorFeature.parse);

        kernel.addFeature("install", InstallFeature.parse);

        kernel.addGrammarElement("jsBody", JsBody.parse);

        kernel.addFeature("js", JsFeature.parse);

        kernel.addCommand("js", JsCommand.parse);

        kernel.addCommand("async", AsyncCommand.parse);

        kernel.addCommand("tell", TellCommand.parse);

        kernel.addCommand("wait", WaitCommand.parse);

        // TODO  - colon path needs to eventually become part of ruby-style symbols
        kernel.addGrammarElement("dotOrColonPath", function (parser) {
            var root = parser.matchTokenType("IDENTIFIER");
            if (root) {
                var path = [root.value];

                var separator = parser.matchOpToken(".") || parser.matchOpToken(":");
                if (separator) {
                    do {
                        path.push(parser.requireTokenType("IDENTIFIER", "NUMBER").value);
                    } while (parser.matchOpToken(separator.value));
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


        kernel.addGrammarElement("eventName", function (parser) {
            var token;
            if ((token = parser.matchTokenType("STRING"))) {
                return {
                    evaluate: function() {
                        return token.value;
                    },
                };
            }

            return parser.parseElement("dotOrColonPath");
        });

        kernel.addCommand("trigger", TriggerCommand.parse);

        kernel.addCommand("send", SendCommand.parse);

        kernel.addCommand("return", ReturnCommand.parse);

        kernel.addCommand("exit", ExitCommand.parse);

        kernel.addCommand("halt", HaltCommand.parse);

        kernel.addCommand("log", LogCommand.parse);

        kernel.addCommand("beep!", BeepCommand.parse);

        kernel.addCommand("throw", ThrowCommand.parse);

        kernel.addCommand("call", CallCommand.parse);

        kernel.addCommand("get", GetCommand.parse);

        kernel.addCommand("make", MakeCommand.parse);

        kernel.addGrammarElement("pseudoCommand", PseudoCommand.parse);

        /**
        * @param {LanguageKernel} parser
        * @param {Runtime} runtime
        * @param {Tokens} tokens
        * @param {*} target
        * @param {*} value
        * @returns
        */
        var makeSetter = function (parser, target, value) {

            var symbolWrite = target.type === "symbol";
            var attributeWrite = target.type === "attributeRef";
            var styleWrite = target.type === "styleRef";
            var arrayWrite = target.type === "arrayIndex";

            if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
                parser.raiseParseError("Can only put directly into symbols, not references");
            }

            var rootElt = null;
            var prop = null;
            if (symbolWrite) {
                // rootElt is null
            } else if (attributeWrite || styleWrite) {
                rootElt = parser.requireElement("implicitMeTarget");
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

        kernel.addCommand("default", DefaultCommand.parse);

        kernel.addCommand("set", SetCommand.parse);

        kernel.addCommand("if", IfCommand.parse);

        kernel.addCommand("repeat", RepeatCommand.parse);

        kernel.addCommand("for", ForCommand.parse);

        kernel.addCommand("continue", ContinueCommand.parse);

        kernel.addCommand("break", BreakCommand.parse);

        kernel.addGrammarElement("stringLike", function (parser) {
            return parser.parseAnyOf(["string", "nakedString"]);
        });

        kernel.addCommand("append", function (parser) {
            return AppendCommand.parse(parser, makeSetter);
        });

        kernel.addCommand("pick", PickCommand.parse);

        kernel.addCommand("increment", IncrementCommand.parse);

        kernel.addCommand("decrement", DecrementCommand.parse);

        kernel.addCommand("fetch", FetchCommand.parse);
}
