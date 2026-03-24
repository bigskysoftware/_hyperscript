/**
 * Basic command parse tree elements
 * Simple commands with no control flow, plus data manipulation commands
 */

import { varargConstructor } from '../../core/runtime.js';
import { RegExpIterable } from '../../core/runtime.js';
import { SetCommand } from './setters.js';
import { Command, Expression } from '../base.js';

/**
 * ImplicitResultSymbol - Represents the implicit "result" symbol
 */
class ImplicitResultSymbol extends Expression {
    constructor() {
        super();
        this.type = "symbol";
    }

    resolve(context) {
        return context.meta.runtime.resolveSymbol("result", context);
    }
}

/**
 * ExitOperation - Handles exit/return from function execution
 */
class ExitOperation extends Command {
    constructor() {
        super();
        this.args = [undefined];
    }

    resolve(context, value) {
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
 * LogCommand - Log values to console
 *
 * Parses: log expr1, expr2, ... [with customLogger]
 * Executes: Logs values to console or custom logger
 */
export class LogCommand extends Command {
    static keyword = "log";

    constructor(exprs, withExpr) {
        super();
        this.exprs = exprs;
        this.withExpr = withExpr;
        this.args = [withExpr, exprs];
    }

    /**
     * Parse log command
     * @param {Parser} parser
     * @returns {LogCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("log")) return;
        var exprs = [parser.parseElement("expression")];
        while (parser.matchOpToken(",")) {
            exprs.push(parser.requireElement("expression"));
        }
        if (parser.matchToken("with")) {
            var withExpr = parser.requireElement("expression");
        }
        return new LogCommand(exprs, withExpr);
    }

    /**
     * Execute log command
     */
    resolve(ctx, withExpr, values) {
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
export class BeepCommand extends Command {
    static keyword = "beep!";

    constructor(exprs) {
        super();
        this.exprs = exprs;
        this.args = [exprs];
    }

    /**
     * Parse beep command
     * @param {Parser} parser
     * @returns {BeepCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("beep!")) return;
        var exprs = [parser.parseElement("expression")];
        while (parser.matchOpToken(",")) {
            exprs.push(parser.requireElement("expression"));
        }
        return new BeepCommand(exprs);
    }

    /**
     * Execute beep command
     */
    resolve(ctx, values) {
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
export class ThrowCommand extends Command {
    static keyword = "throw";

    constructor(expr) {
        super();
        this.expr = expr;
        this.args = [expr];
    }

    /**
     * Parse throw command
     * @param {Parser} parser
     * @returns {ThrowCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("throw")) return;
        var expr = parser.requireElement("expression");
        return new ThrowCommand(expr);
    }

    /**
     * Execute throw command
     */
    resolve(ctx, expr) {
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
export class ReturnCommand extends Command {
    static keyword = "return";

    constructor(value) {
        super();
        this.value = value;
        this.args = [value];
    }

    /**
     * Parse return command
     * @param {Parser} parser
     * @returns {ReturnCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("return")) return;
        if (parser.commandBoundary(parser.currentToken())) {
            parser.raiseParseError("'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
        } else {
            var value = parser.requireElement("expression");
        }
        return new ReturnCommand(value);
    }

    /**
     * Execute return command
     */
    resolve(context, value) {
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
export class ExitCommand extends Command {
    static keyword = "exit";

    constructor() {
        super();
        this.args = [undefined];
    }

    /**
     * Parse exit command
     * @param {Parser} parser
     * @returns {ExitCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("exit")) return;
        return new ExitCommand();
    }

    /**
     * Execute exit command
     */
    resolve(context, value) {
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
export class HaltCommand extends Command {
    static keyword = "halt";

    constructor(bubbling, haltDefault, keepExecuting, exit) {
        super();
        this.keepExecuting = keepExecuting;
        this.bubbling = bubbling;
        this.haltDefault = haltDefault;
        this.exit = exit;
    }

    /**
     * Parse halt command
     * @param {Parser} parser
     * @returns {HaltCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("halt")) return;
        if (parser.matchToken("the")) {
            parser.requireToken("event");
            // optional possessive
            if (parser.matchOpToken("'")) {
                parser.requireToken("s");
            }
            var keepExecuting = true;
        }
        if (parser.matchToken("bubbling")) {
            var bubbling = true;
        } else if (parser.matchToken("default")) {
            var haltDefault = true;
        }
        var exit = new ExitOperation();
        return new HaltCommand(bubbling, haltDefault, keepExecuting, exit);
    }

    /**
     * Execute halt command
     */
    resolve(ctx) {
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
export class MakeCommand extends Command {
    static keyword = "make";

    constructor(variant, expr, constructorArgs, target) {
        super();
        this.variant = variant;
        this.expr = expr;
        this.constructorArgs = constructorArgs;
        this.target = target;
        this.args = variant === "queryRef" ? [] : [expr, constructorArgs];
    }

    static parse(parser) {
        if (!parser.matchToken("make")) return;
        parser.matchToken("a") || parser.matchToken("an");

        var expr = parser.requireElement("expression");

        var args = [];
        if (expr.type !== "queryRef" && parser.matchToken("from")) {
            do {
                args.push(parser.requireElement("expression"));
            } while (parser.matchOpToken(","));
        }

        if (parser.matchToken("called")) {
            var target = parser.requireElement("symbol");
        }

        if (expr.type === "queryRef") {
            return new MakeCommand("queryRef", expr, null, target);
        } else {
            return new MakeCommand("constructor", expr, args, target);
        }
    }

    resolve(ctx, expr, args) {
        if (this.variant === "queryRef") {
            var match,
                tagname = "div",
                id,
                classes = [];
            var re = /(?:(^|#|\.)([^#\. ]+))/g;
            while ((match = re.exec(this.expr.css))) {
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
        } else {
            ctx.result = varargConstructor(expr, args);
        }

        if (this.target) {
            ctx.meta.runtime.setSymbol(this.target.name, ctx, this.target.scope, ctx.result);
        }

        return ctx.meta.runtime.findNext(this, ctx);
    }
}

/**
 * AppendCommand - Append to collection/string/DOM
 *
 * Parses: append <value> [to <target>]
 * Executes: Appends value to array, string, or DOM element
 */
export class AppendCommand extends Command {
    static keyword = "append";

    constructor(value, targetExpr, setter) {
        super();
        this.value = value;
        this.target = targetExpr;
        this.setter = setter;
        this.args = [targetExpr, value];
    }

    /**
     * Parse append command
     * @param {Parser} parser
     * @returns {AppendCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("append")) return;
        var targetExpr = null;

        var value = parser.requireElement("expression");

        var implicitResultSymbol = new ImplicitResultSymbol();

        if (parser.matchToken("to")) {
            targetExpr = parser.requireElement("expression");
        } else {
            targetExpr = implicitResultSymbol;
        }

        var setter = null;
        var checkTarget = targetExpr;
        while (checkTarget.type === "parenthesized") checkTarget = checkTarget.expr;
        if (checkTarget.type === "symbol" || checkTarget.type === "attributeRef" || checkTarget.root != null) {
            setter = SetCommand.makeSetter(parser, targetExpr, implicitResultSymbol);
        }

        var command = new AppendCommand(value, targetExpr, setter);

        if (setter != null) {
            setter.parent = command;
        }

        return command;
    }

    resolve(context, target, value) {
        if (Array.isArray(target)) {
            target.push(value);
            return context.meta.runtime.findNext(this, context);
        } else if (target instanceof Element) {
            if (value instanceof Element) {
                target.insertAdjacentElement("beforeend", value);
            } else {
                target.insertAdjacentHTML("beforeend", value);
            }
            context.meta.runtime.processNode(target);
            return context.meta.runtime.findNext(this, context);
        } else if(this.setter) {
            context.result = (target || "") + value;
            return this.setter;
        } else {
            throw Error("Unable to append a value!")
        }
    }
}

/**
 * Helper function to parse pick range syntax
 */
function parsePickRange(parser) {
    parser.matchToken("at") || parser.matchToken("from");
    const rv = { includeStart: true, includeEnd: false }

    rv.from = parser.matchToken("start") ? 0 : parser.requireElement("expression")

    if (parser.matchToken("to") || parser.matchOpToken("..")) {
      if (parser.matchToken("end")) {
        rv.toEnd = true;
      } else {
        rv.to = parser.requireElement("expression");
      }
    }

    if (parser.matchToken("inclusive")) rv.includeEnd = true;
    else if (parser.matchToken("exclusive")) rv.includeStart = false;

    return rv;
}

/**
 * PickCommand - Pick items, characters, or matches from collections/strings
 *
 * Parses: pick [the] item[s]|character[s] [at|from] <range> from <expr> |
 *         pick [the] match[es] of <regex> from <expr>
 * Executes: Extracts specified range or matches from collection/string
 */
export class PickCommand extends Command {
    static keyword = "pick";

    constructor(variant, root, range, re, flags) {
        super();
        this.variant = variant;
        this.range = range;
        this.flags = flags;
        if (variant === "range") {
            this.args = [root, range.from, range.to];
        } else {
            this.args = [root, re];
        }
    }

    static parse(parser) {
        if (!parser.matchToken("pick")) return;

        parser.matchToken("the");

        if (parser.matchToken("item") || parser.matchToken("items")
         || parser.matchToken("character") || parser.matchToken("characters")) {
            const range = parsePickRange(parser);

            parser.requireToken("from");
            const root = parser.requireElement("expression");

            return new PickCommand("range", root, range, null, null);
        }

        if (parser.matchToken("match")) {
            parser.matchToken("of");
            const re = parser.parseElement("expression");
            let flags = ""
            if (parser.matchOpToken("|")) {
                flags = parser.requireTokenType("IDENTIFIER").value;
            }

            parser.requireToken("from");
            const root = parser.parseElement("expression");

            return new PickCommand("match", root, null, re, flags);
        }

        if (parser.matchToken("matches")) {
            parser.matchToken("of");
            const re = parser.parseElement("expression");
            let flags = "gu"
            if (parser.matchOpToken("|")) {
                flags = 'g' + parser.requireTokenType("IDENTIFIER").value.replace('g', '');
            }

            parser.requireToken("from");
            const root = parser.parseElement("expression");

            return new PickCommand("matches", root, null, re, flags);
        }
    }

    resolve(ctx, root, secondArg, thirdArg) {
        if (this.variant === "range") {
            var from = secondArg;
            var to = thirdArg;
            if (this.range.toEnd) to = root.length;
            if (!this.range.includeStart) from++;
            if (this.range.includeEnd) to++;
            if (to == null || to == undefined) to = from + 1;
            ctx.result = root.slice(from, to);
        } else if (this.variant === "match") {
            ctx.result = new RegExp(secondArg, this.flags).exec(root);
        } else {
            ctx.result = new RegExpIterable(secondArg, this.flags, root);
        }
        return ctx.meta.runtime.findNext(this, ctx);
    }
}

/**
 * Helper function to parse conversion info for fetch command
 */
function parseConversionInfo(parser) {
    var type = "text";
    var conversion;
    parser.matchToken("a") || parser.matchToken("an");
    if (parser.matchToken("json") || parser.matchToken("Object")) {
        type = "json";
    } else if (parser.matchToken("response")) {
        type = "response";
    } else if (parser.matchToken("html")) {
        type = "html";
    } else if (parser.matchToken("text")) {
        // default, ignore
    } else {
        conversion = parser.requireElement("dotOrColonPath").evaluate();
    }
    return {type, conversion};
}

/**
 * FetchCommand - HTTP fetch
 *
 * Parses: fetch <url> [as <type>] [with <args>]
 * Executes: Performs HTTP fetch with optional response conversion
 */
export class FetchCommand extends Command {
    static keyword = "fetch";

    constructor(url, argExprs, conversionType, conversion) {
        super();
        this.url = url;
        this.argExpressions = argExprs;
        this.args = [url, argExprs];
        this.conversionType = conversionType;
        this.conversion = conversion;
    }

    static parse(parser) {
        if (!parser.matchToken("fetch")) return;
        var url = parser.requireElement("stringLike");

        if (parser.matchToken("as")) {
            var conversionInfo = parseConversionInfo(parser);
        }

        if (parser.matchToken("with") && parser.currentToken().value !== "{") {
            var argExprs = parser.parseElement("nakedNamedArgumentList");
        } else {
            var argExprs = parser.parseElement("objectLiteral");
        }

        if (conversionInfo == null && parser.matchToken("as")) {
            conversionInfo = parseConversionInfo(parser);
        }

        var type = conversionInfo ? conversionInfo.type : "text";
        var conversion = conversionInfo ? conversionInfo.conversion : null;

        return new FetchCommand(url, argExprs, type, conversion);
    }

    resolve(context, url, args) {
        const type = this.conversionType;
        const conversion = this.conversion;
        const fetchCmd = this;

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
    }
}

/**
 * GoCommand - Navigate/scroll to location
 *
 * Parses: go back | go [to] url <url> [in new window] | go [to] [the] [top|middle|bottom] [left|center|right] of <element> [+/- <offset>px] [smoothly|instantly]
 * Executes: Navigate browser history, URL, or scroll to element
 */
export class GoCommand extends Command {
    static keyword = "go";

    constructor(target, offset, back, url, newWindow, plusOrMinus, scrollOptions) {
        super();
        this.target = target;
        this.args = [target, offset];
        this.back = back;
        this.url = url;
        this.newWindow = newWindow;
        this.plusOrMinus = plusOrMinus;
        this.scrollOptions = scrollOptions;
    }

    static parse(parser) {
        if (parser.matchToken("go")) {
            if (parser.matchToken("back")) {
                var back = true;
            } else {
                parser.matchToken("to");
                if (parser.matchToken("url")) {
                    var target = parser.requireElement("stringLike");
                    var url = true;
                    if (parser.matchToken("in")) {
                        parser.requireToken("new");
                        parser.requireToken("window");
                        var newWindow = true;
                    }
                } else {
                    parser.matchToken("the"); // optional the
                    var verticalPosition = parser.matchAnyToken("top", "middle", "bottom");
                    var horizontalPosition = parser.matchAnyToken("left", "center", "right");
                    if (verticalPosition || horizontalPosition) {
                        parser.requireToken("of");
                    }
                    var target = parser.requireElement("unaryExpression");

                    var plusOrMinus = parser.matchAnyOpToken("+", "-");
                    if (plusOrMinus) {
                        parser.pushFollow("px");
                        try {
                            var offset = parser.requireElement("expression");
                        } finally {
                            parser.popFollow();
                        }
                    }
                    parser.matchToken("px"); // optional px

                    var smoothness = parser.matchAnyToken("smoothly", "instantly");

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

            return new GoCommand(target, offset, back, url, newWindow, plusOrMinus, scrollOptions);
        }
    }

    resolve(ctx, to, offset) {
        if (this.back) {
            window.history.back();
        } else if (this.url) {
            if (to) {
                if (this.newWindow) {
                    window.open(to);
                } else {
                    window.location.href = to;
                }
            }
        } else {
            const plusOrMinus = this.plusOrMinus;
            const scrollOptions = this.scrollOptions;
            ctx.meta.runtime.implicitLoop(to, function (target) {

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
        return ctx.meta.runtime.findNext(this, ctx);
    }
}
