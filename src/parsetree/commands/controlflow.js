/**
 * Control flow command parse tree elements
 * Commands for control flow (if, repeat, for, continue, break, tell)
 */

import { Command } from '../base.js';

/**
 * WaitATick - Wait for next event loop tick
 * Used in event-based loops to allow events to trigger
 */
class WaitATick extends Command {
    constructor() {
        super();
        this.type = "waitATick";
    }

    op(context) {
        const self = this;
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(context.meta.runtime.findNext(self));
            }, 0);
        });
    }
}

/**
 * RepeatLoopCommand - The actual loop iteration logic
 */
class RepeatLoopCommand extends Command {
    constructor(config, loop) {
        super();
        this.identifier = config.identifier;
        this.indexIdentifier = config.indexIdentifier;
        this.slot = config.slot;
        this.expression = config.expression;
        this.forever = config.forever;
        this.times = config.times;
        this.until = config.until;
        this.event = config.event;
        this.on = config.on;
        this.whileExpr = config.whileExpr;
        this.loop = loop;
        this.args = [config.whileExpr, config.times];
    }

    resolveNext() {
        return this;
    }

    op(context, whileValue, times) {
        var iteratorInfo = context.meta.iterators[this.slot];
        var keepLooping = false;
        var loopVal = null;

        if (this.forever) {
            keepLooping = true;
        } else if (this.until) {
            if (this.event) {
                keepLooping = context.meta.iterators[this.slot].eventFired === false;
            } else {
                keepLooping = whileValue !== true;
            }
        } else if (this.whileExpr) {
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
                context.result = context.locals[this.identifier] = loopVal;
            } else {
                context.result = iteratorInfo.index;
            }
            if (this.indexIdentifier) {
                context.locals[this.indexIdentifier] = iteratorInfo.index;
            }
            iteratorInfo.index++;
            return this.loop;
        } else {
            context.meta.iterators[this.slot] = null;
            return context.meta.runtime.findNext(this.parent, context);
        }
    }
}

/**
 * RepeatInitCommand - Initializes the loop iterator
 */
class RepeatInitCommand extends Command {
    constructor(expression, evt, on, slot, repeatLoopCommand) {
        super();
        this.name = "repeatInit";
        this.expression = expression;
        this.evt = evt;
        this.on = on;
        this.slot = slot;
        this.repeatLoopCommand = repeatLoopCommand;
        this.args = [expression, evt, on];
    }

    op(context, value, event, on) {
        var iteratorInfo = {
            index: 0,
            value: value,
            eventFired: false,
        };
        context.meta.iterators[this.slot] = iteratorInfo;

        if (value) {
            if (value[Symbol.iterator]) {
                iteratorInfo.iterator = value[Symbol.iterator]();
            } else {
                iteratorInfo.iterator = Object.keys(value)[Symbol.iterator]();
            }
        }

        if (this.evt) {
            var target = on || context.me;
            const slot = this.slot;
            target.addEventListener(
                event,
                function (e) {
                    context.meta.iterators[slot].eventFired = true;
                },
                { once: true }
            );
        }

        return this.repeatLoopCommand;
    }
}

/**
 * IfCommand - Conditional execution
 *
 * Parses: if <expr> [then] <commands> [else|otherwise <commands>] [end]
 * Executes: Conditionally executes true or false branch based on expression
 */
class IfCommandImpl extends Command {
    constructor(expr, trueBranch, falseBranch) {
        super();
        this.type = "ifCommand";
        this.expr = expr;
        this.trueBranch = trueBranch;
        this.falseBranch = falseBranch;
        this.args = [expr];
    }

    op(context, exprValue) {
        if (exprValue) {
            return this.trueBranch;
        } else if (this.falseBranch) {
            return this.falseBranch;
        } else {
            return context.meta.runtime.findNext(this, context);
        }
    }
}

export class IfCommand {
    static keyword = "if";

