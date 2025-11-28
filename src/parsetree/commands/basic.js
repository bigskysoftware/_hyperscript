/**
 * Basic command parse tree elements
 * Simple commands with no control flow
 */

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
