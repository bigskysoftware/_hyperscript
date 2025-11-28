/**
 * Basic command parse tree elements
 * Simple commands with no control flow, plus data manipulation commands
 */

import { varargConstructor } from '../../core/helpers.js';
import { RegExpIterable } from '../../core/util.js';

/**
 * LogCommand - Log values to console
 *
 * Parses: log expr1, expr2, ... [with customLogger]
 * Executes: Logs values to console or custom logger
 */
export class LogCommand {
    constructor(exprs, withExpr) {
        this.exprs = exprs;
        this.withExpr = withExpr;
        this.args = [withExpr, exprs];
    }

    /**
     * Parse log command
     * @param {ParserHelper} helper
     * @returns {LogCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("log")) return;
        var exprs = [helper.parseElement("expression")];
        while (helper.matchOpToken(",")) {
            exprs.push(helper.requireElement("expression"));
        }
        if (helper.matchToken("with")) {
            var withExpr = helper.requireElement("expression");
        }
        return new LogCommand(exprs, withExpr);
    }

    /**
     * Execute log command
     */
    op(ctx, withExpr, values) {
        if (withExpr) {
            withExpr.apply(null, values);
        } else {
            console.log.apply(null, values);
        }
        return ctx.meta.runtime.findNext(this, ctx);
    }
}

/**
 * BeepCommand - Debug beep to console
 *
 * Parses: beep! expr1, expr2, ...
 * Executes: Logs values with debug formatting
 */
export class BeepCommand {
    constructor(exprs) {
        this.exprs = exprs;
        this.args = [exprs];
    }

    /**
     * Parse beep command
     * @param {ParserHelper} helper
     * @returns {BeepCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("beep!")) return;
        var exprs = [helper.parseElement("expression")];
        while (helper.matchOpToken(",")) {
            exprs.push(helper.requireElement("expression"));
        }
        return new BeepCommand(exprs);
    }

    /**
     * Execute beep command
     */
    op(ctx, values) {
        for (let i = 0; i < this.exprs.length; i++) {
            const expr = this.exprs[i];
            const val = values[i];
            ctx.meta.runtime.beepValueToConsole(ctx.me, expr, val);
        }
        return ctx.meta.runtime.findNext(this, ctx);
    }
}

/**
 * ThrowCommand - Throw an error
 *
 * Parses: throw expression
 * Executes: Throws the evaluated expression
 */
export class ThrowCommand {
    constructor(expr) {
        this.expr = expr;
        this.args = [expr];
    }

    /**
     * Parse throw command
     * @param {ParserHelper} helper
     * @returns {ThrowCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("throw")) return;
        var expr = helper.requireElement("expression");
        return new ThrowCommand(expr);
    }

    /**
     * Execute throw command
     */
    op(ctx, expr) {
        ctx.meta.runtime.registerHyperTrace(ctx, expr);
        throw expr;
    }
}

/**
 * ReturnCommand - Return a value from handler
 *
 * Parses: return expression
 * Executes: Returns value and halts execution
 */
export class ReturnCommand {
    constructor(value) {
        this.value = value;
        this.args = [value];
    }

    /**
     * Parse return command
     * @param {ParserHelper} helper
     * @returns {ReturnCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("return")) return;
        if (helper.commandBoundary(helper.currentToken())) {
            helper.raiseParseError("'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
        } else {
            var value = helper.requireElement("expression");
        }
        return new ReturnCommand(value);
    }

    /**
     * Execute return command
     */
    op(context, value) {
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
    }
}

/**
 * ExitCommand - Exit handler without returning value
 *
 * Parses: exit
 * Executes: Exits and halts execution
 */
export class ExitCommand {
    constructor() {
        this.args = [undefined];
    }

    /**
     * Parse exit command
     * @param {ParserHelper} helper
     * @returns {ExitCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("exit")) return;
        return new ExitCommand();
    }

    /**
     * Execute exit command
     */
    op(context, value) {
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
    }
}

/**
 * HaltCommand - Halt event bubbling/default behavior
 *
 * Parses: halt [the event] [bubbling|default]
 * Executes: Stops event propagation/default
 */
export class HaltCommand {
    constructor(bubbling, haltDefault, keepExecuting, exit) {
        this.keepExecuting = keepExecuting;
        this.bubbling = bubbling;
        this.haltDefault = haltDefault;
        this.exit = exit;
    }

    /**
     * Parse halt command
     * @param {ParserHelper} helper
     * @returns {HaltCommand | undefined}
     */
    static parse(helper) {
        if (!helper.matchToken("halt")) return;
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
        // Parse exit as inline structure
        var exit = {
            args: [undefined],
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
            }
        };
        return new HaltCommand(bubbling, haltDefault, keepExecuting, exit);
    }

    /**
     * Execute halt command
     */
    op(ctx) {
        if (ctx.event) {
            if (this.bubbling) {
                ctx.event.stopPropagation();
            } else if (this.haltDefault) {
                ctx.event.preventDefault();
            } else {
                ctx.event.stopPropagation();
                ctx.event.preventDefault();
            }
            if (this.keepExecuting) {
                return ctx.meta.runtime.findNext(this, ctx);
            } else {
                return this.exit;
            }
        }
    }
}

/**
 * MakeCommand - Create/instantiate objects or elements
 *
 * Parses: make [a|an] <expr> [from <args>] [called <symbol>]
 * Executes: Creates DOM elements from query refs or instantiates objects
 */
export class MakeCommand {
    /**
     * Parse make command
     * @param {ParserHelper} helper
     * @returns {MakeCommand | undefined}
     */
    static parse(helper) {
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
    }
}

/**
 * AppendCommand - Append to collection/string/DOM
 *
 * Parses: append <value> [to <target>]
 * Executes: Appends value to array, string, or DOM element
 */
