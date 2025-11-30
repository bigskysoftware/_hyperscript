/**
 * On Feature - Event handlers
 *
 * Parses: on [every] <eventName>[(args...)] [filter] [from <target>] [elsewhere] [in <selector>]
 *         [debounced|throttled at <time>] [queue all|first|last|none] <commands>
 *         [catch <error> <commands>] [finally <commands>] end
 * Executes: Attaches event handlers with support for:
 *   - Multiple event sources (or)
 *   - Event filtering and delegation
 *   - Debouncing and throttling
 *   - Event queueing strategies
 *   - Intersection and mutation observers
 *   - Event count filtering
 */

import { Feature } from '../base.js';

/**
 * Parse event arguments
 * @param {Parser} parser
 * @returns {Array}
 */
function parseEventArgs(parser) {
    var args = [];
    // handle argument list (look ahead 3)
    if (
        parser.token(0).value === "(" &&
        (parser.token(1).value === ")" || parser.token(2).value === "," || parser.token(2).value === ")")
    ) {
        parser.matchOpToken("(");
        do {
            args.push(parser.requireTokenType("IDENTIFIER"));
        } while (parser.matchOpToken(","));
        parser.requireOpToken(")");
    }
    return args;
}

export class OnFeature extends Feature {
    static keyword = "on";

    constructor(displayName, events, start, every, errorHandler, errorSymbol, finallyHandler, queueAll, queueFirst, queueNone, queueLast) {
        super();
        this.displayName = displayName;
        this.events = events;
        this.start = start;
        this.every = every;
        this.execCount = 0;
        this.errorHandler = errorHandler;
        this.errorSymbol = errorSymbol;
        this.finallyHandler = finallyHandler;
        this.queueAll = queueAll;
        this.queueFirst = queueFirst;
        this.queueNone = queueNone;
        this.queueLast = queueLast;
    }

    execute(/** @type {Context} */ ctx) {
        const onFeature = this;
        const every = this.every;
        const queueNone = this.queueNone;
        const queueFirst = this.queueFirst;
        const queueLast = this.queueLast;
        const start = this.start;

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
    }

    install(elt, source, args, runtime) {
        const onFeature = this;
        const displayName = this.displayName;
        const errorHandler = this.errorHandler;
        const errorSymbol = this.errorSymbol;
        const finallyHandler = this.finallyHandler;

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
    }

