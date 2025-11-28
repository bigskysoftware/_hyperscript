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
import { LogCommand, BeepCommand, ThrowCommand, ReturnCommand, ExitCommand, HaltCommand } from '../parsetree/commands/basic.js';
import { SetCommand, DefaultCommand, IncrementCommand, DecrementCommand } from '../parsetree/commands/setters.js';

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

        parser.addCommand("return", ReturnCommand.parse);

        parser.addCommand("exit", ExitCommand.parse);

        parser.addCommand("halt", HaltCommand.parse);

        parser.addCommand("log", LogCommand.parse);

        parser.addCommand("beep!", BeepCommand.parse);

        parser.addCommand("throw", ThrowCommand.parse);

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

        parser.addCommand("default", DefaultCommand.parse);

        parser.addCommand("set", SetCommand.parse);

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

        parser.addCommand("increment", IncrementCommand.parse);

        parser.addCommand("decrement", DecrementCommand.parse);

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
