/**
 * Basic command parse tree elements
 * Simple commands with no control flow, plus data manipulation commands
 */

import { RegExpIterable } from '../../core/runtime/collections.js';
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

    get lhs() { return {}; }

    set(ctx, lhs, value) {
        ctx.meta.runtime.setSymbol("result", ctx, null, value);
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
        this.args = { logger: withExpr, values: exprs };
    }

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

    resolve(ctx, { logger, values }) {
        if (logger) {
            logger(...values);
        } else {
            console.log(...values);
        }
        return this.findNext(ctx);
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
        this.args = { values: exprs };
    }

    static parse(parser) {
        if (!parser.matchToken("beep!")) return;
        var exprs = [parser.parseElement("expression")];
        while (parser.matchOpToken(",")) {
            exprs.push(parser.requireElement("expression"));
        }
        return new BeepCommand(exprs);
    }

    resolve(ctx, { values }) {
        for (let i = 0; i < this.exprs.length; i++) {
            const expr = this.exprs[i];
            const val = values[i];
            ctx.meta.runtime.beepValueToConsole(ctx.me, expr, val);
        }
        return this.findNext(ctx);
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
        this.args = { value: expr };
    }

    static parse(parser) {
        if (!parser.matchToken("throw")) return;
        var expr = parser.requireElement("expression");
        return new ThrowCommand(expr);
    }

    resolve(ctx, { value }) {
        ctx.meta.runtime.registerHyperTrace(ctx, value);
        throw value;
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
        this.args = { value };
    }

    static parse(parser) {
        if (!parser.matchToken("return")) return;
        var value;
        if (!parser.commandBoundary(parser.currentToken())) {
            value = parser.requireElement("expression");
        }
        return new ReturnCommand(value);
    }

    resolve(context, { value }) {
        var resolve = context.meta.resolve;
        context.meta.returned = true;
        context.meta.returnValue = value;
        if (resolve) resolve(value);
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

    static parse(parser) {
        if (!parser.matchToken("exit")) return;
        return new ExitCommand();
    }

    resolve(context) {
        var resolve = context.meta.resolve;
        context.meta.returned = true;
        context.meta.returnValue = null;
        if (resolve) {
            resolve();
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
        var exit = new ExitCommand();
        return new HaltCommand(bubbling, haltDefault, keepExecuting, exit);
    }

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
        }
        if (this.keepExecuting) {
            return this.findNext(ctx);
        } else {
            return this.exit;
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
        this.args = variant === "queryRef" ? null : { expr, constructorArgs };
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

    resolve(ctx, { expr, constructorArgs } = {}) {
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
            result.classList.add(...classes);

            ctx.result = result;
        } else {
            ctx.result = new expr(...constructorArgs);
        }

        if (this.target) {
            ctx.meta.runtime.setSymbol(this.target.name, ctx, this.target.scope, ctx.result);
        }

        return this.findNext(ctx);
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

    constructor(value, targetExpr, assignable) {
        super();
        this.value = value;
        this._target = targetExpr;
        this.assignable = assignable;
        if (assignable) {
            this.args = { target: targetExpr, value, ...targetExpr.lhs };
        } else {
            this.args = { target: targetExpr, value };
        }
    }

    static parse(parser) {
        if (!parser.matchToken("append")) return;
        var targetExpr = null;

        var value = parser.requireElement("expression");

        if (parser.matchToken("to")) {
            targetExpr = parser.requireElement("expression");
        } else {
            targetExpr = new ImplicitResultSymbol();
        }

        var checkTarget = targetExpr;
        while (checkTarget.type === "parenthesized") checkTarget = checkTarget.expr;
        var assignable = checkTarget.set != null;

        return new AppendCommand(value, targetExpr, assignable);
    }

    resolve(context, args) {
        var { target, value, ...lhs } = args;
        if (Array.isArray(target)) {
            target.push(value);
            context.meta.runtime.notifyMutation(target);
        } else if (target instanceof Element) {
            if (value instanceof Element) {
                target.insertAdjacentElement("beforeend", value);
            } else {
                target.insertAdjacentHTML("beforeend", value);
            }
            context.meta.runtime.processNode(target);
        } else if(this.assignable) {
            this._target.set(context, lhs, (target || "") + value);
        } else {
            throw new Error("Unable to append a value!")
        }
        return this.findNext(context);
    }
}

/**
 * PickCommand - Extract items from collections
 *
 * Parses: pick first <n> of <expr>
 *         pick last <n> of <expr>
 *         pick random [<n>] of <expr>
 *         pick [the] item[s]|character[s] <range> of|from <expr>
 *         pick [the] match[es] [of] <regex> [|<flags>] of|from <expr>
 */
export class PickCommand extends Command {
    static keyword = "pick";

    constructor(variant, root, range, re, flags, count) {
        super();
        this.variant = variant;
        this.range = range;
        this.flags = flags;
        if (variant === "range") {
            this.args = { root, from: range.from, to: range.to };
        } else if (variant === "first" || variant === "last" || variant === "random") {
            this.args = { root, count };
        } else {
            this.args = { root, re };
        }
    }

    static parsePickRange(parser) {
        parser.matchToken("at") || parser.matchToken("from");
        var rv = { includeStart: true, includeEnd: false };

        rv.from = parser.matchToken("start") ? 0 : parser.requireElement("expression");

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

    static parseSource(parser) {
        if (!parser.matchAnyToken("of", "from")) {
            parser.raiseParseError("Expected 'of' or 'from'");
        }
        return parser.requireElement("expression");
    }

    static parse(parser) {
        if (!parser.matchToken("pick")) return;

        parser.matchToken("the");

        if (parser.matchToken("first")) {
            parser.pushFollow("of");
            parser.pushFollow("from");
            try { var count = parser.requireElement("expression"); }
            finally { parser.popFollow(); parser.popFollow(); }
            var root = PickCommand.parseSource(parser);
            return new PickCommand("first", root, null, null, null, count);
        }

        if (parser.matchToken("last")) {
            parser.pushFollow("of");
            parser.pushFollow("from");
            try { var count = parser.requireElement("expression"); }
            finally { parser.popFollow(); parser.popFollow(); }
            var root = PickCommand.parseSource(parser);
            return new PickCommand("last", root, null, null, null, count);
        }

        if (parser.matchToken("random")) {
            var count = null;
            if (parser.currentToken().type === "NUMBER") {
                parser.pushFollow("of");
                parser.pushFollow("from");
                try { count = parser.requireElement("expression"); }
                finally { parser.popFollow(); parser.popFollow(); }
            }
            var root = PickCommand.parseSource(parser);
            return new PickCommand("random", root, null, null, null, count);
        }

        if (parser.matchToken("item") || parser.matchToken("items")
         || parser.matchToken("character") || parser.matchToken("characters")) {
            parser.pushFollow("of");
            parser.pushFollow("from");
            try { var range = PickCommand.parsePickRange(parser); }
            finally { parser.popFollow(); parser.popFollow(); }
            var root = PickCommand.parseSource(parser);
            return new PickCommand("range", root, range, null, null);
        }

        if (parser.matchToken("match")) {
            parser.matchToken("of");
            parser.pushFollow("of");
            parser.pushFollow("from");
            try {
                var re = parser.parseElement("expression");
                var flags = "";
                if (parser.matchOpToken("|")) {
                    flags = parser.requireTokenType("IDENTIFIER").value;
                }
            } finally { parser.popFollow(); parser.popFollow(); }
            var root = PickCommand.parseSource(parser);
            return new PickCommand("match", root, null, re, flags);
        }

        if (parser.matchToken("matches")) {
            parser.matchToken("of");
            parser.pushFollow("of");
            parser.pushFollow("from");
            try {
                var re = parser.parseElement("expression");
                var flags = "gu";
                if (parser.matchOpToken("|")) {
                    flags = 'g' + parser.requireTokenType("IDENTIFIER").value.replace('g', '');
                }
            } finally { parser.popFollow(); parser.popFollow(); }
            var root = PickCommand.parseSource(parser);
            return new PickCommand("matches", root, null, re, flags);
        }
    }

    resolve(ctx, { root, from, to, re, count }) {
        if (this.variant === "first") {
            ctx.result = root.slice(0, count);
        } else if (this.variant === "last") {
            ctx.result = root.slice(-count);
        } else if (this.variant === "random") {
            if (count == null) {
                ctx.result = root[Math.floor(Math.random() * root.length)];
            } else {
                var copy = Array.from(root);
                var result = [];
                for (var i = 0; i < count && copy.length > 0; i++) {
                    var idx = Math.floor(Math.random() * copy.length);
                    result.push(copy.splice(idx, 1)[0]);
                }
                ctx.result = result;
            }
        } else if (this.variant === "range") {
            if (this.range.toEnd) to = root.length;
            if (!this.range.includeStart) from++;
            if (this.range.includeEnd) to++;
            if (to == null) to = from + 1;
            ctx.result = root.slice(from, to);
        } else if (this.variant === "match") {
            ctx.result = new RegExp(re, this.flags).exec(root);
        } else {
            ctx.result = new RegExpIterable(re, this.flags, root);
        }
        return this.findNext(ctx);
    }
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
        this.args = { url, options: argExprs };
        this.conversionType = conversionType;
        this.conversion = conversion;
    }

    static parseConversionInfo(parser) {
        var type = "text";
        var conversion;
        parser.matchToken("a") || parser.matchToken("an");
        if (parser.matchToken("json") || parser.matchToken("JSON") || parser.matchToken("Object")) {
            type = "json";
        } else if (parser.matchToken("response")) {
            type = "response";
        } else if (parser.matchToken("html") || parser.matchToken("HTML")) {
            type = "html";
        } else if (parser.matchToken("text") || parser.matchToken("String")) {
            // default
        } else {
            conversion = parser.requireElement("dotOrColonPath").evalStatically();
        }
        return {type, conversion};
    }

    static parse(parser) {
        if (!parser.matchToken("fetch")) return;
        var url = parser.parseURLOrExpression();

        if (parser.matchToken("as")) {
            var conversionInfo = FetchCommand.parseConversionInfo(parser);
        }

        if (parser.matchToken("with") && parser.currentToken().value !== "{") {
            var argExprs = parser.parseElement("nakedNamedArgumentList");
        } else {
            var argExprs = parser.parseElement("objectLiteral");
        }

        if (conversionInfo == null && parser.matchToken("as")) {
            conversionInfo = FetchCommand.parseConversionInfo(parser);
        }

        var type = conversionInfo ? conversionInfo.type : "text";
        var conversion = conversionInfo ? conversionInfo.conversion : null;

        return new FetchCommand(url, argExprs, type, conversion);
    }

    resolve(context, { url, options }) {
        const type = this.conversionType;
        const conversion = this.conversion;
        const fetchCmd = this;

        var detail = options || {};
        detail["sender"] = context.me;
        detail["headers"] = detail["headers"] || {}
        var abortController = new AbortController();
        var abortListener = function(){ abortController.abort(); };
        context.me.addEventListener('fetch:abort', abortListener, {once: true});
        detail['signal'] = abortController.signal;
        context.meta.runtime.triggerEvent(context.me, "hyperscript:beforeFetch", detail);
        context.meta.runtime.triggerEvent(context.me, "fetch:beforeRequest", detail);
        var finished = false;
        if (detail.timeout) {
            setTimeout(function () {
                if (!finished) {
                    abortController.abort();
                }
            }, detail.timeout);
        }
        return fetch(url, detail)
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

function _parseScrollModifiers(parser) {
    parser.matchToken("the");
    var verticalPosition = parser.matchAnyToken("top", "middle", "bottom");
    var horizontalPosition = parser.matchAnyToken("left", "center", "right");
    if (verticalPosition || horizontalPosition) {
        parser.requireToken("of");
    }
    var target = parser.requireElement("unaryExpression");

    var plusOrMinus = parser.matchAnyOpToken("+", "-");
    var offset;
    if (plusOrMinus) {
        parser.pushFollow("px");
        try {
            offset = parser.requireElement("expression");
        } finally {
            parser.popFollow();
        }
    }
    parser.matchToken("px");

    var container;
    if (parser.matchToken("in")) {
        container = parser.requireElement("unaryExpression");
    }

    var smoothness = parser.matchAnyToken("smoothly", "instantly");

    var scrollOptions = { block: "start", inline: "nearest" };

    var blockMap = { top: "start", bottom: "end", middle: "center" };
    var inlineMap = { left: "start", center: "center", right: "end" };
    var behaviorMap = { smoothly: "smooth", instantly: "instant" };
    if (verticalPosition) scrollOptions.block = blockMap[verticalPosition.value];
    if (horizontalPosition) scrollOptions.inline = inlineMap[horizontalPosition.value];
    if (smoothness) scrollOptions.behavior = behaviorMap[smoothness.value];

    return { target, offset, plusOrMinus, scrollOptions, container };
}

function _parseSmoothness(parser) {
    var smoothness = parser.matchAnyToken("smoothly", "instantly");
    if (!smoothness) return undefined;
    return smoothness.value === "smoothly" ? "smooth" : "instant";
}

function _resolveScroll(ctx, to, offset, plusOrMinus, scrollOptions, container) {
    ctx.meta.runtime.implicitLoop(to, function (target) {
        if (target === window) target = document.body;

        // "scroll to #item in #container" — scroll within a specific container
        if (container) {
            var ctr = container instanceof Element ? container : container;
            var top = target.offsetTop - ctr.offsetTop;
            var left = target.offsetLeft - ctr.offsetLeft;
            if (plusOrMinus) {
                var adj = plusOrMinus.value === "+" ? offset : offset * -1;
                top += adj;
            }
            ctr.scrollTo({ top, left, behavior: scrollOptions.behavior || "auto" });
            return;
        }

        if (plusOrMinus) {
            var boundingRect = target.getBoundingClientRect();
            var scrollShim = document.createElement("div");
            var actualOffset = plusOrMinus.value === "+" ? offset : offset * -1;
            var offsetX = scrollOptions.inline == "start" || scrollOptions.inline == "end" ? actualOffset : 0;
            var offsetY = scrollOptions.block == "start" || scrollOptions.block == "end" ? actualOffset : 0;

            scrollShim.style.position = "absolute";
            scrollShim.style.top = (boundingRect.top + window.scrollY + offsetY) + "px";
            scrollShim.style.left = (boundingRect.left + window.scrollX + offsetX) + "px";
            scrollShim.style.height = boundingRect.height + "px";
            scrollShim.style.width = boundingRect.width + "px";
            scrollShim.style.zIndex = "" + Number.MIN_SAFE_INTEGER;
            scrollShim.style.opacity = "0";

            document.body.appendChild(scrollShim);
            setTimeout(function () { document.body.removeChild(scrollShim); }, 100);
            target = scrollShim;
        }

        target.scrollIntoView(scrollOptions);
    });
}

/**
 * ScrollCommand - Scroll to element or scroll by amount
 *
 * Parses:
 *   scroll to [the] [top|middle|bottom] [left|center|right] [of] <expr> [+/- <offset>px] [in <container>] [smoothly|instantly]
 *   scroll [<target>] [up|down|left|right] by <amount>px [smoothly|instantly]
 */
export class ScrollCommand extends Command {
    static keyword = "scroll";

    constructor(target, offset, plusOrMinus, scrollOptions, container, byMode) {
        super();
        this.target = target;
        this.plusOrMinus = plusOrMinus;
        this.scrollOptions = scrollOptions;
        this.byMode = byMode;
        this.args = { target, offset, container };
    }

    static parse(parser) {
        if (!parser.matchToken("scroll")) return;

        // scroll to ... form
        if (parser.matchToken("to")) {
            var scroll = _parseScrollModifiers(parser);
            return new ScrollCommand(scroll.target, scroll.offset, scroll.plusOrMinus, scroll.scrollOptions, scroll.container);
        }

        // scroll [<target>] [up|down|left|right] by <amount>px [smoothly|instantly]
        var direction = parser.matchAnyToken("up", "down", "left", "right");
        var target;

        if (!direction && parser.currentToken().value !== "by") {
            target = parser.requireElement("unaryExpression");
            direction = parser.matchAnyToken("up", "down", "left", "right");
        }

        parser.requireToken("by");

        parser.pushFollow("px");
        var offset;
        try {
            offset = parser.requireElement("expression");
        } finally {
            parser.popFollow();
        }
        parser.matchToken("px");

        var behavior = _parseSmoothness(parser);
        var scrollOptions = {};
        if (behavior) scrollOptions.behavior = behavior;

        var byMode = { direction: direction ? direction.value : "down" };
        return new ScrollCommand(target, offset, null, scrollOptions, null, byMode);
    }

    resolve(ctx, { target, offset, container }) {
        if (this.byMode) {
            var el = target || document.documentElement;
            var dir = this.byMode.direction;
            var top = (dir === "up" || dir === "down") ? (dir === "up" ? -offset : offset) : 0;
            var left = (dir === "left" || dir === "right") ? (dir === "left" ? -offset : offset) : 0;
            var opts = { top, left };
            if (this.scrollOptions.behavior) opts.behavior = this.scrollOptions.behavior;
            el.scrollBy(opts);
        } else {
            _resolveScroll(ctx, target, offset, this.plusOrMinus, this.scrollOptions, container);
        }
        return this.findNext(ctx);
    }
}

/**
 * GoCommand - Navigate or scroll (scroll form deprecated, use ScrollCommand)
 *
 * Parses: go back | go [to] <url-or-expr> [in new window]
 */
export class GoCommand extends Command {
    static keyword = "go";

    constructor(target, offset, back, newWindow, plusOrMinus, scrollOptions) {
        super();
        this.target = target;
        this.args = { target, offset };
        this.back = back;
        this.newWindow = newWindow;
        this.plusOrMinus = plusOrMinus;
        this.scrollOptions = scrollOptions;
    }

    static parse(parser) {
        if (!parser.matchToken("go")) return;

        if (parser.matchToken("back")) {
            return new GoCommand(null, null, true);
        }

        parser.matchToken("to");

        // deprecated: go [to] url <stringLike>
        if (parser.matchToken("url")) {
            var target = parser.requireElement("stringLike");
            var newWindow = false;
            if (parser.matchToken("in")) {
                parser.requireToken("new");
                parser.requireToken("window");
                newWindow = true;
            }
            return new GoCommand(target, null, false, newWindow);
        }

        // deprecated: go [to] [the] top/middle/bottom ... of <expr> (scroll form)
        var cur = parser.currentToken();
        if (cur.value === "the" || cur.value === "top" || cur.value === "middle" || cur.value === "bottom"
            || cur.value === "left" || cur.value === "center" || cur.value === "right") {
            var scroll = _parseScrollModifiers(parser);
            return new GoCommand(scroll.target, scroll.offset, false, false, scroll.plusOrMinus, scroll.scrollOptions);
        }

        // new: go [to] <url-or-expression> [in new window]
        var target = parser.parseURLOrExpression();
        var newWindow = false;
        if (parser.matchToken("in")) {
            parser.requireToken("new");
            parser.requireToken("window");
            newWindow = true;
        }
        return new GoCommand(target, null, false, newWindow);
    }

    resolve(ctx, { target: to, offset }) {
        if (this.back) {
            window.history.back();
        } else if (this.scrollOptions) {
            // deprecated scroll form
            _resolveScroll(ctx, to, offset, this.plusOrMinus, this.scrollOptions);
        } else if (to != null) {
            if (to instanceof Element) {
                // element -> scroll (backwards compat)
                to.scrollIntoView({ block: "start", inline: "nearest" });
            } else {
                var str = String(to);
                if (str.startsWith("#")) {
                    window.location.hash = str;
                } else if (this.newWindow) {
                    window.open(str);
                } else {
                    window.location.href = str;
                }
            }
        }
        return this.findNext(ctx);
    }
}