    /**
     * Parse if command
     * @param {Parser} parser
     * @returns {IfCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("if")) return;
        var expr = parser.requireElement("expression");
        parser.matchToken("then"); // optional 'then'
        var trueBranch = parser.parseElement("commandList");
        var nestedIfStmt = false;
        let elseToken = parser.matchToken("else") || parser.matchToken("otherwise");
        if (elseToken) {
            let elseIfIfToken = parser.peekToken("if");
            nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
            if (nestedIfStmt) {
                var falseBranch = parser.parseElement("command");
            } else {
                var falseBranch = parser.parseElement("commandList");
            }
        }
        if (parser.hasMore() && !nestedIfStmt) {
            parser.requireToken("end");
        }

        var ifCmd = new IfCommandImpl(expr, trueBranch, falseBranch);
        parser.setParent(trueBranch, ifCmd);
        parser.setParent(falseBranch, ifCmd);
        return ifCmd;
    }
}

/**
 * Helper function to parse repeat/for expressions
 */
function parseRepeatExpression(parser, startedWithForToken) {
    var innerStartToken = parser.currentToken();
    var identifier;
    if (parser.matchToken("for") || startedWithForToken) {
        var identifierToken = parser.requireTokenType("IDENTIFIER");
        identifier = identifierToken.value;
        parser.requireToken("in");
        var expression = parser.requireElement("expression");
    } else if (parser.matchToken("in")) {
        identifier = "it";
        var expression = parser.requireElement("expression");
    } else if (parser.matchToken("while")) {
        var whileExpr = parser.requireElement("expression");
    } else if (parser.matchToken("until")) {
        var isUntil = true;
        if (parser.matchToken("event")) {
            var evt = parser.requireElement("dotOrColonPath", "Expected event name");
            if (parser.matchToken("from")) {
                var on = parser.requireElement("expression");
            }
        } else {
            var whileExpr = parser.requireElement("expression");
        }
    } else {
        if (!parser.commandBoundary(parser.currentToken()) &&
            parser.currentToken().value !== 'forever') {
            var times = parser.requireElement("expression");
            parser.requireToken("times");
        } else {
            parser.matchToken("forever"); // consume optional forever
            var forever = true;
        }
    }

    if (parser.matchToken("index")) {
        var identifierToken = parser.requireTokenType("IDENTIFIER");
        var indexIdentifier = identifierToken.value;
    } else if (parser.matchToken("indexed")) {
        parser.requireToken("by");
        var identifierToken = parser.requireTokenType("IDENTIFIER");
        var indexIdentifier = identifierToken.value;
    }

    var loop = parser.parseElement("commandList");
    if (loop && evt) {
        // if this is an event based loop, wait a tick at the end of the loop so that
        // events have a chance to trigger in the loop condition o_O)))
        var last = loop;
        while (last.next) {
            last = last.next;
        }
        var waitATick = new WaitATick();
        last.next = waitATick;
    }
    if (parser.hasMore()) {
        parser.requireToken("end");
    }

    if (identifier == null) {
        identifier = "_implicit_repeat_" + innerStartToken.start;
        var slot = identifier;
    } else {
        var slot = identifier + "_" + innerStartToken.start;
    }

    const loopConfig = {
        identifier: identifier,
        indexIdentifier: indexIdentifier,
        slot: slot,
        expression: expression,
        forever: forever,
        times: times,
        until: isUntil,
        event: evt,
        on: on,
        whileExpr: whileExpr
    };

    const repeatLoopCommand = new RepeatLoopCommand(loopConfig, loop);
    const repeatInitCommand = new RepeatInitCommand(expression, evt, on, slot, repeatLoopCommand);

    parser.setParent(loop, repeatLoopCommand);
    parser.setParent(repeatLoopCommand, repeatInitCommand);

    return repeatInitCommand;
}

/**
 * RepeatCommand - Loop with various forms
 *
 * Parses: repeat [for x in expr] | [in expr] | [while expr] | [until expr|event] | [n times] | [forever]
 * Executes: Loops according to the specified condition
 */
export class RepeatCommand {
    static keyword = "repeat";