    /**
     * Parse on feature
     * @param {Parser} parser
     * @returns {OnFeature | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("on")) return;
        var every = false;
        if (parser.matchToken("every")) {
            every = true;
        }
        var events = [];
        var displayName = null;
        do {
            var on = parser.requireElement("eventName", "Expected event name");

            var eventName = on.evaluate(); // OK No Promise

            if (displayName) {
                displayName = displayName + " or " + eventName;
            } else {
                displayName = "on " + eventName;
            }
            var args = parseEventArgs(parser);

            var filter = null;
            if (parser.matchOpToken("[")) {
                filter = parser.requireElement("expression");
                parser.requireOpToken("]");
            }

            var startCount, endCount ,unbounded;
            if (parser.currentToken().type === "NUMBER") {
                var startCountToken = parser.consumeToken();
                if (!startCountToken.value) return;
                startCount = parseInt(startCountToken.value);
                if (parser.matchToken("to")) {
                    var endCountToken = parser.consumeToken();
                    if (!endCountToken.value) return;
                    endCount = parseInt(endCountToken.value);
                } else if (parser.matchToken("and")) {
                    unbounded = true;
                    parser.requireToken("on");
                }
            }

            var intersectionSpec, mutationSpec;
            if (eventName === "intersection") {
                intersectionSpec = {};
                if (parser.matchToken("with")) {
                    intersectionSpec["with"] = parser.requireElement("expression").evaluate();
                }
                if (parser.matchToken("having")) {
                    do {
                        if (parser.matchToken("margin")) {
                            intersectionSpec["rootMargin"] = parser.requireElement("stringLike").evaluate();
                        } else if (parser.matchToken("threshold")) {
                            intersectionSpec["threshold"] = parser.requireElement("expression").evaluate();
                        } else {
                            parser.raiseParseError("Unknown intersection config specification");
                        }
                    } while (parser.matchToken("and"));
                }
            } else if (eventName === "mutation") {
                mutationSpec = {};
                if (parser.matchToken("of")) {
                    do {
                        if (parser.matchToken("anything")) {
                            mutationSpec["attributes"] = true;
                            mutationSpec["subtree"] = true;
                            mutationSpec["characterData"] = true;
                            mutationSpec["childList"] = true;
                        } else if (parser.matchToken("childList")) {
                            mutationSpec["childList"] = true;
                        } else if (parser.matchToken("attributes")) {
                            mutationSpec["attributes"] = true;
                            mutationSpec["attributeOldValue"] = true;
                        } else if (parser.matchToken("subtree")) {
                            mutationSpec["subtree"] = true;
                        } else if (parser.matchToken("characterData")) {
                            mutationSpec["characterData"] = true;
                            mutationSpec["characterDataOldValue"] = true;
                        } else if (parser.currentToken().type === "ATTRIBUTE_REF") {
                            var attribute = parser.consumeToken();
                            if (mutationSpec["attributeFilter"] == null) {
                                mutationSpec["attributeFilter"] = [];
                            }
                            if (attribute.value.indexOf("@") == 0) {
                                mutationSpec["attributeFilter"].push(attribute.value.substring(1));
                            } else {
                                parser.raiseParseError(
                                    "Only shorthand attribute references are allowed here"
                                );
                            }
                        } else {
                            parser.raiseParseError("Unknown mutation config specification");
                        }
                    } while (parser.matchToken("or"));
                } else {
                    mutationSpec["attributes"] = true;
                    mutationSpec["characterData"] = true;
                    mutationSpec["childList"] = true;
                }
            }

            var from = null;
            var elsewhere = false;
            if (parser.matchToken("from")) {
                if (parser.matchToken("elsewhere")) {
                    elsewhere = true;
                } else {
                    parser.pushFollow("or");
                    try {
                        from = parser.requireElement("expression")
                    } finally {
                        parser.popFollow();
                    }
                    if (!from) {
                        parser.raiseParseError('Expected either target value or "elsewhere".');
                    }
                }
            }
            // support both "elsewhere" and "from elsewhere"
            if (from === null && elsewhere === false && parser.matchToken("elsewhere")) {
                elsewhere = true;
            }

            if (parser.matchToken("in")) {
                var inExpr = parser.parseElement('unaryExpression');
            }

            if (parser.matchToken("debounced")) {
                parser.requireToken("at");
                var timeExpr = parser.requireElement("unaryExpression");
                var debounceTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
            } else if (parser.matchToken("throttled")) {
                parser.requireToken("at");
                var timeExpr = parser.requireElement("unaryExpression");
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
        } while (parser.matchToken("or"));

        var queueLast = true;
        if (!every) {
            if (parser.matchToken("queue")) {
                if (parser.matchToken("all")) {
                    var queueAll = true;
                    var queueLast = false;
                } else if (parser.matchToken("first")) {
                    var queueFirst = true;
                } else if (parser.matchToken("none")) {
                    var queueNone = true;
                } else {
                    parser.requireToken("last");
                }
            }
        }

        var start = parser.requireElement("commandList");
        parser.ensureTerminated(start);

        var errorSymbol, errorHandler;
        if (parser.matchToken("catch")) {
            errorSymbol = parser.requireTokenType("IDENTIFIER").value;
            errorHandler = parser.requireElement("commandList");
            parser.ensureTerminated(errorHandler);
        }

        if (parser.matchToken("finally")) {
            var finallyHandler = parser.requireElement("commandList");
            parser.ensureTerminated(finallyHandler);
        }

        var onFeature = new OnFeature(displayName, events, start, every, errorHandler, errorSymbol, finallyHandler, queueAll, queueFirst, queueNone, queueLast);
        parser.setParent(start, onFeature);
        return onFeature;
    }
}