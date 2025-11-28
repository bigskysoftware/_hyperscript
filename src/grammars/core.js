// Core grammar for _hyperscript
import { Lexer } from '../core/lexer.js';
import { Runtime } from '../core/runtime.js';
import {ElementCollection, RegExpIterable, TemplatedQueryElementCollection} from '../core/util.js';
import { getOrInitObject, varargConstructor } from '../core/helpers.js';
import { IdRef, ClassRef, QueryRef, AttributeRef, StyleRef } from '../parsetree/expressions/webliterals.js';
import { ParenthesizedExpression, BlockLiteral, NegativeNumber, LogicalNot, SymbolRef, BeepExpression, PropertyAccess, OfExpression, PossessiveExpression, InExpression, AsExpression, FunctionCall, AttributeRefAccess, ArrayIndex, MathOperator, MathExpression, ComparisonOperator, ComparisonExpression, LogicalOperator, LogicalExpression, AsyncExpression } from '../parsetree/expressions/expressions.js';
import { NakedString, StringLiteral, NumberLiteral, BooleanLiteral, NullLiteral, ArrayLiteral, ObjectKey, ObjectLiteral, NamedArgumentList } from '../parsetree/expressions/literals.js';
import { ImplicitMeTarget } from '../parsetree/expressions/targets.js';
import { NoExpression, SomeExpression } from '../parsetree/expressions/existentials.js';
import { RelativePositionalExpression, PositionalExpression } from '../parsetree/expressions/positional.js';
import { LogCommand, BeepCommand, ThrowCommand, ReturnCommand, ExitCommand, HaltCommand, MakeCommand, AppendCommand, PickCommand, FetchCommand, GoCommand } from '../parsetree/commands/basic.js';
import { SetCommand, DefaultCommand, IncrementCommand, DecrementCommand } from '../parsetree/commands/setters.js';
import { WaitCommand, TriggerCommand, SendCommand } from '../parsetree/commands/events.js';
import { IfCommand, RepeatCommand, ForCommand, ContinueCommand, BreakCommand, TellCommand } from '../parsetree/commands/controlflow.js';
import { JsCommand, AsyncCommand, CallCommand, GetCommand } from '../parsetree/commands/execution.js';
import { SetFeature } from '../parsetree/features/set.js';
import { InitFeature } from '../parsetree/features/init.js';
import { WorkerFeature } from '../parsetree/features/worker.js';
import { BehaviorFeature } from '../parsetree/features/behavior.js';
import { InstallFeature } from '../parsetree/features/install.js';
import { JsFeature } from '../parsetree/features/js.js';
import { DefFeature } from '../parsetree/features/def.js';

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