    /**
     * Parse repeat command
     * @param {Parser} parser
     * @returns {RepeatCommand | undefined}
     */
    static parse(parser) {
        if (parser.matchToken("repeat")) {
            return parseRepeatExpression(parser, false);
        }
    }
}

/**
 * ForCommand - For loop (shares parser with repeat)
 *
 * Parses: for <identifier> in <expr> <commands> end
 * Executes: Iterates over expression values
 */
export class ForCommand {
    static keyword = "for";

    /**
     * Parse for command
     * @param {Parser} parser
     * @returns {ForCommand | undefined}
     */
    static parse(parser) {
        if (parser.matchToken("for")) {
            return parseRepeatExpression(parser, true);
        }
    }
}

/**
 * ContinueCommand - Continue loop
 *
 * Parses: continue
 * Executes: Continues to next iteration of closest repeat loop
 */
class ContinueCommandImpl extends Command {
    constructor(parser) {
        super();
        this.type = "continueCommand";
        this.parser = parser;
    }

    op(context) {
        // scan for the closest repeat statement
        for (var parent = this.parent; true; parent = parent.parent) {
            if (parent == undefined) {
                this.parser.raiseParseError("Command `continue` cannot be used outside of a `repeat` loop.");
            }
            if (parent.loop != undefined) {
                return parent.resolveNext(context);
            }
        }
    }
}

export class ContinueCommand {
    static keyword = "continue";

    /**
     * Parse continue command
     * @param {Parser} parser
     * @returns {ContinueCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("continue")) return;
        return new ContinueCommandImpl(parser);
    }
}

/**
 * BreakCommand - Break loop
 *
 * Parses: break
 * Executes: Exits closest repeat loop
 */
class BreakCommandImpl extends Command {
    constructor(parser) {
        super();
        this.type = "breakCommand";
        this.parser = parser;
    }

    op(context) {
        // scan for the closest repeat statement
        for (var parent = this.parent; true; parent = parent.parent) {
            if (parent == undefined) {
                this.parser.raiseParseError("Command `break` cannot be used outside of a `repeat` loop.");
            }
            if (parent.loop != undefined) {
                return context.meta.runtime.findNext(parent.parent, context);
            }
        }
    }
}

export class BreakCommand {
    static keyword = "break";

    /**
     * Parse break command
     * @param {Parser} parser
     * @returns {BreakCommand | undefined}
     */
    static parse(parser) {
        if (!parser.matchToken("break")) return;
        return new BreakCommandImpl(parser);
    }
}

/**
 * TellCommand - Send command to other element
 *
 * Parses: tell <expr> <commands> end
 * Executes: Executes commands with 'you' set to target element(s)
 */
class TellCommandImpl extends Command {
    constructor(value, body, slot) {
        super();
        this.type = "tellCommand";
        this.value = value;
        this.body = body;
        this.slot = slot;
        this.args = [value];
    }

    resolveNext(context) {
        var iterator = context.meta.iterators[this.slot];
        if (iterator.index < iterator.value.length) {
            context.you = iterator.value[iterator.index++];
            return this.body;
        } else {
            // restore original me
            context.you = iterator.originalYou;
            if (this.next) {
                return this.next;
            } else {
                return context.meta.runtime.findNext(this.parent, context);
            }
        }
    }

    op(context, value) {
        if (value == null) {
            value = [];
        } else if (!(Array.isArray(value) || value instanceof NodeList)) {
            value = [value];
        }
        context.meta.iterators[this.slot] = {
            originalYou: context.you,
            index: 0,
            value: value,
        };
        return this.resolveNext(context);
    }
}

export class TellCommand {
    static keyword = "tell";

    /**
     * Parse tell command
     * @param {Parser} parser
     * @returns {TellCommand | undefined}
     */
    static parse(parser) {
        var startToken = parser.currentToken();
        if (!parser.matchToken("tell")) return;
        var value = parser.requireElement("expression");
        var body = parser.requireElement("commandList");
        if (parser.hasMore() && !parser.featureStart(parser.currentToken())) {
            parser.requireToken("end");
        }
        var slot = "tell_" + startToken.start;
        var tellCmd = new TellCommandImpl(value, body, slot);
        parser.setParent(body, tellCmd);
        return tellCmd;
    }
}