export class AppendCommand {
    /**
     * Parse append command
     * @param {ParserHelper} helper
     * @param {Function} makeSetter - makeSetter function from core grammar
     * @returns {AppendCommand | undefined}
     */
    static parse(helper, makeSetter) {
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
    }
}

/**
 * Helper function to parse pick range syntax
 */
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

/**
 * PickCommand - Pick items, characters, or matches from collections/strings
 *
 * Parses: pick [the] item[s]|character[s] [at|from] <range> from <expr> |
 *         pick [the] match[es] of <regex> from <expr>
 * Executes: Extracts specified range or matches from collection/string
 */
export class PickCommand {
    /**
     * Parse pick command
     * @param {ParserHelper} helper
     * @returns {PickCommand | undefined}
     */
    static parse(helper) {
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
    }
}

/**
 * Helper function to parse conversion info for fetch command
 */
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

/**
 * FetchCommand - HTTP fetch
 *
 * Parses: fetch <url> [as <type>] [with <args>]
 * Executes: Performs HTTP fetch with optional response conversion
 */
export class FetchCommand {
    /**
     * Parse fetch command
     * @param {ParserHelper} helper
     * @returns {FetchCommand | undefined}
     */
    static parse(helper) {
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
    }
}

/**
 * GoCommand - Navigate/scroll to location
 *
 * Parses: go back | go [to] url <url> [in new window] | go [to] [the] [top|middle|bottom] [left|center|right] of <element> [+/- <offset>px] [smoothly|instantly]
 * Executes: Navigate browser history, URL, or scroll to element
 */
export class GoCommand {
    /**
     * Parse go command
     * @param {ParserHelper} helper
     * @returns {GoCommand | undefined}
     */
    static parse(helper) {
        if (helper.matchToken("go")) {
            if (helper.matchToken("back")) {
                var back = true;
            } else {
                helper.matchToken("to");
                if (helper.matchToken("url")) {
                    var target = helper.requireElement("stringLike");
                    var url = true;
                    if (helper.matchToken("in")) {
                        helper.requireToken("new");
                        helper.requireToken("window");
                        var newWindow = true;
                    }
                } else {
                    helper.matchToken("the"); // optional the
                    var verticalPosition = helper.matchAnyToken("top", "middle", "bottom");
                    var horizontalPosition = helper.matchAnyToken("left", "center", "right");
                    if (verticalPosition || horizontalPosition) {
                        helper.requireToken("of");
                    }
                    var target = helper.requireElement("unaryExpression");

                    var plusOrMinus = helper.matchAnyOpToken("+", "-");
                    if (plusOrMinus) {
                        helper.pushFollow("px");
                        try {
                            var offset = helper.requireElement("expression");
                        } finally {
                            helper.popFollow();
                        }
                    }
                    helper.matchToken("px"); // optional px

                    var smoothness = helper.matchAnyToken("smoothly", "instantly");

                    var scrollOptions = {
                        block: "start",
                        inline: "nearest"
                    };

                    if (verticalPosition) {
                        if (verticalPosition.value === "top") {
                            scrollOptions.block = "start";
                        } else if (verticalPosition.value === "bottom") {
                            scrollOptions.block = "end";
                        } else if (verticalPosition.value === "middle") {
                            scrollOptions.block = "center";
                        }
                    }

                    if (horizontalPosition) {
                        if (horizontalPosition.value === "left") {
                            scrollOptions.inline = "start";
                        } else if (horizontalPosition.value === "center") {
                            scrollOptions.inline = "center";
                        } else if (horizontalPosition.value === "right") {
                            scrollOptions.inline = "end";
                        }
                    }

                    if (smoothness) {
                        if (smoothness.value === "smoothly") {
                            scrollOptions.behavior = "smooth";
                        } else if (smoothness.value === "instantly") {
                            scrollOptions.behavior = "instant";
                        }
                    }
                }
            }

            var goCmd = {
                target: target,
                args: [target, offset],
                op: function (ctx, to, offset) {
                    if (back) {
                        window.history.back();
                    } else if (url) {
                        if (to) {
                            if (newWindow) {
                                window.open(to);
                            } else {
                                window.location.href = to;
                            }
                        }
                    } else {
                        context.meta.runtime.implicitLoop(to, function (target) {

                            if (target === window) {
                                target = document.body;
                            }

                            if(plusOrMinus) {
                                // a scroll w/ an offset of some sort
                                let boundingRect = target.getBoundingClientRect();

                                let scrollShim = document.createElement("div");

                                let actualOffset = plusOrMinus.value === "+" ? offset : offset * -1;

                                let offsetX = scrollOptions.inline == "start" || scrollOptions.inline == "end" ? actualOffset : 0;

                                let offsetY = scrollOptions.block == "start" || scrollOptions.block == "end" ? actualOffset : 0;

                                scrollShim.style.position = "absolute";
                                scrollShim.style.top = (boundingRect.top + window.scrollY + offsetY) + "px";
                                scrollShim.style.left = (boundingRect.left + window.scrollX + offsetX) + "px";
                                scrollShim.style.height = boundingRect.height + "px";
                                scrollShim.style.width = boundingRect.width + "px";
                                scrollShim.style.zIndex = "" + Number.MIN_SAFE_INTEGER;
                                scrollShim.style.opacity = "0";

                                document.body.appendChild(scrollShim);
                                setTimeout(function () {
                                    document.body.removeChild(scrollShim);
                                }, 100);

                                target = scrollShim;
                            }

                            target.scrollIntoView(scrollOptions);
                        });
                    }
                    return context.meta.runtime.findNext(goCmd, ctx);
                },
            };
            return goCmd;
        }
    }
}
